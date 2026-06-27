const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");
const store = require("./sqlserver-store");

const PORT = Number(process.env.PORT || 3000);
const DATABASE_FILE = path.resolve(__dirname, "../database/data.json");
const FRONTEND_DIRECTORY = path.resolve(__dirname, "../frontend");

const seedData = {
  proveedores: [
    {
      id: "prov-001",
      razonSocial: "Distribuidora Caribe SRL",
      rnc: "131245678",
      telefono: "809-555-0142",
      correo: "compras@caribe.example",
      estado: "Activo",
    },
    {
      id: "prov-002",
      razonSocial: "Suplidores del Norte",
      rnc: "101334455",
      telefono: "809-555-0188",
      correo: "ventas@norte.example",
      estado: "Activo",
    },
  ],
  productos: [
    {
      id: "prd-001",
      sku: "SKU-PRD-018",
      codigoBarra: "746000000018",
      descripcion: "Arroz premium 25 lb",
      categoria: "Alimentos",
    },
    {
      id: "prd-002",
      sku: "SKU-PRD-104",
      codigoBarra: "746000000104",
      descripcion: "Aceite vegetal 1 gal",
      categoria: "Alimentos",
    },
  ],
  inventarios: [
    {
      id: "inv-001",
      productoId: "prd-001",
      sku: "SKU-PRD-018",
      producto: "Arroz premium 25 lb",
      sucursal: "Sucursal Norte",
      stockNeto: 8,
      umbralAlerta: 20,
    },
    {
      id: "inv-002",
      productoId: "prd-002",
      sku: "SKU-PRD-104",
      producto: "Aceite vegetal 1 gal",
      sucursal: "Almacen Central",
      stockNeto: 240,
      umbralAlerta: 60,
    },
  ],
};

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function ensureDatabase() {
  const directory = path.dirname(DATABASE_FILE);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!fs.existsSync(DATABASE_FILE)) {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(seedData, null, 2));
  }
}

function readDatabase() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(DATABASE_FILE, "utf8"));
}

function writeDatabase(database) {
  fs.writeFileSync(DATABASE_FILE, JSON.stringify(database, null, 2));
}

function resetDatabaseForTests() {
  writeDatabase(clone(seedData));
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(data, null, 2));
}

function sendFile(response, filePath) {
  const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
  };
  const extension = path.extname(filePath);

  response.writeHead(200, {
    "Content-Type": contentTypes[extension] || "application/octet-stream",
  });
  fs.createReadStream(filePath).pipe(response);
}

function handleStaticFrontend(pathname, response) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(FRONTEND_DIRECTORY, `.${requestedPath}`);

  if (!filePath.startsWith(FRONTEND_DIRECTORY) || !fs.existsSync(filePath)) {
    return false;
  }

  sendFile(response, filePath);
  return true;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function createId(prefix, collection) {
  const maxId = collection.reduce((max, item) => {
    const number = Number(String(item.id).replace(`${prefix}-`, ""));
    return Number.isFinite(number) && number > max ? number : max;
  }, 0);

  return `${prefix}-${String(maxId + 1).padStart(3, "0")}`;
}

function validateRequired(data, fields) {
  return fields.filter((field) => !data[field]);
}

function getCollectionRoute(pathname) {
  const match = pathname.match(/^\/(proveedores|productos|inventarios)(?:\/([^/]+))?$/);
  return match ? { collectionName: match[1], id: match[2] } : null;
}

function findById(collection, id) {
  return collection.find((item) => item.id === id);
}

function sendMissingFields(response, missing) {
  sendJson(response, 400, { error: "Campos requeridos faltantes", missing });
}

function buildProveedor(body, id) {
  return {
    id,
    razonSocial: body.razonSocial,
    rnc: body.rnc,
    telefono: body.telefono || null,
    correo: body.correo || null,
    estado: body.estado || "Activo",
  };
}

function buildProducto(body, id) {
  return {
    id,
    sku: body.sku,
    codigoBarra: body.codigoBarra || null,
    descripcion: body.descripcion,
    categoria: body.categoria || "Sin categoria",
  };
}

