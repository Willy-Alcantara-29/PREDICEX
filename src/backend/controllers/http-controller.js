const supplyService = require("../services/supply-service");

const collections = new Set(["proveedores", "productos", "inventarios", "movimientos", "clientes", "prestamos", "pagos"]);

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
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

function getCollectionRoute(pathname) {
  const match = pathname.match(/^\/(proveedores|productos|inventarios|movimientos|clientes|prestamos|pagos)(?:\/([^/]+))?$/);
  return match ? { collectionName: match[1], id: match[2] } : null;
}

async function handleApi(request, response, url) {
  const { pathname } = url;

  if (request.method === "OPTIONS") {
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "GET" && pathname === "/health") {
    const database = await supplyService.health();
    sendJson(response, 200, {
      status: "ok",
      service: "PREDICEX Backend",
      database: database.database,
      mode: database.mode,
      sqlServer: database.server || null,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (request.method === "POST" && pathname === "/inventarios/movimientos") {
    const body = await readBody(request);
    const result = await supplyService.registerMovement(body);
    sendJson(response, result.status, result.data);
    return true;
  }

  const route = getCollectionRoute(pathname);
  if (!route || !collections.has(route.collectionName)) {
    return false;
  }

  if (request.method === "GET" && !route.id) {
    const alertas = url.searchParams.get("alertas");
    sendJson(response, 200, await supplyService.list(route.collectionName, { alertas }));
    return true;
  }

  if (request.method === "GET" && route.id) {
    const record = await supplyService.get(route.collectionName, route.id);
    sendJson(response, record ? 200 : 404, record || { error: "Registro no encontrado" });
    return true;
  }

  if (request.method === "POST" && !route.id) {
    const body = await readBody(request);
    const result = await supplyService.create(route.collectionName, body);
    sendJson(response, result.status, result.data);
    return true;
  }

  if (request.method === "PUT" && route.id) {
    const body = await readBody(request);
    const result = await supplyService.update(route.collectionName, route.id, body);
    sendJson(response, result.status, result.data);
    return true;
  }

  if (request.method === "DELETE" && route.id) {
    const result = await supplyService.remove(route.collectionName, route.id);
    sendJson(response, result.status, result.data);
    return true;
  }

  sendJson(response, 405, { error: "Metodo no permitido" });
  return true;
}

module.exports = { handleApi, sendJson };

