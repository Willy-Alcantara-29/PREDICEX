const { execFile } = require("node:child_process");

const SQL_SERVER = process.env.SQL_SERVER || "ElerSync";
const SQL_DATABASE = process.env.SQL_DATABASE || "PREDICEX";

const configs = {
  proveedores: { prefix: "prov", table: "dbo.proveedores" },
  productos: { prefix: "prd", table: "dbo.productos" },
  inventarios: { prefix: "inv", table: "dbo.inventarios" },
  movimientos: { prefix: "mov", table: "dbo.movimientos" },
  clientes: { prefix: "cli", table: "dbo.clientes" },
  prestamos: { prefix: "pre", table: "dbo.prestamos" },
  pagos: { prefix: "pag", table: "dbo.pagos" },
};

function escapeSql(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function sqlString(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return `N'${escapeSql(value)}'`;
}

function sqlNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : String(fallback);
}

function runSql(query, database = SQL_DATABASE) {
  return new Promise((resolve, reject) => {
    const args = ["-S", SQL_SERVER, "-d", database, "-E", "-b", "-r", "1", "-Q", query];
    execFile("sqlcmd", args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) reject(new Error((stderr || stdout || error.message).trim()));
      else resolve(stdout.trim());
    });
  });
}

function queryJson(query) {
  const args = ["-S", SQL_SERVER, "-d", SQL_DATABASE, "-E", "-w", "65535", "-y", "0", "-Y", "0", "-Q", `SET NOCOUNT ON; ${query}`];
  return new Promise((resolve, reject) => {
    execFile("sqlcmd", args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error((stderr || stdout || error.message).trim()));
        return;
      }
      const json = stdout.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.startsWith("[") || line.startsWith("{")).join("");
      resolve(json ? JSON.parse(json) : []);
    });
  });
}

function selectFor(collectionName, where = "") {
  const selectors = {
    proveedores: `SELECT id, razon_social AS razonSocial, rnc, telefono, correo_electronico AS correo, estado FROM dbo.proveedores ${where} ORDER BY id FOR JSON PATH`,
    productos: `SELECT id, sku, codigo_barra AS codigoBarra, descripcion, categoria, precio, estado FROM dbo.productos ${where} ORDER BY id FOR JSON PATH`,
    inventarios: `
      SELECT i.id, p.id AS productoId, p.sku, p.descripcion AS producto, s.nombre AS sucursal,
        i.stock_neto AS stockNeto, i.umbral_alerta AS umbralAlerta, i.precio_unitario AS precioUnitario,
        CASE WHEN i.stock_neto <= 0 THEN 'Sin Stock' WHEN i.stock_neto <= i.umbral_alerta THEN 'Bajo Umbral' ELSE 'Disponible' END AS estado
      FROM dbo.inventarios i
      INNER JOIN dbo.productos p ON p.id = i.producto_id
      INNER JOIN dbo.sucursales s ON s.id = i.sucursal_id
      ${where} ORDER BY i.id FOR JSON PATH`,
    movimientos: `SELECT id, tipo, sku, producto, sucursal_origen AS sucursalOrigen, sucursal_destino AS sucursalDestino, cantidad, nota, creado_en AS creadoEn FROM dbo.movimientos ${where} ORDER BY creado_en DESC FOR JSON PATH`,
    clientes: `SELECT id, nombre, documento, telefono, correo, direccion, estado FROM dbo.clientes ${where} ORDER BY id FOR JSON PATH`,
    prestamos: `
      SELECT p.id, p.cliente_id AS clienteId, c.nombre AS cliente, p.monto, p.tasa, p.plazo_meses AS plazoMeses,
        p.balance_pendiente AS balancePendiente, p.estado, CONVERT(varchar(10), p.fecha, 23) AS fecha
      FROM dbo.prestamos p INNER JOIN dbo.clientes c ON c.id = p.cliente_id
      ${where} ORDER BY p.id FOR JSON PATH`,
    pagos: `
      SELECT pa.id, pa.prestamo_id AS prestamoId, c.nombre AS cliente, pa.monto, pa.metodo, pa.referencia,
        CONVERT(varchar(10), pa.fecha, 23) AS fecha, pa.estado
      FROM dbo.pagos pa INNER JOIN dbo.prestamos p ON p.id = pa.prestamo_id INNER JOIN dbo.clientes c ON c.id = p.cliente_id
      ${where} ORDER BY pa.fecha DESC, pa.id DESC FOR JSON PATH`,
  };
  return selectors[collectionName];
}

