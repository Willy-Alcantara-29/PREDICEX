const generatedAt = "2026-07-03T12:00:00.000Z";

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
    {
      id: "prov-003",
      razonSocial: "Importadora Duarte",
      rnc: "130778899",
      telefono: "809-555-0120",
      correo: "ordenes@duarte.example",
      estado: "Inactivo",
    },
  ],
  productos: [
    {
      id: "prd-001",
      sku: "SKU-PRD-018",
      codigoBarra: "746000000018",
      descripcion: "Arroz premium 25 lb",
      categoria: "Alimentos",
      precio: 185,
      estado: "Activo",
    },
    {
      id: "prd-002",
      sku: "SKU-PRD-104",
      codigoBarra: "746000000104",
      descripcion: "Aceite vegetal 1 gal",
      categoria: "Alimentos",
      precio: 325,
      estado: "Activo",
    },
    {
      id: "prd-003",
      sku: "SKU-PRD-210",
      codigoBarra: "746000000210",
      descripcion: "Detergente industrial 5 kg",
      categoria: "Limpieza",
      precio: 480,
      estado: "Activo",
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
      precioUnitario: 185,
    },
    {
      id: "inv-002",
      productoId: "prd-002",
      sku: "SKU-PRD-104",
      producto: "Aceite vegetal 1 gal",
      sucursal: "Almacen Central",
      stockNeto: 240,
      umbralAlerta: 60,
      precioUnitario: 325,
    },
    {
      id: "inv-003",
      productoId: "prd-003",
      sku: "SKU-PRD-210",
      producto: "Detergente industrial 5 kg",
      sucursal: "Sucursal Este",
      stockNeto: 34,
      umbralAlerta: 30,
      precioUnitario: 480,
    },
  ],
  clientes: [
    { id: "cli-001", nombre: "Maria Gonzalez", documento: "001-1234567-8", telefono: "809-555-1100", correo: "maria.gonzalez@example.com", direccion: "Santo Domingo Norte", estado: "Activo" },
    { id: "cli-002", nombre: "Carlos Ramirez", documento: "001-9876543-2", telefono: "809-555-2200", correo: "carlos.ramirez@example.com", direccion: "Santiago", estado: "Activo" },
    { id: "cli-003", nombre: "Ana Perez", documento: "402-1122334-5", telefono: "809-555-3300", correo: "ana.perez@example.com", direccion: "La Vega", estado: "Inactivo" },
  ],
  prestamos: [
    { id: "pre-001", clienteId: "cli-001", cliente: "Maria Gonzalez", monto: 85000, tasa: 14, plazoMeses: 12, balancePendiente: 64200, estado: "Activo", fecha: "2026-06-10" },
    { id: "pre-002", clienteId: "cli-002", cliente: "Carlos Ramirez", monto: 120000, tasa: 12, plazoMeses: 18, balancePendiente: 98000, estado: "Activo", fecha: "2026-06-18" },
    { id: "pre-003", clienteId: "cli-003", cliente: "Ana Perez", monto: 45000, tasa: 10, plazoMeses: 6, balancePendiente: 0, estado: "Cerrado", fecha: "2026-05-20" },
  ],
  pagos: [
    { id: "pag-001", prestamoId: "pre-001", cliente: "Maria Gonzalez", monto: 7200, metodo: "Transferencia", referencia: "TRX-10021", fecha: "2026-07-01", estado: "Aplicado" },
    { id: "pag-002", prestamoId: "pre-002", cliente: "Carlos Ramirez", monto: 9500, metodo: "Efectivo", referencia: "CAJA-221", fecha: "2026-07-02", estado: "Aplicado" },
    { id: "pag-003", prestamoId: "pre-001", cliente: "Maria Gonzalez", monto: 6800, metodo: "Tarjeta", referencia: "POS-4419", fecha: "2026-07-03", estado: "Pendiente" },
  ],  movimientos: [
    {
      id: "mov-001",
      tipo: "Entrada",
      sku: "SKU-PRD-104",
      producto: "Aceite vegetal 1 gal",
      sucursalOrigen: "Proveedor",
      sucursalDestino: "Almacen Central",
      cantidad: 120,
      nota: "Recepcion de compra",
      creadoEn: generatedAt,
    },
    {
      id: "mov-002",
      tipo: "Salida",
      sku: "SKU-PRD-018",
      producto: "Arroz premium 25 lb",
      sucursalOrigen: "Sucursal Norte",
      sucursalDestino: "Cliente",
      cantidad: 12,
      nota: "Despacho operativo",
      creadoEn: generatedAt,
    },
    {
      id: "mov-003",
      tipo: "Transferencia",
      sku: "SKU-PRD-210",
      producto: "Detergente industrial 5 kg",
      sucursalOrigen: "Almacen Central",
      sucursalDestino: "Sucursal Este",
      cantidad: 18,
      nota: "Balance multisucursal",
      creadoEn: generatedAt,
    },
  ],
};

function cloneSeedData() {
  return JSON.parse(JSON.stringify(seedData));
}

module.exports = { cloneSeedData, seedData };


