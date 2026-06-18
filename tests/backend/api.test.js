const assert = require("assert");
const server = require("../../src/backend/server");

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

function startServer() {
  return new Promise((resolve) => {
    server.listen(PORT, resolve);
  });
}

function stopServer() {
  return new Promise((resolve) => {
    server.close(resolve);
  });
}

async function request(path, options) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  return { response, data };
}

async function run() {
  await startServer();

  try {
    const health = await request("/health");
    assert.strictEqual(health.response.status, 200);
    assert.strictEqual(health.data.status, "ok");

    const proveedores = await request("/proveedores");
    assert.strictEqual(proveedores.response.status, 200);
    assert.ok(Array.isArray(proveedores.data));

    const nuevoProveedor = await request("/proveedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razonSocial: "Proveedor Demo SRL",
        rnc: "132555777",
        telefono: "809-555-0199",
      }),
    });
    assert.strictEqual(nuevoProveedor.response.status, 201);
    assert.strictEqual(nuevoProveedor.data.rnc, "132555777");

    const duplicado = await request("/proveedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razonSocial: "Proveedor Repetido SRL",
        rnc: "132555777",
      }),
    });
    assert.strictEqual(duplicado.response.status, 409);

    const productos = await request("/productos");
    assert.strictEqual(productos.response.status, 200);
    assert.ok(Array.isArray(productos.data));

    const inventarios = await request("/inventarios?alertas=true");
    assert.strictEqual(inventarios.response.status, 200);
    assert.ok(inventarios.data.every((item) => item.stockNeto <= item.umbralAlerta));

    console.log("Pruebas backend OK");
  } finally {
    await stopServer();
  }
}

run().catch(async (error) => {
  await stopServer().catch(() => {});
  console.error(error);
  process.exit(1);
});
