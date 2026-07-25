const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const demoRepository = require("../repositories/demo-repository");
const repositoryDao = require("../dao/repository-dao");
const auditService = require("./audit-service");
const sqlRepository = require("../repositories/sql-repository");

const sessions = new Map();
const ADMIN_EMAIL = process.env.PREDICEX_ADMIN_EMAIL || "admin@predicex.local";
const ADMIN_PASSWORD_HASH = process.env.PREDICEX_ADMIN_PASSWORD_HASH || "a2bb5c0fdf00d551f1a255dc872a68de5d034d2b9b0f192c24d6377d1bc8785d";

const allowedStates = {
  proveedores: ["Activo", "Inactivo"],
  productos: ["Activo", "Inactivo"],
  clientes: ["Activo", "Inactivo"],
  prestamos: ["Activo", "Pendiente", "Cerrado", "Anulado"],
  pagos: ["Pendiente", "Aplicado", "Anulado"],
  inventarios: ["Disponible", "Bajo stock"],
  movimientos: ["Entrada", "Salida", "Transferencia", "Ajuste"],
};

const permissions = {
  Administrador: ["read", "write", "delete", "export", "backup"],
  Operador: ["read", "write", "export"],
  Consulta: ["read", "export"],
};
const CONFIG_FILE = path.resolve(__dirname, "../../database/config.json");
const defaultConfiguration = {
  empresaNombre: "PREDICEX",
  moneda: "DOP",
  zonaHoraria: "America/Santo_Domingo",
  formatoFecha: "dd/MM/yyyy",
  formatoHora: "hh:mm tt",
  registrosPorPagina: 20,
  respaldoDirectorio: process.env.PREDICEX_BACKUP_DIR || "C:\\PredicexBackups",
  modoDatos: process.env.PREDICEX_MODE || "sqlserver",
};
const editableConfigurationFields = new Set(["empresaNombre", "moneda", "zonaHoraria", "registrosPorPagina", "respaldoDirectorio"]);


