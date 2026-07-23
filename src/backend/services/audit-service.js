const fs = require("node:fs");
const path = require("node:path");

const AUDIT_FILE = path.resolve(__dirname, "../../database/audit.log");

function redact(value) {
  if (!value || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value, (key, current) => {
    if (["password", "token", "authorization"].includes(String(key).toLowerCase())) return "[redacted]";
    return current;
  }));
}

function writeAudit(entry) {
  const record = {
    fecha: new Date().toISOString(),
    usuario: entry.user?.email || "anonimo",
    rol: entry.user?.rol || "sin rol",
    accion: entry.action,
    modulo: entry.module,
    registro: entry.recordId || null,
    ip: entry.ip || "desconocida",
    resultado: entry.result || "ok",
    anterior: redact(entry.before) || null,
    nuevo: redact(entry.after) || null,
    error: entry.error || null,
  };
  fs.mkdirSync(path.dirname(AUDIT_FILE), { recursive: true });
  fs.appendFileSync(AUDIT_FILE, `${JSON.stringify(record)}\n`, "utf8");
}
function parseLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function readAudit(options = {}) {
  const page = Math.max(1, Number(options.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(options.pageSize || 20)));
  const filters = {
    usuario: options.usuario || "",
    modulo: options.modulo || "",
    accion: options.accion || "",
    resultado: options.resultado || "",
    desde: options.desde || "",
    hasta: options.hasta || "",
  };
  const lines = fs.existsSync(AUDIT_FILE) ? fs.readFileSync(AUDIT_FILE, "utf8").split(/\r?\n/).filter(Boolean) : [];
  let rows = lines.map(parseLine).filter(Boolean).reverse();
  rows = rows.filter((entry) => {
    const entryDate = entry.fecha ? new Date(entry.fecha) : null;
    const userOk = !filters.usuario || String(entry.usuario || "").toLowerCase().includes(String(filters.usuario).toLowerCase());
    const moduleOk = !filters.modulo || filters.modulo === "Todos" || entry.modulo === filters.modulo;
    const actionOk = !filters.accion || filters.accion === "Todos" || entry.accion === filters.accion;
    const resultOk = !filters.resultado || filters.resultado === "Todos" || entry.resultado === filters.resultado;
    const fromOk = !filters.desde || (entryDate && entryDate >= new Date(`${filters.desde}T00:00:00`));
    const toOk = !filters.hasta || (entryDate && entryDate <= new Date(`${filters.hasta}T23:59:59`));
    return userOk && moduleOk && actionOk && resultOk && fromOk && toOk;
  });
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    pagination: { page: currentPage, pageSize, total, totalPages },
    filters,
  };
}

module.exports = { writeAudit, readAudit, AUDIT_FILE };
