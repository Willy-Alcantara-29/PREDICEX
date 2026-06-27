const { execFile } = require("node:child_process");

const SQL_SERVER = process.env.SQL_SERVER || "ElerSync";
const SQL_DATABASE = process.env.SQL_DATABASE || "PREDICEX";

const configs = {
  proveedores: {
    prefix: "prov",
    table: "dbo.proveedores",
    required: ["razonSocial", "rnc"],
    duplicateMessage: "Ya existe un proveedor con este RNC",
  },
  productos: {
    prefix: "prd",
    table: "dbo.productos",
    required: ["sku", "descripcion"],
    duplicateMessage: "Ya existe un producto con este SKU",
  },
  inventarios: {
    prefix: "inv",
    table: "dbo.inventarios",
    required: ["sku", "producto", "sucursal"],
  },
};

function escapeSql(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function sqlString(value) {
  if (value === undefined || value === null || value === "") {
    return "NULL";
  }

  return `N'${escapeSql(value)}'`;
}

function sqlNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : String(fallback);
}

function runSql(query, database = SQL_DATABASE) {
  return new Promise((resolve, reject) => {
    const args = ["-S", SQL_SERVER, "-d", database, "-E", "-b", "-r", "1", "-Q", query];
    execFile("sqlcmd", args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error((stderr || stdout || error.message).trim()));
        return;
      }

      resolve(stdout.trim());
    });
  });
}

async function queryJson(query) {
  const wrappedQuery = `SET NOCOUNT ON; ${query}`;
  const args = [
    "-S",
    SQL_SERVER,
    "-d",
    SQL_DATABASE,
    "-E",
    "-w",
    "65535",
    "-y",
    "0",
    "-Y",
    "0",
    "-Q",
    wrappedQuery,
  ];

  return new Promise((resolve, reject) => {
    execFile("sqlcmd", args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error((stderr || stdout || error.message).trim()));
        return;
      }

      const json = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith("[") || line.startsWith("{"))
        .join("");

      resolve(json ? JSON.parse(json) : []);
    });
  });
}

function selectFor(collectionName, where = "") {
  const selectors = {
    proveedores: `
      SELECT id, razon_social AS razonSocial, rnc, telefono,
        correo_electronico AS correo, estado
      FROM dbo.proveedores
      ${where}
      ORDER BY id
      FOR JSON PATH
    `,
    productos: `
      SELECT id, sku, codigo_barra AS codigoBarra, descripcion, categoria
      FROM dbo.productos
      ${where}
      ORDER BY id
      FOR JSON PATH
    `,
    inventarios: `
      SELECT i.id, p.id AS productoId, p.sku, p.descripcion AS producto,
        s.nombre AS sucursal, i.stock_neto AS stockNeto, i.umbral_alerta AS umbralAlerta, i.precio_unitario AS precioUnitario
      FROM dbo.inventarios i
      INNER JOIN dbo.productos p ON p.id = i.producto_id
      INNER JOIN dbo.sucursales s ON s.id = i.sucursal_id
      ${where}
      ORDER BY i.id
      FOR JSON PATH
    `,
  };

  return selectors[collectionName];
}

function validateRequired(data, fields) {
  return fields.filter((field) => !data[field]);
}

async function nextId(prefix, table) {
  const rows = await queryJson(`
    SELECT ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(id, LEN('${prefix}-') + 1, 20))), 0) + 1 AS nextNumber
    FROM ${table}
    WHERE id LIKE '${prefix}-%'
    FOR JSON PATH
  `);

  return `${prefix}-${String(rows[0]?.nextNumber || 1).padStart(3, "0")}`;
}

async function list(collectionName, options = {}) {
  const alertFilter =
    collectionName === "inventarios" && options.alertas === "true"
      ? "WHERE i.stock_neto <= i.umbral_alerta"
      : "";

  return queryJson(selectFor(collectionName, alertFilter));
}

async function get(collectionName, id) {
  const idFilter =
    collectionName === "inventarios"
      ? `WHERE i.id = '${escapeSql(id)}'`
      : `WHERE id = '${escapeSql(id)}'`;
  const rows = await queryJson(selectFor(collectionName, idFilter));
  return rows[0] || null;
}

async function ensureSucursal(nombre) {
  const rows = await queryJson(`
    SELECT id FROM dbo.sucursales WHERE nombre = ${sqlString(nombre)} FOR JSON PATH
  `);

  if (rows[0]?.id) {
    return rows[0].id;
  }

  const id = await nextId("suc", "dbo.sucursales");
  await runSql(`
    SET NOCOUNT ON;
    INSERT INTO dbo.sucursales (id, nombre) VALUES ('${id}', ${sqlString(nombre)});
  `);
  return id;
}

async function ensureProductoByInventory(body) {
  const rows = await queryJson(`
    SELECT id FROM dbo.productos WHERE sku = ${sqlString(body.sku)} FOR JSON PATH
  `);

  if (rows[0]?.id) {
    await runSql(`
      SET NOCOUNT ON;
      UPDATE dbo.productos
      SET descripcion = ${sqlString(body.producto)}
      WHERE id = '${escapeSql(rows[0].id)}';
    `);
    return rows[0].id;
  }

  const id = await nextId("prd", "dbo.productos");
  await runSql(`
    SET NOCOUNT ON;
    INSERT INTO dbo.productos (id, sku, descripcion, categoria)
    VALUES ('${id}', ${sqlString(body.sku)}, ${sqlString(body.producto)}, N'Sin categoria');
  `);
  return id;
}