function hash(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function normalizeStatus(collectionName, value) {
  if (collectionName === "inventarios") return value === "Sin Stock" ? "Bajo stock" : value === "Bajo Umbral" ? "Bajo stock" : value;
  if (collectionName === "productos" && value === "FL") return "Inactivo";
  if (collectionName === "proveedores" && value === "FL") return "Inactivo";
  return value;
}

function validateEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePhone(value) {
  return !value || /^\d{3}-\d{3}-\d{4}$/.test(value) || /^\d{10}$/.test(value);
}

function validateDominicanDocument(value) {
  return !!value && (/^\d{3}-\d{7}-\d$/.test(value) || /^\d{9,11}$/.test(value));
}

function validateRnc(value) {
  return !!value && /^\d{9,11}$/.test(String(value).replace(/-/g, ""));
}

function validateDate(value) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateBarcode(value) {
  return !value || /^\d{8,14}$/.test(value);
}

function validateSku(value) {
  return !!value && /^[A-Z0-9][A-Z0-9-_]{2,49}$/i.test(value);
}

function addStateError(errors, collectionName, value) {
  if (!value) return;
  const normalized = normalizeStatus(collectionName, value);
  if (allowedStates[collectionName] && !allowedStates[collectionName].includes(normalized)) {
    errors.push(`Estado invalido. Usa: ${allowedStates[collectionName].join(", ")}`);
  }
}

function validate(collectionName, data) {
  const errors = [];
  if (collectionName === "sucursales") {
    if (!data.nombre) errors.push("Nombre de sucursal obligatorio");
  }
  if (collectionName === "productos") {
    if (!validateSku(data.sku)) errors.push("SKU obligatorio y con formato valido");
    if (!data.descripcion) errors.push("Descripcion obligatoria");
    if (!validateBarcode(data.codigoBarra)) errors.push("Codigo de barra debe tener 8 a 14 digitos");
    if (Number(data.precio || 0) < 0) errors.push("Precio mayor o igual a 0");
    addStateError(errors, collectionName, data.estado || "Activo");
  }
  if (collectionName === "inventarios") {
    if (!validateSku(data.sku)) errors.push("SKU obligatorio y con formato valido");
    if (!data.producto) errors.push("Producto obligatorio");
    if (!data.sucursal) errors.push("Sucursal obligatoria");
    if (Number(data.stockNeto || 0) < 0) errors.push("Stock no negativo");
    if (Number(data.umbralAlerta || 0) < 0) errors.push("Umbral no negativo");
    if (Number(data.precioUnitario || 0) < 0) errors.push("Precio mayor o igual a 0");
  }
  if (collectionName === "proveedores") {
    if (!data.razonSocial) errors.push("Razon social obligatoria");
    if (!validateRnc(data.rnc)) errors.push("RNC proveedor obligatorio y valido");
    if (!validatePhone(data.telefono)) errors.push("Telefono debe tener formato 809-555-0199 o 10 digitos");
    if (!validateEmail(data.correo)) errors.push("Correo valido si se especifica");
    addStateError(errors, collectionName, data.estado || "Activo");
  }
  if (collectionName === "clientes") {
    if (!data.nombre) errors.push("Nombre de cliente obligatorio");
    if (!validateDominicanDocument(data.documento)) errors.push("Cedula/RNC obligatorio y valido");
    if (!validatePhone(data.telefono)) errors.push("Telefono debe tener formato 809-555-0199 o 10 digitos");
    if (!validateEmail(data.correo)) errors.push("Correo valido si se especifica");
    addStateError(errors, collectionName, data.estado || "Activo");
  }
  if (collectionName === "prestamos") {
    if (!data.clienteId) errors.push("Cliente obligatorio");
    if (Number(data.monto || 0) <= 0) errors.push("Monto mayor que 0");
    if (Number(data.tasa || 0) < 0 || Number(data.tasa || 0) > 100) errors.push("Tasa entre 0 y 100");
    if (Number(data.plazoMeses || 0) <= 0) errors.push("Plazo mayor que 0");
    if (Number(data.balancePendiente || data.monto || 0) < 0) errors.push("Balance no negativo");
    if (!validateDate(data.fecha)) errors.push("Fecha invalida");
    addStateError(errors, collectionName, data.estado || "Activo");
  }
  if (collectionName === "pagos") {
    if (!data.prestamoId) errors.push("Prestamo obligatorio");
    if (Number(data.monto || 0) <= 0) errors.push("Monto de pago mayor que 0");
    if (!data.metodo) errors.push("Metodo de pago obligatorio");
    if (!validateDate(data.fecha)) errors.push("Fecha invalida");
    addStateError(errors, collectionName, data.estado || "Aplicado");
  }
  if (collectionName === "movimientos") {
    if (!allowedStates.movimientos.includes(data.tipo)) errors.push("Tipo de movimiento invalido");
    if (!data.inventarioId) errors.push("Inventario obligatorio");
    if (Number(data.cantidad || 0) <= 0) errors.push("Cantidad mayor que 0");
    if (data.tipo === "Transferencia" && !data.sucursalDestino) errors.push("Sucursal destino obligatoria");
  }
  return errors;
}

function normalizeRecord(collectionName, record) {
  if (!record) return record;
  const next = { ...record };
  if (next.estado) next.estado = normalizeStatus(collectionName, next.estado);
  if (collectionName === "inventarios") next.estado = Number(next.stockNeto || 0) <= Number(next.umbralAlerta || 0) ? "Bajo stock" : "Disponible";
  return next;
}

function normalizeRows(collectionName, data) {
  if (Array.isArray(data)) return data.map((item) => normalizeRecord(collectionName, item));
  if (data && Array.isArray(data.items)) return { ...data, items: data.items.map((item) => normalizeRecord(collectionName, item)) };
  return data;
}

function applySearch(collectionName, rows, options = {}) {
  const search = String(options.search || "").trim().toLowerCase();
  let filtered = rows;
  if (search) {
    filtered = filtered.filter((item) => JSON.stringify(item).toLowerCase().includes(search));
  }
  if (options.estado && options.estado !== "Todos") filtered = filtered.filter((item) => normalizeStatus(collectionName, item.estado) === options.estado);
  if (collectionName === "inventarios" && options.sucursal && options.sucursal !== "Todas") filtered = filtered.filter((item) => item.sucursal === options.sucursal);
  if (collectionName === "productos" && options.categoria && options.categoria !== "Todas") filtered = filtered.filter((item) => item.categoria === options.categoria);
  return filtered;
}

function paginate(collectionName, rows, options = {}) {
  const page = Math.max(1, Number(options.page || 1));
  const pageSize = Math.min(100, Math.max(5, Number(options.pageSize || 10)));
  const filtered = applySearch(collectionName, rows, options);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    pagination: { page: safePage, pageSize, total, totalPages, hasPrevious: safePage > 1, hasNext: safePage < totalPages },
  };
}

