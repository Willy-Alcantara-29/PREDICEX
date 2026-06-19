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

async function requestText(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  const data = await response.text();
  return { response, data };
}

async function run() {
  server.resetDatabaseForTests();
  await startServer();

  try {
    const health = await request("/health");
    assert.strictEqual(health.response.status, 200);
    assert.strictEqual(health.data.status, "ok");
    assert.strictEqual(health.data.database, "json-local");

    const page = await requestText("/");
    assert.strictEqual(page.response.status, 200);
    assert.ok(page.data.includes("PREDICEX"));

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

    const proveedorCreado = await request(`/proveedores/${nuevoProveedor.data.id}`);
    assert.strictEqual(proveedorCreado.response.status, 200);
    assert.strictEqual(proveedorCreado.data.razonSocial, "Proveedor Demo SRL");

    const proveedorActualizado = await request(`/proveedores/${nuevoProveedor.data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razonSocial: "Proveedor Demo Actualizado SRL",
        rnc: "132555777",
        telefono: "809-555-0200",
        estado: "Activo",
      }),
    });
    assert.strictEqual(proveedorActualizado.response.status, 200);
    assert.strictEqual(proveedorActualizado.data.telefono, "809-555-0200");

    const duplicado = await request("/proveedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razonSocial: "Proveedor Repetido SRL",
        rnc: "132555777",
      }),
    });
    assert.strictEqual(duplicado.response.status, 409);

    const borrarProveedor = await request(`/proveedores/${nuevoProveedor.data.id}`, {
      method: "DELETE",
    });
    assert.strictEqual(borrarProveedor.response.status, 200);

    const productos = await request("/productos");
    assert.strictEqual(productos.response.status, 200);
    assert.ok(Array.isArray(productos.data));

    const nuevoProducto = await request("/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: "SKU-PRD-999",
        descripcion: "Producto de prueba",
        categoria: "Demo",
      }),
    });
    assert.strictEqual(nuevoProducto.response.status, 201);

    const productoActualizado = await request(`/productos/${nuevoProducto.data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: "SKU-PRD-999",
        descripcion: "Producto de prueba actualizado",
        categoria: "Demo",
      }),
    });
    assert.strictEqual(productoActualizado.response.status, 200);
    assert.strictEqual(productoActualizado.data.descripcion, "Producto de prueba actualizado");

    const borrarProducto = await request(`/productos/${nuevoProducto.data.id}`, {
      method: "DELETE",
    });
    assert.strictEqual(borrarProducto.response.status, 200);

    const inventarios = await request("/inventarios?alertas=true");
    assert.strictEqual(inventarios.response.status, 200);
    assert.ok(inventarios.data.every((item) => item.stockNeto <= item.umbralAlerta));

    const nuevoInventario = await request("/inventarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: "SKU-PRD-999",
        producto: "Producto de prueba",
        sucursal: "Sucursal Demo",
        stockNeto: 4,
        umbralAlerta: 10,
      }),
    });
    assert.strictEqual(nuevoInventario.response.status, 201);

    const inventarioActualizado = await request(`/inventarios/${nuevoInventario.data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: "SKU-PRD-999",
        producto: "Producto de prueba",
        sucursal: "Sucursal Demo",
        stockNeto: 18,
        umbralAlerta: 10,
      }),
    });
    assert.strictEqual(inventarioActualizado.response.status, 200);
    assert.strictEqual(inventarioActualizado.data.stockNeto, 18);

    const borrarInventario = await request(`/inventarios/${nuevoInventario.data.id}`, {
      method: "DELETE",
    });
    assert.strictEqual(borrarInventario.response.status, 200);

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