function buildInventario(body, id) {
  return {
    id,
    productoId: body.productoId || null,
    sku: body.sku,
    producto: body.producto,
    sucursal: body.sucursal,
    stockNeto: Number(body.stockNeto || 0),
    umbralAlerta: Number(body.umbralAlerta || 10),
  };
}

function getCrudConfig(collectionName) {
  const configs = {
    proveedores: {
      prefix: "prov",
      required: ["razonSocial", "rnc"],
      uniqueField: "rnc",
      builder: buildProveedor,
      duplicateMessage: "Ya existe un proveedor con este RNC",
    },
    productos: {
      prefix: "prd",
      required: ["sku", "descripcion"],
      uniqueField: "sku",
      builder: buildProducto,
      duplicateMessage: "Ya existe un producto con este SKU",
    },
    inventarios: {
      prefix: "inv",
      required: ["sku", "producto", "sucursal"],
      uniqueField: null,
      builder: buildInventario,
    },
  };

  return configs[collectionName];
}

function hasDuplicate(collection, field, value, ignoredId) {
  if (!field) {
    return false;
  }

  return collection.some((item) => item[field] === value && item.id !== ignoredId);
}

async function handleCreate(response, collectionName, body) {
  const result = await store.create(collectionName, body);
  sendJson(response, result.status, result.data);
}

async function handleUpdate(response, collectionName, id, body) {
  const result = await store.update(collectionName, id, body);
  sendJson(response, result.status, result.data);
}

async function handleDelete(response, collectionName, id) {
  const result = await store.remove(collectionName, id);
  sendJson(response, result.status, result.data);
}

async function router(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const { pathname } = url;

  if (request.method === "OPTIONS") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && handleStaticFrontend(pathname, response)) {
    return;
  }

  if (request.method === "GET" && pathname === "/health") {
    const database = await store.health();
    sendJson(response, 200, {
      status: "ok",
      service: "PREDICEX Backend",
      database: "sqlserver",
      sqlServer: database.server,
      sqlDatabase: database.database,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const route = getCollectionRoute(pathname);
  if (route) {
    if (request.method === "GET" && route.collectionName === "inventarios" && !route.id) {
      const alertas = url.searchParams.get("alertas");
      sendJson(response, 200, await store.list(route.collectionName, { alertas }));
      return;
    }

    if (request.method === "GET" && !route.id) {
      sendJson(response, 200, await store.list(route.collectionName));
      return;
    }

    if (request.method === "GET" && route.id) {
      const record = await store.get(route.collectionName, route.id);
      sendJson(response, record ? 200 : 404, record || { error: "Registro no encontrado" });
      return;
    }

    try {
      const body = await readBody(request);

      if (request.method === "POST" && !route.id) {
        await handleCreate(response, route.collectionName, body);
        return;
      }

      if (request.method === "PUT" && route.id) {
        await handleUpdate(response, route.collectionName, route.id, body);
        return;
      }

      if (request.method === "DELETE" && route.id) {
        await handleDelete(response, route.collectionName, route.id);
        return;
      }
    } catch (error) {
      sendJson(response, 400, { error: error.message || "JSON invalido" });
      return;
    }
  }

  sendJson(response, 404, {
    error: "Ruta no encontrada",
    rutasDisponibles: [
      "GET /health",
      "GET /proveedores",
      "GET /proveedores/:id",
      "POST /proveedores",
      "PUT /proveedores/:id",
      "DELETE /proveedores/:id",
      "GET /productos",
      "GET /productos/:id",
      "POST /productos",
      "PUT /productos/:id",
      "DELETE /productos/:id",
      "GET /inventarios",
      "GET /inventarios/:id",
      "POST /inventarios",
      "PUT /inventarios/:id",
      "DELETE /inventarios/:id",
      "GET /inventarios?alertas=true",
    ],
  });
}

const server = http.createServer((request, response) => {
  router(request, response).catch(() => {
    sendJson(response, 500, { error: "Error interno del servidor" });
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`PREDICEX backend disponible en http://localhost:${PORT}`);
  });
}

module.exports = server;
module.exports.resetDatabaseForTests = resetDatabaseForTests;