async function nextId(prefix, table) {
  const rows = await queryJson(`SELECT ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(id, LEN('${prefix}-') + 1, 20))), 0) + 1 AS nextNumber FROM ${table} WHERE id LIKE '${prefix}-%' FOR JSON PATH`);
  return `${prefix}-${String(rows[0]?.nextNumber || 1).padStart(3, "0")}`;
}

async function ensureSucursal(nombre) {
  const rows = await queryJson(`SELECT id FROM dbo.sucursales WHERE nombre = ${sqlString(nombre)} FOR JSON PATH`);
  if (rows[0]?.id) return rows[0].id;
  const id = await nextId("suc", "dbo.sucursales");
  await runSql(`INSERT INTO dbo.sucursales (id, nombre) VALUES ('${id}', ${sqlString(nombre)});`);
  return id;
}

async function ensureProducto(body) {
  const rows = await queryJson(`SELECT id FROM dbo.productos WHERE sku = ${sqlString(body.sku)} FOR JSON PATH`);
  if (rows[0]?.id) return rows[0].id;
  const id = await nextId("prd", "dbo.productos");
  await runSql(`INSERT INTO dbo.productos (id, sku, codigo_barra, descripcion, categoria, precio, estado) VALUES ('${id}', ${sqlString(body.sku)}, ${sqlString(body.codigoBarra)}, ${sqlString(body.producto || body.descripcion)}, ${sqlString(body.categoria || "Sin categoria")}, ${sqlNumber(body.precio || body.precioUnitario)}, ${sqlString(body.estado || "Activo")});`);
  return id;
}

async function health() {
  await runSql("SELECT 1 AS ok;");
  return { mode: "sqlserver", database: SQL_DATABASE, server: SQL_SERVER };
}

async function list(collectionName, options = {}) {
  const where = collectionName === "inventarios" && options.alertas === "true" ? "WHERE i.stock_neto <= i.umbral_alerta" : "";
  return queryJson(selectFor(collectionName, where));
}

async function get(collectionName, id) {
  const where = collectionName === "inventarios" ? `WHERE i.id = '${escapeSql(id)}'` : collectionName === "prestamos" ? `WHERE p.id = '${escapeSql(id)}'` : collectionName === "pagos" ? `WHERE pa.id = '${escapeSql(id)}'` : `WHERE id = '${escapeSql(id)}'`;
  const rows = await queryJson(selectFor(collectionName, where));
  return rows[0] || null;
}

