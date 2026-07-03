const fs = require("fs");
const path = require("path");
const { cloneSeedData } = require("../models/seed-data");

const DATABASE_FILE = path.resolve(__dirname, "../../database/data.json");

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function normalizeDatabase(database) {
  const seed = cloneSeedData();
  return {
    proveedores: Array.isArray(database.proveedores) && database.proveedores.length ? database.proveedores : seed.proveedores,
    productos: Array.isArray(database.productos) && database.productos.length ? database.productos : seed.productos,
    inventarios: Array.isArray(database.inventarios) && database.inventarios.length ? database.inventarios : seed.inventarios,
    movimientos: Array.isArray(database.movimientos) && database.movimientos.length ? database.movimientos : seed.movimientos,
    clientes: Array.isArray(database.clientes) && database.clientes.length ? database.clientes : seed.clientes,
    prestamos: Array.isArray(database.prestamos) && database.prestamos.length ? database.prestamos : seed.prestamos,
    pagos: Array.isArray(database.pagos) && database.pagos.length ? database.pagos : seed.pagos,
  };
}

function ensureDatabase() {
  const directory = path.dirname(DATABASE_FILE);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  if (!fs.existsSync(DATABASE_FILE)) {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(cloneSeedData(), null, 2));
  }
}

function readDatabase() {
  ensureDatabase();
  return normalizeDatabase(JSON.parse(fs.readFileSync(DATABASE_FILE, "utf8")));
}

function writeDatabase(database) {
  fs.writeFileSync(DATABASE_FILE, JSON.stringify(normalizeDatabase(database), null, 2));
}

function resetDatabase() {
  writeDatabase(cloneSeedData());
}