async function withRepository(operation) {
  const repository = await repositoryDao.resolveRepository();
  return operation(repository);
}

async function health() {
  return withRepository((repository) => repository.health());
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { ...user, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
  return token;
}

async function login(body) {
  const email = String(body.email || "").toLowerCase();
  const passwordHash = hash(body.password || "");
  if (email !== ADMIN_EMAIL || passwordHash !== ADMIN_PASSWORD_HASH) {
    return { status: 401, data: { error: "Credenciales invalidas" } };
  }
  const user = { id: "usr-admin", nombre: "Administrador", email: ADMIN_EMAIL, rol: "Administrador" };
  return { status: 200, data: { token: createSession(user), user, expiresInSeconds: 28800 } };
}

function logout(token) {
  if (token) sessions.delete(token);
  return { status: 200, data: { ok: true } };
}

function resolveSession(token) {
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  return session;
}

function permissionMatrix() {
  return Object.entries(permissions).map(([rol, permisos]) => ({ rol, permisos }));
}

function usersAndRoles(currentUser = null) {
  const activeSessions = [...sessions.values()].filter((session) => session.expiresAt >= Date.now());
  return {
    usuarios: [{ id: "usr-admin", nombre: "Administrador", email: ADMIN_EMAIL, rol: "Administrador", estado: "Activo", sesionActual: currentUser?.id === "usr-admin" }],
    roles: permissionMatrix(),
    sesionesActivas: activeSessions.length,
  };
}

function readConfiguration() {
  let stored = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try { stored = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")); } catch { stored = {}; }
  }
  return {
    ...defaultConfiguration,
    ...stored,
    modoDatos: process.env.PREDICEX_MODE || stored.modoDatos || defaultConfiguration.modoDatos,
    sqlServer: process.env.SQLSERVER_HOST || "ElerSync",
    sqlDatabase: process.env.SQLSERVER_DATABASE || "PREDICEX",
    adminEmail: ADMIN_EMAIL,
  };
}

function updateConfiguration(body = {}, context = {}) {
  const current = readConfiguration();
  const next = { ...current };
  Object.entries(body).forEach(([key, value]) => {
    if (editableConfigurationFields.has(key)) next[key] = key === "registrosPorPagina" ? Math.max(5, Math.min(100, Number(value || 20))) : value;
  });
  const persisted = Object.fromEntries(Object.entries(next).filter(([key]) => editableConfigurationFields.has(key)));
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(persisted, null, 2), "utf8");
  auditService.writeAudit({ user: context.user, ip: context.ip, action: "actualizar", module: "configuracion", before: current, after: next, result: "ok" });
  return next;
}
function requirePermission(user, permission) {
  if (!user) return { status: 401, data: { error: "Sesion requerida" } };
  if (!permissions[user.rol]?.includes(permission)) return { status: 403, data: { error: "Permiso insuficiente" } };
  return null;
}

async function list(collectionName, options = {}) {
  return withRepository(async (repository) => {
    const rows = normalizeRows(collectionName, await repository.list(collectionName, options));
    return options.page ? paginate(collectionName, rows, options) : rows;
  });
}

async function get(collectionName, id) {
  return withRepository(async (repository) => normalizeRecord(collectionName, await repository.get(collectionName, id)));
}

async function metrics() {
  return withRepository(async (repository) => {
    if (repository.metrics) return repository.metrics();
    const [proveedores, productos, inventarios, movimientos, clientes, prestamos, pagos] = await Promise.all([
      repository.list("proveedores"), repository.list("productos"), repository.list("inventarios"), repository.list("movimientos"), repository.list("clientes"), repository.list("prestamos"), repository.list("pagos"),
    ]);
    return buildMetrics({ proveedores, productos, inventarios, movimientos, clientes, prestamos, pagos });
  });
}