async function create(collectionName, body) {
  const config = configs[collectionName];
  const missing = validateRequired(body, config.required);
  if (missing.length) {
    return { status: 400, data: { error: "Campos requeridos faltantes", missing } };
  }

  const id = await nextId(config.prefix, config.table);

  try {
    if (collectionName === "proveedores") {
      await runSql(`
        SET NOCOUNT ON;
        INSERT INTO dbo.proveedores (id, razon_social, rnc, telefono, correo_electronico, estado)
        VALUES ('${id}', ${sqlString(body.razonSocial)}, ${sqlString(body.rnc)}, ${sqlString(body.telefono)},
          ${sqlString(body.correo)}, COALESCE(${sqlString(body.estado)}, 'Activo'));
      `);
    }

    if (collectionName === "productos") {
      await runSql(`
        SET NOCOUNT ON;
        INSERT INTO dbo.productos (id, sku, codigo_barra, descripcion, categoria)
        VALUES ('${id}', ${sqlString(body.sku)}, ${sqlString(body.codigoBarra)}, ${sqlString(body.descripcion)},
          COALESCE(${sqlString(body.categoria)}, N'Sin categoria'));
      `);
    }

    if (collectionName === "inventarios") {
      const productoId = await ensureProductoByInventory(body);
      const sucursalId = await ensureSucursal(body.sucursal);
      await runSql(`
        SET NOCOUNT ON;
        INSERT INTO dbo.inventarios (id, producto_id, sucursal_id, stock_neto, umbral_alerta, precio_unitario)
        VALUES ('${id}', '${escapeSql(productoId)}', '${escapeSql(sucursalId)}',
          ${sqlNumber(body.stockNeto, 0)}, ${sqlNumber(body.umbralAlerta, 10)}, ${sqlNumber(body.precioUnitario, 0)});
      `);
    }
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return { status: 409, data: { error: config.duplicateMessage || "Registro duplicado" } };
    }
    throw error;
  }

  return { status: 201, data: await get(collectionName, id) };
}

async function update(collectionName, id, body) {
  const current = await get(collectionName, id);
  if (!current) {
    return { status: 404, data: { error: "Registro no encontrado" } };
  }

  const nextData = { ...current, ...body };
  const missing = validateRequired(nextData, configs[collectionName].required);
  if (missing.length) {
    return { status: 400, data: { error: "Campos requeridos faltantes", missing } };
  }

  try {
    if (collectionName === "proveedores") {
      await runSql(`
        SET NOCOUNT ON;
        UPDATE dbo.proveedores
        SET razon_social = ${sqlString(nextData.razonSocial)}, rnc = ${sqlString(nextData.rnc)},
          telefono = ${sqlString(nextData.telefono)}, correo_electronico = ${sqlString(nextData.correo)},
          estado = COALESCE(${sqlString(nextData.estado)}, 'Activo')
        WHERE id = '${escapeSql(id)}';
      `);
    }

    if (collectionName === "productos") {
      await runSql(`
        SET NOCOUNT ON;
        UPDATE dbo.productos
        SET sku = ${sqlString(nextData.sku)}, codigo_barra = ${sqlString(nextData.codigoBarra)},
          descripcion = ${sqlString(nextData.descripcion)}, categoria = COALESCE(${sqlString(nextData.categoria)}, N'Sin categoria')
        WHERE id = '${escapeSql(id)}';
      `);
    }

    if (collectionName === "inventarios") {
      const productoId = await ensureProductoByInventory(nextData);
      const sucursalId = await ensureSucursal(nextData.sucursal);
      await runSql(`
        SET NOCOUNT ON;
        UPDATE dbo.inventarios
        SET producto_id = '${escapeSql(productoId)}', sucursal_id = '${escapeSql(sucursalId)}',
          stock_neto = ${sqlNumber(nextData.stockNeto, 0)}, umbral_alerta = ${sqlNumber(nextData.umbralAlerta, 10)}, precio_unitario = ${sqlNumber(nextData.precioUnitario, 0)},
          actualizado_en = SYSDATETIME()
        WHERE id = '${escapeSql(id)}';
      `);
    }
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return { status: 409, data: { error: configs[collectionName].duplicateMessage || "Registro duplicado" } };
    }
    throw error;
  }

  return { status: 200, data: await get(collectionName, id) };
}

async function remove(collectionName, id) {
  const current = await get(collectionName, id);
  if (!current) {
    return { status: 404, data: { error: "Registro no encontrado" } };
  }

  await runSql(`
    SET NOCOUNT ON;
    DELETE FROM ${configs[collectionName].table} WHERE id = '${escapeSql(id)}';
  `);
  return { status: 200, data: { deleted: current } };
}

async function health() {
  await runSql("SET NOCOUNT ON; SELECT 1 AS ok;");
  return { server: SQL_SERVER, database: SQL_DATABASE };
}

async function resetForTests() {
  await runSql("SET NOCOUNT ON; EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all';");
}

module.exports = {
  create,
  get,
  health,
  list,
  remove,
  resetForTests,
  runSql,
  update,
};