function nextId(prefix, collection) {
  const max = collection.reduce((current, item) => {
    const value = Number(String(item.id || "").replace(`${prefix}-`, ""));
    return Number.isFinite(value) && value > current ? value : current;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function statusForInventory(item) {
  const stock = Number(item.stockNeto || 0);
  if (stock <= 0) return "Sin Stock";
  if (stock <= Number(item.umbralAlerta || 0)) return "Bajo Umbral";
  return "Disponible";
}

function productBySku(database, sku) {
  return database.productos.find((product) => product.sku === sku);
}

function ensureProductFromInventory(database, body) {
  let product = productBySku(database, body.sku);
  if (!product) {
    product = {
      id: nextId("prd", database.productos),
      sku: body.sku,
      codigoBarra: body.codigoBarra || "",
      descripcion: body.producto,
      categoria: body.categoria || "Sin categoria",
      precio: Number(body.precioUnitario || body.precio || 0),
      estado: "Activo",
    };
    database.productos.push(product);
  }
  return product;
}

function getCollections(database) {
  return {
    proveedores: database.proveedores,
    productos: database.productos,
    inventarios: database.inventarios,
    movimientos: database.movimientos,
    clientes: database.clientes,
    prestamos: database.prestamos,
    pagos: database.pagos,
  };
}

function mapInventory(item) {
  return {
    ...item,
    stockNeto: Number(item.stockNeto || 0),
    umbralAlerta: Number(item.umbralAlerta || 0),
    precioUnitario: Number(item.precioUnitario || 0),
    estado: statusForInventory(item),
  };
}

async function health() {
  return { mode: "demo", database: "json-local", file: DATABASE_FILE };
}

async function list(collectionName, options = {}) {
  const database = readDatabase();
  const collections = getCollections(database);
  let rows = clone(collections[collectionName] || []);

  if (collectionName === "inventarios") {
    rows = rows.map(mapInventory);
    if (options.alertas === "true") {
      rows = rows.filter((item) => item.stockNeto <= item.umbralAlerta);
    }
  }

  return rows;
}

async function get(collectionName, id) {
  const rows = await list(collectionName);
  return rows.find((item) => item.id === id) || null;
}

async function create(collectionName, body) {
  const database = readDatabase();
  const collection = getCollections(database)[collectionName];
  const prefixes = { proveedores: "prov", productos: "prd", inventarios: "inv", movimientos: "mov", clientes: "cli", prestamos: "pre", pagos: "pag" };

  if (collectionName === "productos" && collection.some((item) => item.sku === body.sku)) {
    return { status: 409, data: { error: "Ya existe un producto con este SKU" } };
  }
  if (collectionName === "proveedores" && collection.some((item) => item.rnc === body.rnc)) {
    return { status: 409, data: { error: "Ya existe un proveedor con este RNC" } };
  }
  if (collectionName === "clientes" && collection.some((item) => item.documento === body.documento)) {
    return { status: 409, data: { error: "Ya existe un cliente con este documento" } };
  }

  let record = { id: nextId(prefixes[collectionName], collection), ...body };
  if (collectionName === "productos") {
    record = {
      id: record.id,
      sku: body.sku,
      codigoBarra: body.codigoBarra || "",
      descripcion: body.descripcion,
      categoria: body.categoria || "Sin categoria",
      precio: Number(body.precio || 0),
      estado: body.estado || "Activo",
    };
  }
  if (collectionName === "inventarios") {
    const product = ensureProductFromInventory(database, body);
    record = {
      id: record.id,
      productoId: product.id,
      sku: body.sku,
      producto: body.producto || product.descripcion,
      sucursal: body.sucursal,
      stockNeto: Number(body.stockNeto || 0),
      umbralAlerta: Number(body.umbralAlerta || 10),
      precioUnitario: Number(body.precioUnitario || product.precio || 0),
    };
  }
  if (collectionName === "prestamos") {
    const cliente = database.clientes.find((item) => item.id === body.clienteId);
    record = { ...record, cliente: cliente?.nombre || body.cliente || "Cliente no definido", monto: Number(body.monto || 0), tasa: Number(body.tasa || 0), plazoMeses: Number(body.plazoMeses || 0), balancePendiente: Number(body.balancePendiente || body.monto || 0), estado: body.estado || "Activo", fecha: body.fecha || new Date().toISOString().slice(0, 10) };
  }
  if (collectionName === "pagos") {
    const prestamo = database.prestamos.find((item) => item.id === body.prestamoId);
    record = { ...record, cliente: prestamo?.cliente || body.cliente || "Cliente no definido", monto: Number(body.monto || 0), fecha: body.fecha || new Date().toISOString().slice(0, 10), estado: body.estado || "Aplicado" };
    if (prestamo && record.estado === "Aplicado") prestamo.balancePendiente = Math.max(0, Number(prestamo.balancePendiente || 0) - record.monto);
  }
  if (collectionName === "movimientos") {
    record = { ...record, cantidad: Number(body.cantidad || 0), creadoEn: new Date().toISOString() };
  }

  collection.push(record);
  writeDatabase(database);
  return { status: 201, data: collectionName === "inventarios" ? mapInventory(record) : clone(record) };
}

async function update(collectionName, id, body) {
  const database = readDatabase();
  const collection = getCollections(database)[collectionName];
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) {
    return { status: 404, data: { error: "Registro no encontrado" } };
  }

  if (collectionName === "productos" && collection.some((item) => item.sku === body.sku && item.id !== id)) {
    return { status: 409, data: { error: "Ya existe un producto con este SKU" } };
  }
  if (collectionName === "proveedores" && collection.some((item) => item.rnc === body.rnc && item.id !== id)) {
    return { status: 409, data: { error: "Ya existe un proveedor con este RNC" } };
  }
  if (collectionName === "clientes" && collection.some((item) => item.documento === body.documento && item.id !== id)) {
    return { status: 409, data: { error: "Ya existe un cliente con este documento" } };
  }

  let record = { ...collection[index], ...body };
  if (collectionName === "productos") {
    record.precio = Number(record.precio || 0);
    database.inventarios.forEach((item) => {
      if (item.productoId === record.id || item.sku === record.sku) {
        item.producto = record.descripcion;
        item.sku = record.sku;
        item.precioUnitario = Number(record.precio || item.precioUnitario || 0);
      }
    });
  }
  if (collectionName === "inventarios") {
    const product = ensureProductFromInventory(database, record);
    record = {
      ...record,
      productoId: product.id,
      stockNeto: Number(record.stockNeto || 0),
      umbralAlerta: Number(record.umbralAlerta || 10),
      precioUnitario: Number(record.precioUnitario || 0),
    };
  }
  if (collectionName === "prestamos") {
    const cliente = database.clientes.find((item) => item.id === record.clienteId);
    record = { ...record, cliente: cliente?.nombre || record.cliente, monto: Number(record.monto || 0), tasa: Number(record.tasa || 0), plazoMeses: Number(record.plazoMeses || 0), balancePendiente: Number(record.balancePendiente || 0) };
  }
  if (collectionName === "pagos") {
    record = { ...record, monto: Number(record.monto || 0) };
  }

  collection[index] = record;
  writeDatabase(database);
  return { status: 200, data: collectionName === "inventarios" ? mapInventory(record) : clone(record) };
}

async function remove(collectionName, id) {
  const database = readDatabase();
  const collection = getCollections(database)[collectionName];
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) {
    return { status: 404, data: { error: "Registro no encontrado" } };
  }
  const [deleted] = collection.splice(index, 1);
  writeDatabase(database);
  return { status: 200, data: { deleted } };
}

async function registerMovement(body) {
  const database = readDatabase();
  const quantity = Number(body.cantidad || 0);
  const inventory = database.inventarios.find((item) => item.id === body.inventarioId || (item.sku === body.sku && item.sucursal === body.sucursal));
  if (!inventory) {
    return { status: 404, data: { error: "Inventario no encontrado para el movimiento" } };
  }

  const type = body.tipo;
  if (type === "Entrada") inventory.stockNeto = Number(inventory.stockNeto) + quantity;
  if (type === "Salida") inventory.stockNeto = Math.max(0, Number(inventory.stockNeto) - quantity);
  if (type === "Ajuste") inventory.stockNeto = Math.max(0, quantity);
  if (type === "Transferencia") {
    inventory.stockNeto = Math.max(0, Number(inventory.stockNeto) - quantity);
    let destination = database.inventarios.find((item) => item.sku === inventory.sku && item.sucursal === body.sucursalDestino);
    if (!destination) {
      destination = {
        id: nextId("inv", database.inventarios),
        productoId: inventory.productoId,
        sku: inventory.sku,
        producto: inventory.producto,
        sucursal: body.sucursalDestino,
        stockNeto: 0,
        umbralAlerta: inventory.umbralAlerta,
        precioUnitario: inventory.precioUnitario,
      };
      database.inventarios.push(destination);
    }
    destination.stockNeto = Number(destination.stockNeto) + quantity;
  }

  const movement = {
    id: nextId("mov", database.movimientos),
    tipo: type,
    sku: inventory.sku,
    producto: inventory.producto,
    sucursalOrigen: type === "Entrada" ? "Proveedor" : inventory.sucursal,
    sucursalDestino: type === "Transferencia" ? body.sucursalDestino : type === "Salida" ? "Cliente" : inventory.sucursal,
    cantidad: quantity,
    nota: body.nota || "",
    creadoEn: new Date().toISOString(),
  };
  database.movimientos.unshift(movement);
  writeDatabase(database);
  return { status: 201, data: movement };
}

module.exports = { create, get, health, list, registerMovement, remove, resetDatabase, update };