function buildMetrics(data) {
  const proveedores = (data.proveedores || []).map((item) => normalizeRecord("proveedores", item));
  const productos = (data.productos || []).map((item) => normalizeRecord("productos", item));
  const inventarios = (data.inventarios || []).map((item) => normalizeRecord("inventarios", item));
  const movimientos = data.movimientos || [];
  const clientes = (data.clientes || []).map((item) => normalizeRecord("clientes", item));
  const prestamos = (data.prestamos || []).map((item) => normalizeRecord("prestamos", item));
  const pagos = (data.pagos || []).map((item) => normalizeRecord("pagos", item));
  const totalStock = inventarios.reduce((total, item) => total + Number(item.stockNeto || 0), 0);
  const inventoryValue = inventarios.reduce((total, item) => total + Number(item.stockNeto || 0) * Number(item.precioUnitario || 0), 0);
  const lowStock = inventarios.filter((item) => item.estado === "Bajo stock").length;
  const salesBySku = movimientos.filter((item) => item.tipo === "Salida").reduce((acc, item) => {
    acc[item.sku] = (acc[item.sku] || 0) + Number(item.cantidad || 0);
    return acc;
  }, {});
  const bestSellerEntry = Object.entries(salesBySku).sort((a, b) => b[1] - a[1])[0];
  const bestSellerProduct = productos.find((item) => item.sku === bestSellerEntry?.[0]);
  const appliedPayments = pagos.filter((item) => item.estado === "Aplicado");
  return {
    syncedAt: new Date().toISOString(),
    inventarios: { totalStock, inventoryValue, lowStock, activeBranches: new Set(inventarios.map((item) => item.sucursal)).size, totalRecords: inventarios.length },
    productos: { total: productos.length, active: productos.filter((item) => item.estado === "Activo").length, categories: new Set(productos.map((item) => item.categoria)).size, lowStockProducts: new Set(inventarios.filter((item) => item.estado === "Bajo stock").map((item) => item.productoId || item.sku)).size, bestSeller: bestSellerEntry ? { sku: bestSellerEntry[0], producto: bestSellerProduct?.descripcion || bestSellerEntry[0], cantidad: bestSellerEntry[1] } : null },
    proveedores: { total: proveedores.length, active: proveedores.filter((item) => item.estado === "Activo").length, email: proveedores.filter((item) => item.correo).length, phone: proveedores.filter((item) => item.telefono).length },
    clientes: { total: clientes.length, active: clientes.filter((item) => item.estado === "Activo").length, inactive: clientes.filter((item) => item.estado === "Inactivo").length, withLoans: new Set(prestamos.map((item) => item.clienteId)).size },
    prestamos: { total: prestamos.length, active: prestamos.filter((item) => item.estado === "Activo").length, amount: prestamos.reduce((sum, item) => sum + Number(item.monto || 0), 0), balance: prestamos.reduce((sum, item) => sum + Number(item.balancePendiente || 0), 0) },
    pagos: { total: pagos.length, applied: appliedPayments.length, pending: pagos.filter((item) => item.estado === "Pendiente").length, amount: appliedPayments.reduce((sum, item) => sum + Number(item.monto || 0), 0) },
    movimientos: { total: movimientos.length, entradas: movimientos.filter((item) => item.tipo === "Entrada").length, salidas: movimientos.filter((item) => item.tipo === "Salida").length, transferencias: movimientos.filter((item) => item.tipo === "Transferencia").length },
  };
}

async function create(collectionName, body, context = {}) {
  const errors = validate(collectionName, body);
  if (errors.length) return { status: 400, data: { error: "Validacion fallida", errors } };
  try {
    const result = await withRepository((repository) => repository.create(collectionName, body, context));
    auditService.writeAudit({ user: context.user, ip: context.ip, action: "crear", module: collectionName, recordId: result.data?.id, after: result.data, result: result.status < 400 ? "ok" : "error" });
    return result;
  } catch (error) {
    auditService.writeAudit({ user: context.user, ip: context.ip, action: "crear", module: collectionName, after: body, result: "error", error: error.message });
    throw error;
  }
}

async function update(collectionName, id, body, context = {}) {
  const errors = validate(collectionName, body);
  if (errors.length) return { status: 400, data: { error: "Validacion fallida", errors } };
  const before = await get(collectionName, id);
  try {
    const result = await withRepository((repository) => repository.update(collectionName, id, body, context));
    auditService.writeAudit({ user: context.user, ip: context.ip, action: "actualizar", module: collectionName, recordId: id, before, after: result.data, result: result.status < 400 ? "ok" : "error" });
    return result;
  } catch (error) {
    auditService.writeAudit({ user: context.user, ip: context.ip, action: "actualizar", module: collectionName, recordId: id, before, after: body, result: "error", error: error.message });
    throw error;
  }
}

