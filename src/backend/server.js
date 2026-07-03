const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");
const { handleApi, sendJson } = require("./controllers/http-controller");
const supplyService = require("./services/supply-service");

const PORT = Number(process.env.PORT || 3000);
const FRONTEND_DIRECTORY = path.resolve(__dirname, "../frontend");

function sendFile(response, filePath) {
  const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
  };
  response.writeHead(200, {
    "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
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

async function router(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (await handleApi(request, response, url)) {
      return;
    }
  } catch (error) {
    sendJson(response, 400, { error: error.message || "Solicitud invalida" });
    return;
  }

  if (request.method === "GET" && handleStaticFrontend(url.pathname, response)) {
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
      "POST /inventarios",
      "POST /inventarios/movimientos",
      "GET /movimientos",
    ],
  });
}

const server = http.createServer((request, response) => {
  router(request, response).catch((error) => {
    sendJson(response, 500, { error: error.message || "Error interno del servidor" });
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`PREDICEX backend disponible en http://localhost:${PORT}`);
  });
}

module.exports = server;
module.exports.resetDatabaseForTests = supplyService.resetForTests;
