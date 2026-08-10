const assert = require("assert");
const server = require("../../src/backend/server");

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

function startServer() {
  return new Promise((resolve) => server.listen(PORT, resolve));
}

function stopServer() {
  return new Promise((resolve) => server.close(resolve));
}

let token = "";
async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
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

    const protectedRoute = await request("/proveedores");
    assert.strictEqual(protectedRoute.response.status, 401);
    const protectedAudit = await request("/auditoria");
    assert.strictEqual(protectedAudit.response.status, 401);
    const protectedUsersRoles = await request("/usuarios-roles");
    assert.strictEqual(protectedUsersRoles.response.status, 401);
    const protectedSettings = await request("/configuracion");
    assert.strictEqual(protectedSettings.response.status, 401);
    const protectedBackups = await request("/backups");
    assert.strictEqual(protectedBackups.response.status, 401);

    const login = await request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@predicex.local", password: "predicex2026" }),
    });
    assert.strictEqual(login.response.status, 200);
    assert.ok(login.data.token);
    token = login.data.token;

    const page = await requestText("/");
    assert.strictEqual(page.response.status, 200);
    assert.ok(page.data.includes("PREDICEX"));

    const metrics = await request("/metrics");
    assert.strictEqual(metrics.response.status, 200);
    assert.ok(metrics.data.inventarios.totalStock >= 0);
    const usersRoles = await request("/usuarios-roles");
    assert.strictEqual(usersRoles.response.status, 200);
    assert.ok(Array.isArray(usersRoles.data.usuarios));
    assert.ok(usersRoles.data.roles.some((role) => role.rol === "Administrador" && role.permisos.includes("backup")));
    assert.ok(!JSON.stringify(usersRoles.data).toLowerCase().includes("password"));

    const configuration = await request("/configuracion");
    assert.strictEqual(configuration.response.status, 200);
    assert.strictEqual(configuration.data.adminEmail, "admin@predicex.local");
    assert.ok(!JSON.stringify(configuration.data).includes("predicex2026"));

    const updatedConfiguration = await request("/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ empresaNombre: "PREDICEX QA", moneda: "DOP", zonaHoraria: "America/Santo_Domingo", registrosPorPagina: 25, respaldoDirectorio: "C:\\PredicexBackups" }),
    });
    assert.strictEqual(updatedConfiguration.response.status, 200);
    assert.strictEqual(updatedConfiguration.data.empresaNombre, "PREDICEX QA");
    assert.strictEqual(updatedConfiguration.data.registrosPorPagina, 25);
    const restoredConfiguration = await request("/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ empresaNombre: "PREDICEX", moneda: "DOP", zonaHoraria: "America/Santo_Domingo", registrosPorPagina: 20, respaldoDirectorio: "C:\\PredicexBackups" }),
    });
    assert.strictEqual(restoredConfiguration.response.status, 200);

    const proveedores = await request("/proveedores?page=1&pageSize=10");
    assert.strictEqual(proveedores.response.status, 200);
    assert.ok(Array.isArray(proveedores.data.items));
    assert.ok(proveedores.data.pagination.total >= proveedores.data.items.length);


    const sucursales = await request("/sucursales?page=1&pageSize=10");
    assert.strictEqual(sucursales.response.status, 200);
    assert.ok(Array.isArray(sucursales.data.items));
    assert.ok(sucursales.data.pagination.total >= 1);

    const nuevaSucursal = await request("/sucursales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "Sucursal Demo QA" }),
    });
    assert.strictEqual(nuevaSucursal.response.status, 201);
    assert.strictEqual(nuevaSucursal.data.nombre, "Sucursal Demo QA");

    const sucursalDuplicada = await request("/sucursales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "Sucursal Demo QA" }),
    });
    assert.strictEqual(sucursalDuplicada.response.status, 409);

    const sucursalActualizada = await request(`/sucursales/${nuevaSucursal.data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "Sucursal Demo QA Actualizada" }),
    });
    assert.strictEqual(sucursalActualizada.response.status, 200);
    assert.strictEqual(sucursalActualizada.data.nombre, "Sucursal Demo QA Actualizada");

    const sucursalObtenida = await request(`/sucursales/${nuevaSucursal.data.id}`);
    assert.strictEqual(sucursalObtenida.response.status, 200);
    assert.strictEqual(sucursalObtenida.data.nombre, "Sucursal Demo QA Actualizada");
    const nuevoProveedor = await request("/proveedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razonSocial: "Proveedor Demo SRL", rnc: "132555777", telefono: "809-555-0199", estado: "Activo" }),
    });
    assert.strictEqual(nuevoProveedor.response.status, 201);
    assert.strictEqual(nuevoProveedor.data.rnc, "132555777");

    const proveedorActualizado = await request(`/proveedores/${nuevoProveedor.data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razonSocial: "Proveedor Demo Actualizado SRL", rnc: "132555777", telefono: "809-555-0200", estado: "Activo" }),
    });
    assert.strictEqual(proveedorActualizado.response.status, 200);
    assert.strictEqual(proveedorActualizado.data.telefono, "809-555-0200");

    const duplicado = await request("/proveedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razonSocial: "Proveedor Repetido SRL", rnc: "132555777" }),
    });
    assert.strictEqual(duplicado.response.status, 409);

    const borrarProveedor = await request(`/proveedores/${nuevoProveedor.data.id}`, { method: "DELETE" });
    assert.strictEqual(borrarProveedor.response.status, 200);
    assert.strictEqual(borrarProveedor.data.deactivated.estado, "Inactivo");

    const nuevoProducto = await request("/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku: "SKU-PRD-999", descripcion: "Producto de prueba", categoria: "Demo", codigoBarra: "746000000999", precio: 10, estado: "Activo" }),
    });
    assert.strictEqual(nuevoProducto.response.status, 201);

    const nuevoInventario = await request("/inventarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku: "SKU-PRD-999", producto: "Producto de prueba", sucursal: "Sucursal Demo", stockNeto: 20, umbralAlerta: 10, precioUnitario: 10 }),
    });
    assert.strictEqual(nuevoInventario.response.status, 201);

    const salida = await request("/inventarios/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventarioId: nuevoInventario.data.id, tipo: "Salida", cantidad: 5, nota: "Prueba" }),
    });
    assert.strictEqual(salida.response.status, 201);

    const salidaExcesiva = await request("/inventarios/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventarioId: nuevoInventario.data.id, tipo: "Salida", cantidad: 999, nota: "Prueba" }),
    });
    assert.strictEqual(salidaExcesiva.response.status, 409);

    const nuevoCliente = await request("/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "Cliente Demo Prueba", documento: "001-5555555-5", telefono: "809-555-5555", correo: "cliente.demo@example.com", estado: "Activo" }),
    });
    assert.strictEqual(nuevoCliente.response.status, 201);

    const nuevoPrestamo = await request("/prestamos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId: nuevoCliente.data.id, monto: 25000, tasa: 12, plazoMeses: 10, balancePendiente: 25000, estado: "Activo" }),
    });
    assert.strictEqual(nuevoPrestamo.response.status, 201);

    const pagoExcesivo = await request("/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prestamoId: nuevoPrestamo.data.id, monto: 30000, metodo: "Efectivo", referencia: "TEST-X", estado: "Aplicado" }),
    });
    assert.strictEqual(pagoExcesivo.response.status, 409);

    const nuevoPago = await request("/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prestamoId: nuevoPrestamo.data.id, monto: 2500, metodo: "Efectivo", referencia: "TEST-001", estado: "Aplicado" }),
    });
    assert.strictEqual(nuevoPago.response.status, 201);


    const predictiveMetrics = await request("/predictivo/metricas");
    assert.strictEqual(predictiveMetrics.response.status, 200);
    assert.strictEqual(predictiveMetrics.data.algorithm, "media-movil-salidas");
    assert.ok(Array.isArray(predictiveMetrics.data.forecasts));

    const trainedModel = await request("/predictivo/entrenar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    assert.strictEqual(trainedModel.response.status, 200);
    assert.ok(trainedModel.data.trainedAt);

    const stockAlerts = await request("/alertas-stock");
    assert.strictEqual(stockAlerts.response.status, 200);
    assert.ok(Array.isArray(stockAlerts.data));
    assert.ok(stockAlerts.data.every((item) => ["critico", "alto", "medio"].includes(item.riesgo)));
    assert.ok(stockAlerts.data.every((item) => Object.prototype.hasOwnProperty.call(item, "sku") && Object.prototype.hasOwnProperty.call(item, "stockNeto") && Object.prototype.hasOwnProperty.call(item, "recomendacion")));
    const report = await request("/reportes/pagos?page=1&pageSize=10");
    assert.strictEqual(report.response.status, 200);
    assert.ok(Array.isArray(report.data.items));
    assert.ok(report.data.metrics);

    const reportTypes = ["inventario", "bajo_stock", "movimientos", "transferencias", "productos", "proveedores", "clientes", "prestamos", "balances", "pagos"];
    for (const reportType of reportTypes) {
      const currentReport = await request(`/reportes/${reportType}`);
      assert.strictEqual(currentReport.response.status, 200);
      assert.strictEqual(currentReport.data.reporte, reportType);
      assert.ok(Array.isArray(currentReport.data.items));
      assert.strictEqual(typeof currentReport.data.total, "number");
    }

    const missingReport = await request("/reportes/no_existe");
    assert.strictEqual(missingReport.response.status, 404);

    const auditLog = await request("/auditoria?page=1&pageSize=10");
    assert.strictEqual(auditLog.response.status, 200);
    assert.ok(Array.isArray(auditLog.data.items));
    assert.ok(auditLog.data.pagination.total >= auditLog.data.items.length);
    assert.ok(auditLog.data.items.every((item) => Object.prototype.hasOwnProperty.call(item, "fecha") && Object.prototype.hasOwnProperty.call(item, "usuario") && Object.prototype.hasOwnProperty.call(item, "resultado")));
    assert.ok(!JSON.stringify(auditLog.data.items).includes("predicex2026"));
    const backups = await request("/backups?page=1&pageSize=10");
    assert.strictEqual(backups.response.status, 200);
    assert.ok(Array.isArray(backups.data.items));
    assert.ok(backups.data.pagination.total >= backups.data.items.length);

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