async function remove(collectionName, id, context = {}) {
  const before = await get(collectionName, id);
  try {
    const result = await withRepository((repository) => repository.remove(collectionName, id, context));
    auditService.writeAudit({ user: context.user, ip: context.ip, action: "eliminar", module: collectionName, recordId: id, before, after: result.data, result: result.status < 400 ? "ok" : "error" });
    return result;
  } catch (error) {
    auditService.writeAudit({ user: context.user, ip: context.ip, action: "eliminar", module: collectionName, recordId: id, before, result: "error", error: error.message });
    throw error;
  }
}

async function registerMovement(body, context = {}) {
  const errors = validate("movimientos", body);
  if (errors.length) return { status: 400, data: { error: "Validacion fallida", errors } };
  try {
    const result = await withRepository((repository) => repository.registerMovement(body, context));
    auditService.writeAudit({ user: context.user, ip: context.ip, action: "registrar movimiento", module: "inventarios", recordId: body.inventarioId, after: result.data, result: result.status < 400 ? "ok" : "error" });
    return result;
  } catch (error) {
    auditService.writeAudit({ user: context.user, ip: context.ip, action: "registrar movimiento", module: "inventarios", recordId: body.inventarioId, after: body, result: "error", error: error.message });
    throw error;
  }
}


function buildPredictiveModel({ inventarios = [], movimientos = [] }) {
  const salidaPorSku = movimientos.filter((item) => item.tipo === "Salida").reduce((acc, item) => {
    const sku = item.sku || "SIN-SKU";
    acc[sku] = acc[sku] || { sku, total: 0, count: 0 };
    acc[sku].total += Number(item.cantidad || 0);
    acc[sku].count += 1;
    return acc;
  }, {});
  const forecasts = inventarios.map((item) => {
    const demand = salidaPorSku[item.sku];
    const demandaPromedio = demand ? Math.max(1, demand.total / Math.max(1, demand.count)) : 0;
    const demanda7Dias = Math.round(demandaPromedio * 7);
    const stock = Number(item.stockNeto || 0);
    const umbral = Number(item.umbralAlerta || 0);
    const diasCobertura = demandaPromedio > 0 ? Math.floor(stock / demandaPromedio) : null;
    const riesgo = stock <= umbral ? "critico" : demandaPromedio > 0 && stock <= demanda7Dias ? "alto" : demandaPromedio > 0 && stock <= demanda7Dias * 2 ? "medio" : "bajo";
    return {
      sku: item.sku,
      producto: item.producto,
      sucursal: item.sucursal,
      stockNeto: stock,
      umbralAlerta: umbral,
      demandaPromedio: Number(demandaPromedio.toFixed(2)),
      demanda7Dias,
      diasCobertura,
      riesgo,
      recomendacion: riesgo === "critico" || riesgo === "alto" ? Math.max(umbral * 2, demanda7Dias * 2) - stock : 0,
    };
  });
  return {
    trainedAt: new Date().toISOString(),
    algorithm: "media-movil-salidas",
    sampleSize: movimientos.length,
    forecastDays: 7,
    forecasts,
    summary: {
      totalProductos: forecasts.length,
      alertasCriticas: forecasts.filter((item) => item.riesgo === "critico").length,
      alertasAltas: forecasts.filter((item) => item.riesgo === "alto").length,
      demanda7Dias: forecasts.reduce((sum, item) => sum + item.demanda7Dias, 0),
      reordenSugerido: forecasts.reduce((sum, item) => sum + Number(item.recomendacion || 0), 0),
    },
  };
}

async function predictiveMetrics(options = {}) {
  return withRepository(async (repository) => {
    const [inventarios, movimientos] = await Promise.all([repository.list("inventarios", options), repository.list("movimientos", options)]);
    return buildPredictiveModel({ inventarios: normalizeRows("inventarios", inventarios), movimientos });
  });
}

async function trainPredictiveModel(context = {}) {
  const model = await predictiveMetrics();
  auditService.writeAudit({ user: context.user, ip: context.ip, action: "entrenar modelo", module: "predictivo", after: { algorithm: model.algorithm, sampleSize: model.sampleSize, trainedAt: model.trainedAt }, result: "ok" });
  return { status: 200, data: model };
}

