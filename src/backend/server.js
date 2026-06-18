const http = require("http");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);

const proveedores = [
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
];

const productos = [
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
];

const inventarios = [
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
];

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(data, null, 2));
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
  return `${prefix}-${String(collection.length + 1).padStart(3, "0")}`;
}

function validateRequired(data, fields) {
  return fields.filter((field) => !data[field]);
}

async function router(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const { pathname } = url;

  if (request.method === "OPTIONS") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && pathname === "/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "PREDICEX Backend",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (request.method === "GET" && pathname === "/proveedores") {
    sendJson(response, 200, proveedores);
    return;
  }

  if (request.method === "POST" && pathname === "/proveedores") {
    try {
      const body = await readBody(request);
      const missing = validateRequired(body, ["razonSocial", "rnc"]);

      if (missing.length) {
        sendJson(response, 400, { error: "Campos requeridos faltantes", missing });
        return;
      }

      const exists = proveedores.some((proveedor) => proveedor.rnc === body.rnc);
      if (exists) {
        sendJson(response, 409, { error: "Ya existe un proveedor con este RNC" });
        return;
      }

      const proveedor = {
        id: createId("prov", proveedores),
        razonSocial: body.razonSocial,
        rnc: body.rnc,
        telefono: body.telefono || null,
        correo: body.correo || null,
        estado: body.estado || "Activo",
      };

      proveedores.push(proveedor);
      sendJson(response, 201, proveedor);
    } catch (error) {
      sendJson(response, 400, { error: "JSON invalido" });
    }
    return;
  }

  if (request.method === "GET" && pathname === "/productos") {
    sendJson(response, 200, productos);
    return;
  }

  if (request.method === "POST" && pathname === "/productos") {
    try {
      const body = await readBody(request);
      const missing = validateRequired(body, ["sku", "descripcion"]);

      if (missing.length) {
        sendJson(response, 400, { error: "Campos requeridos faltantes", missing });
        return;
      }

      const exists = productos.some((producto) => producto.sku === body.sku);
      if (exists) {
        sendJson(response, 409, { error: "Ya existe un producto con este SKU" });
        return;
      }

      const producto = {
        id: createId("prd", productos),
        sku: body.sku,
        codigoBarra: body.codigoBarra || null,
        descripcion: body.descripcion,
        categoria: body.categoria || "Sin categoria",
      };

      productos.push(producto);
      sendJson(response, 201, producto);
    } catch (error) {
      sendJson(response, 400, { error: "JSON invalido" });
    }
    return;
  }

  if (request.method === "GET" && pathname === "/inventarios") {
    const alertas = url.searchParams.get("alertas");
    const result =
      alertas === "true"
        ? inventarios.filter((item) => item.stockNeto <= item.umbralAlerta)
        : inventarios;

    sendJson(response, 200, result);
    return;
  }

  sendJson(response, 404, {
    error: "Ruta no encontrada",
    rutasDisponibles: [
      "GET /health",
      "GET /proveedores",
      "POST /proveedores",
      "GET /productos",
      "POST /productos",
      "GET /inventarios",
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