async function create(collectionName, body) {
  const id = await nextId(configs[collectionName].prefix, configs[collectionName].table);
  try {
    if (collectionName === "proveedores") await runSql(`INSERT INTO dbo.proveedores (id, razon_social, rnc, telefono, correo_electronico, estado) VALUES ('${id}', ${sqlString(body.razonSocial)}, ${sqlString(body.rnc)}, ${sqlString(body.telefono)}, ${sqlString(body.correo)}, ${sqlString(body.estado || "Activo")});`);
    if (collectionName === "productos") await runSql(`INSERT INTO dbo.productos (id, sku, codigo_barra, descripcion, categoria, precio, estado) VALUES ('${id}', ${sqlString(body.sku)}, ${sqlString(body.codigoBarra)}, ${sqlString(body.descripcion)}, ${sqlString(body.categoria || "Sin categoria")}, ${sqlNumber(body.precio)}, ${sqlString(body.estado || "Activo")});`);
    if (collectionName === "clientes") await runSql(`INSERT INTO dbo.clientes (id, nombre, documento, telefono, correo, direccion, estado) VALUES ('${id}', ${sqlString(body.nombre)}, ${sqlString(body.documento)}, ${sqlString(body.telefono)}, ${sqlString(body.correo)}, ${sqlString(body.direccion)}, ${sqlString(body.estado || "Activo")});`);
    if (collectionName === "prestamos") await runSql(`INSERT INTO dbo.prestamos (id, cliente_id, monto, tasa, plazo_meses, balance_pendiente, estado, fecha) VALUES ('${id}', ${sqlString(body.clienteId)}, ${sqlNumber(body.monto)}, ${sqlNumber(body.tasa)}, ${sqlNumber(body.plazoMeses)}, ${sqlNumber(body.balancePendiente || body.monto)}, ${sqlString(body.estado || "Activo")}, ${sqlString(body.fecha || new Date().toISOString().slice(0, 10))});`);
    if (collectionName === "pagos") await runSql(`INSERT INTO dbo.pagos (id, prestamo_id, monto, metodo, referencia, fecha, estado) VALUES ('${id}', ${sqlString(body.prestamoId)}, ${sqlNumber(body.monto)}, ${sqlString(body.metodo)}, ${sqlString(body.referencia)}, ${sqlString(body.fecha || new Date().toISOString().slice(0, 10))}, ${sqlString(body.estado || "Aplicado")}); IF ${sqlString(body.estado || "Aplicado")} = N'Aplicado' UPDATE dbo.prestamos SET balance_pendiente = CASE WHEN balance_pendiente - ${sqlNumber(body.monto)} < 0 THEN 0 ELSE balance_pendiente - ${sqlNumber(body.monto)} END WHERE id = ${sqlString(body.prestamoId)};`);
    if (collectionName === "inventarios") {
      const productoId = await ensureProducto(body);
      const sucursalId = await ensureSucursal(body.sucursal);
      await runSql(`INSERT INTO dbo.inventarios (id, producto_id, sucursal_id, stock_neto, umbral_alerta, precio_unitario) VALUES ('${id}', '${productoId}', '${sucursalId}', ${sqlNumber(body.stockNeto)}, ${sqlNumber(body.umbralAlerta, 10)}, ${sqlNumber(body.precioUnitario)});`);
    }
  } catch (error) {
    if (String(error.message).includes("UNIQUE") || String(error.message).includes("UQ_")) return { status: 409, data: { error: "Registro duplicado" } };
    throw error;
  }
  return { status: 201, data: await get(collectionName, id) };
}