async function stockAlerts(options = {}) {
  const model = await predictiveMetrics(options);
  return model.forecasts.filter((item) => ["critico", "alto", "medio"].includes(item.riesgo));
}
async function report(name, filters = {}) {
  const collectionMap = { inventario: "inventarios", bajo_stock: "inventarios", movimientos: "movimientos", transferencias: "movimientos", productos: "productos", proveedores: "proveedores", clientes: "clientes", prestamos: "prestamos", balances: "prestamos", pagos: "pagos", sucursales: "sucursales" };
  const collection = collectionMap[name];
  if (!collection) return { status: 404, data: { error: "Reporte no encontrado" } };
  const rows = await list(collection, filters);
  const items = Array.isArray(rows) ? rows : rows.items;
  const filtered = name === "bajo_stock" ? items.filter((item) => item.estado === "Bajo stock") : name === "transferencias" ? items.filter((item) => item.tipo === "Transferencia") : items;
  return { status: 200, data: { reporte: name, filtros: filters, total: filtered.length, items: filtered, metrics: await metrics() } };
}


function auditLog(options = {}) {
  return auditService.readAudit(options);
}
function backupHistory(options = {}) {
  const log = auditService.readAudit({ ...options, modulo: "sqlserver", accion: "respaldo" });
  return {
    ...log,
    items: log.items.map((entry) => ({
      nombre: entry.registro,
      usuario: entry.usuario,
      rol: entry.rol,
      ubicacion: entry.nuevo?.location || null,
      estado: entry.resultado === "ok" ? "Completado" : "Error",
      validado: entry.resultado === "ok",
      fecha: entry.fecha,
      ip: entry.ip,
      mensaje: entry.error || (entry.resultado === "ok" ? "Respaldo validado" : "No completado"),
    })),
  };
}
async function backupDatabase(context = {}) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const name = `PREDICEX_${stamp}.bak`;
  const location = process.env.PREDICEX_BACKUP_DIR || "C:\\PredicexBackups";
  const fullPath = `${location}\\${name}`;
  try {
    await sqlRepository.runSql(`IF DB_ID(N'PREDICEX') IS NULL THROW 53000, 'Base de datos PREDICEX no encontrada', 1;`);
    await sqlRepository.runSql(`EXEC xp_create_subdir N'${location.replace(/'/g, "''")}'; BACKUP DATABASE PREDICEX TO DISK = N'${fullPath.replace(/'/g, "''")}' WITH INIT, CHECKSUM, COMPRESSION; RESTORE VERIFYONLY FROM DISK = N'${fullPath.replace(/'/g, "''")}' WITH CHECKSUM; IF OBJECT_ID(N'dbo.respaldos', N'U') IS NOT NULL INSERT INTO dbo.respaldos (nombre, ubicacion, usuario, estado, validado, mensaje) VALUES (N'${name.replace(/'/g, "''")}', N'${fullPath.replace(/'/g, "''")}', N'${(context.user?.email || "sistema").replace(/'/g, "''")}', 'Completado', 1, N'Respaldo validado con RESTORE VERIFYONLY');`);
    auditService.writeAudit({ user: context.user, ip: context.ip, action: "respaldo", module: "sqlserver", recordId: name, after: { location: fullPath }, result: "ok" });
    return { status: 201, data: { nombre: name, ubicacion: fullPath, estado: "Completado", validado: true } };
  } catch (error) {
    auditService.writeAudit({ user: context.user, ip: context.ip, action: "respaldo", module: "sqlserver", recordId: name, after: { location: fullPath }, result: "error", error: error.message });
    return { status: 500, data: { error: "No se pudo completar el respaldo", details: error.message } };
  }
}
function resetForTests() {
  process.env.PREDICEX_MODE = "demo";
  sessions.clear();
  repositoryDao.reset();
  demoRepository.resetDatabase();
}

module.exports = { auditLog, backupDatabase, backupHistory, readConfiguration, updateConfiguration, usersAndRoles, buildMetrics, buildPredictiveModel, create, get, health, list, login, logout, metrics, predictiveMetrics, registerMovement, remove, report, requirePermission, resetForTests, resolveSession, stockAlerts, trainPredictiveModel, update };



