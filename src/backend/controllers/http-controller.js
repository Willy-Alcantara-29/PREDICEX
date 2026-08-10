const supplyService = require("../services/supply-service");

const collections = new Set(["proveedores", "productos", "inventarios", "movimientos", "sucursales", "clientes", "prestamos", "pagos"]);

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Role",
  });
  response.end(JSON.stringify(data, null, 2));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error("Solicitud demasiado grande"));
    });
    request.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON invalido"));
      }
    });
  });
}

function getToken(request) {
  const header = request.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function getUser(request) {
  return supplyService.resolveSession(getToken(request));
}

function getIp(request) {
  return request.headers["x-forwarded-for"] || request.socket.remoteAddress || "desconocida";
}

function contextFor(request) {
  return { user: getUser(request), ip: getIp(request) };
}

function permissionFor(method, pathname) {
  if (method === "GET") return pathname.startsWith("/reportes") ? "export" : "read";
  if (method === "DELETE") return "delete";
  return "write";
}

function guard(request, response, permission) {
  const denied = supplyService.requirePermission(getUser(request), permission);
  if (denied) {
    sendJson(response, denied.status, denied.data);
    return false;
  }
  return true;
}

function queryOptions(url) {
  return Object.fromEntries(url.searchParams.entries());
}

function getCollectionRoute(pathname) {
  const match = pathname.match(/^\/(proveedores|productos|inventarios|movimientos|sucursales|clientes|prestamos|pagos)(?:\/([^/]+))?$/);
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

  if (request.method === "POST" && pathname === "/auth/login") {
    const result = await supplyService.login(await readBody(request));
    sendJson(response, result.status, result.data);
    return true;
  }

  if (request.method === "POST" && pathname === "/auth/logout") {
    sendJson(response, 200, supplyService.logout(getToken(request)).data);
    return true;
  }

  if (pathname === "/metrics" && request.method === "GET") {
    if (!guard(request, response, "read")) return true;
    sendJson(response, 200, await supplyService.metrics());
    return true;
  }
  if (pathname === "/usuarios-roles" && request.method === "GET") {
    if (!guard(request, response, "read")) return true;
    sendJson(response, 200, supplyService.usersAndRoles(getUser(request)));
    return true;
  }

  if (pathname === "/configuracion" && request.method === "GET") {
    if (!guard(request, response, "read")) return true;
    sendJson(response, 200, supplyService.readConfiguration());
    return true;
  }

  if (pathname === "/configuracion" && request.method === "PUT") {
    if (!guard(request, response, "write")) return true;
    sendJson(response, 200, supplyService.updateConfiguration(await readBody(request), contextFor(request)));
    return true;
  }

  if (pathname === "/backups" && request.method === "GET") {
    if (!guard(request, response, "backup")) return true;
    sendJson(response, 200, supplyService.backupHistory(queryOptions(url)));
    return true;
  }
  if (pathname === "/backups" && request.method === "POST") {
    if (!guard(request, response, "backup")) return true;
    const result = await supplyService.backupDatabase(contextFor(request));
    sendJson(response, result.status, result.data);
    return true;
  }
  if (pathname === "/auditoria" && request.method === "GET") {
    if (!guard(request, response, "read")) return true;
    sendJson(response, 200, supplyService.auditLog(queryOptions(url)));
    return true;
  }
  if (pathname === "/predictivo/entrenar" && request.method === "POST") {
    if (!guard(request, response, "write")) return true;
    const result = await supplyService.trainPredictiveModel(contextFor(request));
    sendJson(response, result.status, result.data);
    return true;
  }

  if (pathname === "/predictivo/metricas" && request.method === "GET") {
    if (!guard(request, response, "read")) return true;
    sendJson(response, 200, await supplyService.predictiveMetrics(queryOptions(url)));
    return true;
  }

  if (pathname === "/alertas-stock" && request.method === "GET") {
    if (!guard(request, response, "read")) return true;
    sendJson(response, 200, await supplyService.stockAlerts(queryOptions(url)));
    return true;
  }
  const reportMatch = pathname.match(/^\/reportes\/([a-z_]+)$/);
  if (reportMatch && request.method === "GET") {
    if (!guard(request, response, "export")) return true;
    const result = await supplyService.report(reportMatch[1], queryOptions(url));
    sendJson(response, result.status, result.data);
    return true;
  }

  if (request.method === "POST" && pathname === "/inventarios/movimientos") {
    if (!guard(request, response, "write")) return true;
    const result = await supplyService.registerMovement(await readBody(request), contextFor(request));
    sendJson(response, result.status, result.data);
    return true;
  }

  const route = getCollectionRoute(pathname);
  if (!route || !collections.has(route.collectionName)) return false;

  const permission = permissionFor(request.method, pathname);
  if (!guard(request, response, permission)) return true;

  if (request.method === "GET" && !route.id) {
    sendJson(response, 200, await supplyService.list(route.collectionName, queryOptions(url)));
    return true;
  }

  if (request.method === "GET" && route.id) {
    const record = await supplyService.get(route.collectionName, route.id);
    sendJson(response, record ? 200 : 404, record || { error: "Registro no encontrado" });
    return true;
  }

  if (request.method === "POST" && !route.id) {
    const result = await supplyService.create(route.collectionName, await readBody(request), contextFor(request));
    sendJson(response, result.status, result.data);
    return true;
  }

  if (request.method === "PUT" && route.id) {
    const result = await supplyService.update(route.collectionName, route.id, await readBody(request), contextFor(request));
    sendJson(response, result.status, result.data);
    return true;
  }

  if (request.method === "DELETE" && route.id) {
    const result = await supplyService.remove(route.collectionName, route.id, contextFor(request));
    sendJson(response, result.status, result.data);
    return true;
  }

  sendJson(response, 405, { error: "Metodo no permitido" });
  return true;
}

module.exports = { handleApi, sendJson };