async function update(collectionName, id, body) {
  const current = await get(collectionName, id);
  if (!current) return { status: 404, data: { error: "Registro no encontrado" } };
  const next = { ...current, ...body };
  try {
    if (collectionName === "proveedores") await runSql(`UPDATE dbo.proveedores SET razon_social=${sqlString(next.razonSocial)}, rnc=${sqlString(next.rnc)}, telefono=${sqlString(next.telefono)}, correo_electronico=${sqlString(next.correo)}, estado=${sqlString(next.estado || "Activo")} WHERE id='${escapeSql(id)}';`);
    if (collectionName === "productos") await runSql(`UPDATE dbo.productos SET sku=${sqlString(next.sku)}, codigo_barra=${sqlString(next.codigoBarra)}, descripcion=${sqlString(next.descripcion)}, categoria=${sqlString(next.categoria || "Sin categoria")}, precio=${sqlNumber(next.precio)}, estado=${sqlString(next.estado || "Activo")} WHERE id='${escapeSql(id)}';`);
    if (collectionName === "clientes") await runSql(`UPDATE dbo.clientes SET nombre=${sqlString(next.nombre)}, documento=${sqlString(next.documento)}, telefono=${sqlString(next.telefono)}, correo=${sqlString(next.correo)}, direccion=${sqlString(next.direccion)}, estado=${sqlString(next.estado || "Activo")} WHERE id='${escapeSql(id)}';`);
    if (collectionName === "prestamos") await runSql(`UPDATE dbo.prestamos SET cliente_id=${sqlString(next.clienteId)}, monto=${sqlNumber(next.monto)}, tasa=${sqlNumber(next.tasa)}, plazo_meses=${sqlNumber(next.plazoMeses)}, balance_pendiente=${sqlNumber(next.balancePendiente)}, estado=${sqlString(next.estado || "Activo")}, fecha=${sqlString(next.fecha)} WHERE id='${escapeSql(id)}';`);
    if (collectionName === "pagos") await runSql(`UPDATE dbo.pagos SET prestamo_id=${sqlString(next.prestamoId)}, monto=${sqlNumber(next.monto)}, metodo=${sqlString(next.metodo)}, referencia=${sqlString(next.referencia)}, fecha=${sqlString(next.fecha)}, estado=${sqlString(next.estado || "Aplicado")} WHERE id='${escapeSql(id)}';`);
    if (collectionName === "inventarios") {
      const productoId = await ensureProducto(next);
      const sucursalId = await ensureSucursal(next.sucursal);
      await runSql(`UPDATE dbo.inventarios SET producto_id='${productoId}', sucursal_id='${sucursalId}', stock_neto=${sqlNumber(next.stockNeto)}, umbral_alerta=${sqlNumber(next.umbralAlerta, 10)}, precio_unitario=${sqlNumber(next.precioUnitario)}, actualizado_en=SYSDATETIME() WHERE id='${escapeSql(id)}';`);
    }
  } catch (error) {
    if (String(error.message).includes("UNIQUE") || String(error.message).includes("UQ_")) return { status: 409, data: { error: "Registro duplicado" } };
    throw error;
  }
  return { status: 200, data: await get(collectionName, id) };
}

async function remove(collectionName, id) {
  const current = await get(collectionName, id);
  if (!current) return { status: 404, data: { error: "Registro no encontrado" } };
  await runSql(`DELETE FROM ${configs[collectionName].table} WHERE id='${escapeSql(id)}';`);
  return { status: 200, data: { deleted: current } };
}

async function registerMovement(body) {
  const inventory = await get("inventarios", body.inventarioId);
  if (!inventory) return { status: 404, data: { error: "Inventario no encontrado para el movimiento" } };
  const quantity = Number(body.cantidad || 0);
  const nextStock = body.tipo === "Entrada" ? inventory.stockNeto + quantity : body.tipo === "Ajuste" ? quantity : Math.max(0, inventory.stockNeto - quantity);
  await update("inventarios", inventory.id, { ...inventory, stockNeto: nextStock });
  if (body.tipo === "Transferencia" && body.sucursalDestino) {
    const destinationRows = await queryJson(selectFor("inventarios", `WHERE p.sku = ${sqlString(inventory.sku)} AND s.nombre = ${sqlString(body.sucursalDestino)}`));
    if (destinationRows[0]) await update("inventarios", destinationRows[0].id, { ...destinationRows[0], stockNeto: Number(destinationRows[0].stockNeto) + quantity });
    else await create("inventarios", { ...inventory, sucursal: body.sucursalDestino, stockNeto: quantity });
  }
  const id = await nextId("mov", "dbo.movimientos");
  await runSql(`INSERT INTO dbo.movimientos (id, tipo, sku, producto, sucursal_origen, sucursal_destino, cantidad, nota) VALUES ('${id}', ${sqlString(body.tipo)}, ${sqlString(inventory.sku)}, ${sqlString(inventory.producto)}, ${sqlString(body.tipo === "Entrada" ? "Proveedor" : inventory.sucursal)}, ${sqlString(body.tipo === "Transferencia" ? body.sucursalDestino : body.tipo === "Salida" ? "Cliente" : inventory.sucursal)}, ${sqlNumber(quantity)}, ${sqlString(body.nota)});`);
  return { status: 201, data: await get("movimientos", id) };
}

module.exports = { create, get, health, list, registerMovement, remove, runSql, update };
