const demoRepository = require("../repositories/demo-repository");
const repositoryDao = require("../dao/repository-dao");

function validateEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validate(collectionName, data) {
  const errors = [];
  if (collectionName === "productos") {
    if (!data.sku) errors.push("SKU obligatorio");
    if (!data.descripcion) errors.push("Descripcion obligatoria");
    if (Number(data.precio || 0) < 0) errors.push("Precio mayor o igual a 0");
  }
  if (collectionName === "inventarios") {
    if (!data.sku) errors.push("SKU obligatorio");
    if (!data.producto) errors.push("Producto obligatorio");
    if (!data.sucursal) errors.push("Sucursal obligatoria");
    if (Number(data.stockNeto || 0) < 0) errors.push("Stock no negativo");
    if (Number(data.precioUnitario || 0) < 0) errors.push("Precio mayor o igual a 0");
  }
  if (collectionName === "proveedores") {
    if (!data.razonSocial) errors.push("Razon social obligatoria");
    if (!data.rnc) errors.push("RNC proveedor obligatorio");
    if (!validateEmail(data.correo)) errors.push("Correo valido si se especifica");
  }
  if (collectionName === "clientes") {
    if (!data.nombre) errors.push("Nombre de cliente obligatorio");
    if (!data.documento) errors.push("Documento obligatorio");
    if (!validateEmail(data.correo)) errors.push("Correo valido si se especifica");
  }
  if (collectionName === "prestamos") {
    if (!data.clienteId) errors.push("Cliente obligatorio");
    if (Number(data.monto || 0) <= 0) errors.push("Monto mayor que 0");
    if (Number(data.tasa || 0) < 0) errors.push("Tasa no negativa");
    if (Number(data.plazoMeses || 0) <= 0) errors.push("Plazo mayor que 0");
  }
  if (collectionName === "pagos") {
    if (!data.prestamoId) errors.push("Prestamo obligatorio");
    if (Number(data.monto || 0) <= 0) errors.push("Monto de pago mayor que 0");
    if (!data.metodo) errors.push("Metodo de pago obligatorio");
  }
  if (collectionName === "movimientos") {
    if (!data.tipo) errors.push("Tipo de movimiento obligatorio");
    if (!data.inventarioId) errors.push("Inventario obligatorio");
    if (Number(data.cantidad || 0) < 0) errors.push("Cantidad no negativa");
    if (data.tipo === "Transferencia" && !data.sucursalDestino) errors.push("Sucursal destino obligatoria");
  }
  return errors;
}

async function withFallback(operation) {
  const repository = await repositoryDao.resolveRepository();
  try {
    return await operation(repository);
  } catch (error) {
    if (repository === demoRepository) throw error;
    return operation(repositoryDao.forceDemo());
  }
}

async function health() {
  return withFallback(async (repository) => repository.health());
}

async function list(collectionName, options) {
  return withFallback((repository) => repository.list(collectionName, options));
}

async function get(collectionName, id) {
  return withFallback((repository) => repository.get(collectionName, id));
}

async function create(collectionName, body) {
  const errors = validate(collectionName, body);
  if (errors.length) return { status: 400, data: { error: "Validacion fallida", errors } };
  return withFallback((repository) => repository.create(collectionName, body));
}

async function update(collectionName, id, body) {
  const errors = validate(collectionName, body);
  if (errors.length) return { status: 400, data: { error: "Validacion fallida", errors } };
  return withFallback((repository) => repository.update(collectionName, id, body));
}

async function remove(collectionName, id) {
  return withFallback((repository) => repository.remove(collectionName, id));
}

async function registerMovement(body) {
  const errors = validate("movimientos", body);
  if (errors.length) return { status: 400, data: { error: "Validacion fallida", errors } };
  return withFallback((repository) => repository.registerMovement(body));
}

function resetForTests() {
  process.env.PREDICEX_MODE = "demo";
  repositoryDao.reset();
  demoRepository.resetDatabase();
}

module.exports = { create, get, health, list, registerMovement, remove, resetForTests, update };
