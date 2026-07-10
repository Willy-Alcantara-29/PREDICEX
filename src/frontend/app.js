const API_URL = "http://localhost:3000";

const state = {
  proveedores: [],
  productos: [],
  inventarios: [],
  movimientos: [],
  clientes: [],
  prestamos: [],
  pagos: [],
  sucursalesMeta: {},
  filters: {
    proveedores: { search: "", estado: "Todos", rnc: "Todos" },
    productos: { search: "", categoria: "Todas", estado: "Todos" },
    inventarios: { search: "", sucursal: "Todas", estado: "Todos" },
    clientes: { search: "", estado: "Todos" },
    prestamos: { search: "", estado: "Todos" },
    pagos: { search: "", estado: "Todos" },
    alertas: { search: "", sucursal: "Todas", severidad: "Todas" },
    sucursales: { search: "", estado: "Todos" },
  },
  editing: { proveedores: null, productos: null, inventarios: null, clientes: null, prestamos: null, pagos: null, sucursales: null },
};

const BRANCH_META_KEY = "predicex_sucursales_meta";
function loadBranchMeta() {
  try {
    return JSON.parse(localStorage.getItem(BRANCH_META_KEY)) || {};
  } catch (error) {
    return {};
  }
}
function saveBranchMeta(meta) {
  localStorage.setItem(BRANCH_META_KEY, JSON.stringify(meta));
}
state.sucursalesMeta = loadBranchMeta();


function injectFinancialModules() {
  const navList = document.querySelector(".nav-list");
  const workspace = document.querySelector(".workspace");
  if (!navList || !workspace || document.querySelector("#clientsView")) return;

  navList.insertAdjacentHTML("beforeend", `
    <button class="nav-item" data-view="clientsView"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>Clientes</span></button>
    <button class="nav-item" data-view="loansView"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M13 16V8"/><path d="M18 16v-8"/></svg><span>Prestamos</span></button>
    <button class="nav-item" data-view="paymentsView"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg><span>Pagos</span></button>
  `);

  workspace.insertAdjacentHTML("beforeend", `
    <section id="clientsView" class="view">
      <article class="panel products-panel">
        <div class="panel-heading products-heading"><div><p class="eyebrow">Cartera comercial</p><h3>Clientes CRUD</h3><span>Registro, busqueda y seguimiento de clientes</span></div></div>
        <div class="product-kpis"><article><span class="product-kpi-icon total"></span><div><strong id="clientTotalKpi">0</strong><span>Total clientes</span></div></article><article><span class="product-kpi-icon best"></span><div><strong id="clientActiveKpi">0</strong><span>Clientes activos</span></div></article><article><span class="product-kpi-icon category"></span><div><strong id="clientLoanKpi">0</strong><span>Con prestamos</span></div></article><article><span class="product-kpi-icon low"></span><div><strong id="clientInactiveKpi">0</strong><span>Inactivos</span></div></article></div>
        <div class="form-helper-note">Aqui puedes crear un cliente nuevo o editar su informacion comercial.</div><form id="clientForm" class="crud-form"><label>Nombre<span class="field-shell supplier-company-field"><input name="nombre" placeholder="Nombre completo" required /></span></label><label>Documento<span class="field-shell supplier-doc-field"><input name="documento" placeholder="001-0000000-0" required /></span></label><label>Telefono<span class="field-shell supplier-phone-field"><input name="telefono" placeholder="809-555-0000" /></span></label><label>Correo<span class="field-shell supplier-email-field"><input name="correo" type="email" placeholder="cliente@correo.com" /></span></label><label>Direccion<span class="field-shell branch-field"><input name="direccion" placeholder="Direccion" /></span></label><label>Estado<span class="field-shell supplier-status-field"><input name="estado" placeholder="Activo" /></span></label><button type="submit" class="small-button" data-default-text="Guardar cliente">Guardar cliente</button></form>
        <div class="product-tools module-tools"><label class="search-control"><span>Buscar cliente</span><input data-search="clientes" type="search" placeholder="Buscar por nombre, documento o correo" /></label><label><span>Estado</span><select data-filter="clientes.estado"><option>Todos</option><option>Activo</option><option>Inactivo</option></select></label><button type="button" class="export-button" data-export="clientes">Exportar Excel</button></div>
        <div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Documento</th><th>Telefono</th><th>Correo</th><th>Direccion</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="clientTable"></tbody></table></div>
      </article>
    </section>
    <section id="loansView" class="view">
      <article class="panel products-panel">
        <div class="panel-heading products-heading"><div><p class="eyebrow">Cartera financiera</p><h3>Prestamos CRUD</h3><span>Prestamos, balances y estados</span></div></div>
        <div class="product-kpis"><article><span class="product-kpi-icon total"></span><div><strong id="loanTotalKpi">0</strong><span>Total prestamos</span></div></article><article><span class="product-kpi-icon best"></span><div><strong id="loanActiveKpi">0</strong><span>Activos</span></div></article><article><span class="product-kpi-icon category"></span><div><strong id="loanAmountKpi">RD$ 0</strong><span>Monto colocado</span></div></article><article><span class="product-kpi-icon low"></span><div><strong id="loanBalanceKpi">RD$ 0</strong><span>Balance pendiente</span></div></article></div>
        <form id="loanForm" class="crud-form"><label>Cliente<select name="clienteId" required></select></label><label>Monto<span class="field-shell stock-field"><input name="monto" type="number" min="0" step="0.01" placeholder="50000" required /></span></label><label>Tasa %<span class="field-shell stock-field"><input name="tasa" type="number" min="0" step="0.01" placeholder="12" required /></span></label><label>Plazo meses<span class="field-shell alert-field"><input name="plazoMeses" type="number" min="1" placeholder="12" required /></span></label><label>Balance<span class="field-shell stock-field"><input name="balancePendiente" type="number" min="0" step="0.01" placeholder="50000" /></span></label><label>Fecha<span class="field-shell product-description-field"><input name="fecha" type="date" /></span></label><label>Estado<span class="field-shell supplier-status-field"><input name="estado" placeholder="Activo" /></span></label><button type="submit" class="small-button" data-default-text="Guardar prestamo">Guardar prestamo</button></form>
        <div class="product-tools module-tools"><label class="search-control"><span>Buscar prestamo</span><input data-search="prestamos" type="search" placeholder="Buscar por cliente o estado" /></label><label><span>Estado</span><select data-filter="prestamos.estado"><option>Todos</option><option>Activo</option><option>Cerrado</option><option>En mora</option></select></label><button type="button" class="export-button" data-export="prestamos">Exportar Excel</button></div>
        <div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Monto</th><th>Tasa</th><th>Plazo</th><th>Balance</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody id="loanTable"></tbody></table></div>
      </article>
    </section>
    <section id="paymentsView" class="view">
      <article class="panel products-panel">
        <div class="panel-heading products-heading"><div><p class="eyebrow">Recaudos</p><h3>Pagos CRUD</h3><span>Registro y control de pagos</span></div></div>
        <div class="product-kpis"><article><span class="product-kpi-icon total"></span><div><strong id="paymentTotalKpi">0</strong><span>Total pagos</span></div></article><article><span class="product-kpi-icon best"></span><div><strong id="paymentAppliedKpi">0</strong><span>Aplicados</span></div></article><article><span class="product-kpi-icon category"></span><div><strong id="paymentAmountKpi">RD$ 0</strong><span>Monto pagado</span></div></article><article><span class="product-kpi-icon low"></span><div><strong id="paymentPendingKpi">0</strong><span>Pendientes</span></div></article></div>
        <form id="paymentForm" class="crud-form"><label>Prestamo<select name="prestamoId" required></select></label><label>Monto<span class="field-shell stock-field"><input name="monto" type="number" min="0" step="0.01" placeholder="5000" required /></span></label><label>Metodo<span class="field-shell supplier-status-field"><input name="metodo" placeholder="Efectivo" required /></span></label><label>Referencia<span class="field-shell product-description-field"><input name="referencia" placeholder="REC-001" /></span></label><label>Fecha<span class="field-shell product-description-field"><input name="fecha" type="date" /></span></label><label>Estado<span class="field-shell supplier-status-field"><input name="estado" placeholder="Aplicado" /></span></label><button type="submit" class="small-button" data-default-text="Guardar pago">Guardar pago</button></form>
        <div class="product-tools module-tools"><label class="search-control"><span>Buscar pago</span><input data-search="pagos" type="search" placeholder="Buscar por cliente, metodo o referencia" /></label><label><span>Estado</span><select data-filter="pagos.estado"><option>Todos</option><option>Aplicado</option><option>Pendiente</option><option>Anulado</option></select></label><button type="button" class="export-button" data-export="pagos">Exportar Excel</button></div>
        <div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Prestamo</th><th>Monto</th><th>Metodo</th><th>Referencia</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="paymentTable"></tbody></table></div>
      </article>
    </section>
  `);
}

function injectOperationalModules() {
  const navList = document.querySelector(".nav-list");
  const workspace = document.querySelector(".workspace");
  const productsNavItem = navList?.querySelector('[data-view="productsView"]');
  if (!navList || !workspace || document.querySelector("#alertsView")) return;

  productsNavItem?.insertAdjacentHTML("afterend", `
    <button class="nav-item" data-view="alertsView"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg><span>Alertas</span></button>
    <button class="nav-item" data-view="branchesView"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg><span>Sucursales</span></button>
  `);

  workspace.insertAdjacentHTML("beforeend", `
    <section id="alertsView" class="view">
      <article class="panel products-panel">
        <div class="panel-heading products-heading"><div><p class="eyebrow">Monitoreo de quiebres de stock</p><h3>Alertas de Inventario</h3><span>Productos bajo umbral o sin existencia, calculado en tiempo real</span></div></div>
        <div class="product-kpis" aria-label="Indicadores de alertas">
          <article><span class="product-kpi-icon low" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg></span><div><strong id="alertTotalKpi">0</strong><span>Alertas activas</span></div></article>
          <article><span class="product-kpi-icon low" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg></span><div><strong id="alertOutOfStockKpi">0</strong><span>Sin stock</span></div></article>
          <article><span class="product-kpi-icon category" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg></span><div><strong id="alertLowStockKpi">0</strong><span>Bajo umbral</span></div></article>
          <article><span class="product-kpi-icon total" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></span><div><strong id="alertValueKpi">RD$ 0</strong><span>Valor en riesgo</span></div></article>
        </div>
        <div class="form-helper-note">Estas alertas se generan automaticamente cuando el stock de un producto llega al umbral configurado en Inventario.</div>
        <div class="product-tools module-tools" aria-label="Herramientas de alertas">
          <label class="search-control"><span>Buscar alerta</span><input data-search="alertas" type="search" placeholder="Buscar por SKU, producto o sucursal" /></label>
          <label><span>Sucursal</span><select id="alertBranchFilter" data-filter="alertas.sucursal"><option>Todas</option></select></label>
          <label><span>Severidad</span><select data-filter="alertas.severidad"><option>Todas</option><option>Bajo Umbral</option><option>Sin Stock</option></select></label>
          <button type="button" class="export-button" data-export="alertas">Exportar Excel</button>
        </div>
        <div class="table-wrap"><table><thead><tr><th>SKU</th><th>Producto</th><th>Sucursal</th><th>Stock actual</th><th>Umbral</th><th>Severidad</th><th>Valor en riesgo</th><th>Acciones</th></tr></thead><tbody id="alertTable"></tbody></table></div>
      </article>
    </section>
    <section id="branchesView" class="view">
      <article class="panel products-panel">
        <div class="panel-heading products-heading"><div><p class="eyebrow">Red de distribucion</p><h3>Sucursales CRUD</h3><span>Puntos de venta y almacenes conectados al inventario</span></div></div>
        <div class="product-kpis" aria-label="Indicadores de sucursales">
          <article><span class="product-kpi-icon total" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg></span><div><strong id="branchTotalKpi">0</strong><span>Sucursales</span></div></article>
          <article><span class="product-kpi-icon best" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 17 9 11l4 4 8-8" /><path d="M14 7h7v7" /></svg></span><div><strong id="branchTopStockKpi">--</strong><span>Mayor stock</span></div></article>
          <article><span class="product-kpi-icon low" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg></span><div><strong id="branchAlertKpi">0</strong><span>Con alertas</span></div></article>
          <article><span class="product-kpi-icon category" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></span><div><strong id="branchValueKpi">RD$ 0</strong><span>Valor total inventario</span></div></article>
        </div>
        <div class="form-helper-note">Registra una sucursal para habilitarla en Inventario y Movimientos. Las metricas de stock se calculan con el inventario asociado.</div>
        <form id="branchForm" class="crud-form">
          <label>Nombre<span class="field-shell branch-field"><input name="nombre" placeholder="Sucursal Sur" required /></span></label>
          <label>Direccion<span class="field-shell product-description-field"><input name="direccion" placeholder="Av. Principal #123" /></span></label>
          <label>Encargado<span class="field-shell supplier-company-field"><input name="encargado" placeholder="Nombre del encargado" /></span></label>
          <label>Telefono<span class="field-shell supplier-phone-field"><input name="telefono" placeholder="809-555-0199" /></span></label>
          <label>Estado<span class="field-shell supplier-status-field"><input name="estado" placeholder="Activa" /></span></label>
          <button type="submit" class="small-button" data-default-text="Guardar sucursal">Guardar sucursal</button>
        </form>
        <div class="product-tools module-tools" aria-label="Herramientas de sucursales">
          <label class="search-control"><span>Buscar sucursal</span><input data-search="sucursales" type="search" placeholder="Buscar por nombre, encargado o direccion" /></label>
          <label><span>Estado</span><select data-filter="sucursales.estado"><option>Todos</option><option>Activa</option><option>Inactiva</option></select></label>
          <button type="button" class="export-button" data-export="sucursales">Exportar Excel</button>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Sucursal</th><th>Encargado</th><th>Telefono</th><th>Productos</th><th>Stock total</th><th>Valor inventario</th><th>Alertas</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="branchTable"></tbody></table></div>
      </article>
    </section>
  `);
}

injectOperationalModules();
injectFinancialModules();
function injectDashboardOperationsPanel() {
  const dashboard = document.querySelector("#dashboardView");
  if (!dashboard || document.querySelector("#operationsMetricGrid")) return;
  const executiveGrid = dashboard.querySelector(".executive-grid");
  executiveGrid?.insertAdjacentHTML("afterend", `
    <div id="operationsMetricGrid" class="executive-grid operations-grid" aria-label="Indicadores operativos dinamicos">
      <article class="executive-card"><span>Total productos</span><strong id="dashboardProductsMetric">0</strong><small>Catalogo activo</small></article>
      <article class="executive-card money"><span>Entradas hoy</span><strong id="dashboardEntriesMetric">0</strong><small>Movimientos de entrada</small></article>
      <article class="executive-card critical"><span>Salidas hoy</span><strong id="dashboardOutputsMetric">0</strong><small>Despachos registrados</small></article>
      <article class="executive-card sync"><span>Transferencias</span><strong id="dashboardTransfersMetric">0</strong><small>Entre sucursales</small></article>
      <article class="executive-card critical"><span>Alertas</span><strong id="dashboardAlertsMetric">0</strong><small>Stock bajo o cero</small></article>
      <article class="executive-card"><span>Mas vendido</span><strong id="dashboardBestSellerMetric">--</strong><small>Segun salidas</small></article>
      <article class="executive-card money"><span>Proveedores activos</span><strong id="dashboardActiveSuppliersMetric">0</strong><small>Homologados activos</small></article>
      <article class="executive-card sync"><span>Ultima sincronizacion</span><strong id="dashboardSyncMetric">--:--</strong><small>Base de datos actualizada</small></article>
    </div>
  `);
}

injectDashboardOperationsPanel();
const loginView = document.querySelector("#loginView");
const appView = document.querySelector("#appView");
const loginForm = document.querySelector("#loginForm");
const logoutButton = document.querySelector("#logoutButton");
const viewTitle = document.querySelector("#viewTitle");
const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const inventoryTable = document.querySelector("#inventoryTable");
const supplierTable = document.querySelector("#supplierTable");
const productTable = document.querySelector("#productTable");
const clientTable = document.querySelector("#clientTable");
const loanTable = document.querySelector("#loanTable");
const paymentTable = document.querySelector("#paymentTable");
const alertTable = document.querySelector("#alertTable");
const branchTable = document.querySelector("#branchTable");
const branchForm = document.querySelector("#branchForm");
const movementList = document.querySelector("#movementList");
const addStockButton = document.querySelector("#addStockButton");
const supplierForm = document.querySelector("#supplierForm");
const productForm = document.querySelector("#productForm");
const inventoryForm = document.querySelector("#inventoryForm");
const movementForm = document.querySelector("#movementForm");
const clientForm = document.querySelector("#clientForm");
const loanForm = document.querySelector("#loanForm");
const paymentForm = document.querySelector("#paymentForm");
const statusMessage = document.querySelector("#statusMessage");
const currentDateTime = document.querySelector("#currentDateTime");
const inventoryDate = document.querySelector("#inventoryDate");
const inventoryTime = document.querySelector("#inventoryTime");

const titles = {
  dashboardView: "Dashboard Operativo",
  inventoryView: "Inventario multisucursal",
  suppliersView: "Proveedores",
  productsView: "Productos",
  clientsView: "Clientes",
  loansView: "Prestamos",
  paymentsView: "Pagos",
  alertsView: "Alertas de Inventario",
  branchesView: "Sucursales",
};

function setStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.className = `status-note ${type}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    const details = Array.isArray(data.errors) ? `: ${data.errors.join(", ")}` : "";
    throw new Error(`${data.error || "No se pudo completar la operacion"}${details}`);
  }
  return data;
}

function getFormData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function money(value) {
  return Number(value || 0).toLocaleString("es-DO", { style: "currency", currency: "DOP" });
}

function normalize(text) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function statusForInventory(item) {
  const stock = Number(item.stockNeto || 0);
  if (stock <= 0) return "Sin Stock";
  if (stock <= Number(item.umbralAlerta || 0)) return "Bajo Umbral";
  return "Disponible";
}

function tagClass(status) {
  if (status === "Sin Stock" || status === "Inactivo") return "empty";
  if (status === "Bajo Umbral") return "low";
  return "ok";
}

function validateForm(collectionName, data) {
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
    if (data.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) errors.push("Correo valido si se especifica");
  }
  if (collectionName === "clientes") {
    if (!data.nombre) errors.push("Nombre de cliente obligatorio");
    if (!data.documento) errors.push("Documento obligatorio");
    if (data.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) errors.push("Correo valido si se especifica");
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
  }  if (collectionName === "movimientos") {
    if (!data.inventarioId) errors.push("Inventario obligatorio");
    if (Number(data.cantidad || 0) < 0) errors.push("Cantidad no negativa");
    if (data.tipo === "Transferencia" && !data.sucursalDestino) errors.push("Sucursal destino obligatoria");
  }
  return errors;
}

function clearForm(form, collectionName) {
  form.reset();
  if (collectionName) state.editing[collectionName] = null;
  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton?.dataset.defaultText) submitButton.textContent = submitButton.dataset.defaultText;
}

function fillForm(form, data, collectionName) {
  Object.entries(data || {}).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value ?? "";
  });
  state.editing[collectionName] = data.id;
  form.querySelector("button[type='submit']").textContent = "Actualizar";
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function withButtonLock(form, callback) {
  const button = form.querySelector("button[type='submit']");
  const text = button.textContent;
  button.disabled = true;
  button.classList.add("is-processing");
  button.textContent = "Guardando...";
  return callback().finally(() => {
    button.disabled = false;
    button.classList.remove("is-processing");
    button.textContent = button.dataset.defaultText || text;
  });
}

function filteredSuppliers() {
  const filter = state.filters.proveedores;
  return state.proveedores.filter((item) => {
    const haystack = normalize(`${item.razonSocial} ${item.rnc} ${item.correo} ${item.telefono}`);
    const matchesSearch = !filter.search || haystack.includes(normalize(filter.search));
    const matchesStatus = filter.estado === "Todos" || item.estado === filter.estado;
    const matchesRnc = filter.rnc === "Todos" || (filter.rnc === "Registrados" ? Boolean(item.rnc) : !item.rnc);
    return matchesSearch && matchesStatus && matchesRnc;
  });
}

function filteredProducts() {
  const filter = state.filters.productos;
  return state.productos.filter((item) => {
    const haystack = normalize(`${item.sku} ${item.descripcion} ${item.codigoBarra} ${item.categoria}`);
    const matchesSearch = !filter.search || haystack.includes(normalize(filter.search));
    const matchesCategory = filter.categoria === "Todas" || item.categoria === filter.categoria;
    const matchesStatus = filter.estado === "Todos" || (item.estado || "Activo") === filter.estado;
    return matchesSearch && matchesCategory && matchesStatus;
  });
}

function filteredInventory() {
  const filter = state.filters.inventarios;
  return state.inventarios.filter((item) => {
    const status = item.estado || statusForInventory(item);
    const haystack = normalize(`${item.sku} ${item.producto} ${item.sucursal}`);
    const matchesSearch = !filter.search || haystack.includes(normalize(filter.search));
    const matchesBranch = filter.sucursal === "Todas" || item.sucursal === filter.sucursal;
    const matchesStatus = filter.estado === "Todos" || status === filter.estado;
    return matchesSearch && matchesBranch && matchesStatus;
  });
}

function renderInventory() {
  const rows = filteredInventory();
  inventoryTable.innerHTML = rows.map((item) => {
    const status = item.estado || statusForInventory(item);
    return `
      <tr>
        <td><span class="row-icon sku-icon"></span>${item.sku}</td>
        <td><span class="row-icon product-icon"></span>${item.producto}</td>
        <td><span class="row-icon branch-icon"></span>${item.sucursal}</td>
        <td><strong>${Number(item.stockNeto || 0).toLocaleString("es-DO")}</strong></td>
        <td>${money(item.precioUnitario)}</td>
        <td><span class="tag ${tagClass(status)}">${status}</span></td>
        <td>${new Date().toLocaleDateString("es-DO")} ${new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}</td>
        <td class="table-actions">
          <button type="button" data-action="edit-inventory" data-id="${item.id}">Editar</button>
          <button type="button" data-action="delete-inventory" data-id="${item.id}">Eliminar</button>
        </td>
      </tr>`;
  }).join("");
  renderMovementOptions();
}

function renderSuppliers() {
  const rows = filteredSuppliers();
  document.querySelector("#supplierTotalKpi").textContent = state.proveedores.length;
  document.querySelector("#supplierActiveKpi").textContent = state.proveedores.filter((item) => item.estado === "Activo").length;
  document.querySelector("#supplierEmailKpi").textContent = state.proveedores.filter((item) => item.correo).length;
  document.querySelector("#supplierPhoneKpi").textContent = state.proveedores.filter((item) => item.telefono).length;
  supplierTable.innerHTML = rows.map((supplier) => `
    <tr>
      <td><span class="row-icon supplier-company-icon"></span>${supplier.razonSocial}</td>
      <td><span class="row-icon supplier-doc-icon"></span>${supplier.rnc}</td>
      <td>${supplier.telefono || "-"}</td>
      <td>${supplier.correo || "-"}</td>
      <td><span class="tag ${tagClass(supplier.estado)}">${supplier.estado || "Activo"}</span></td>
      <td>${new Date().toLocaleDateString("es-DO")}</td>
      <td class="table-actions">
        <button type="button" data-action="edit-supplier" data-id="${supplier.id}">Editar</button>
        <button type="button" data-action="delete-supplier" data-id="${supplier.id}">Eliminar</button>
      </td>
    </tr>`).join("");
}

function renderProducts() {
  const rows = filteredProducts();
  const categories = new Set(state.productos.map((product) => product.categoria).filter(Boolean));
  const lowStockProductIds = new Set(state.inventarios.filter((item) => Number(item.stockNeto) <= Number(item.umbralAlerta)).map((item) => item.productoId));
  document.querySelector("#productTotalKpi").textContent = state.productos.length;
  document.querySelector("#categoryTotalKpi").textContent = categories.size;
  document.querySelector("#productLowStockKpi").textContent = lowStockProductIds.size;
  document.querySelector("#bestProductKpi").textContent = state.movimientos[0]?.sku || state.productos[0]?.sku || "--";
  productTable.innerHTML = rows.map((product) => `
    <tr>
      <td><span class="row-icon product-sku-icon"></span>${product.sku}</td>
      <td><span class="row-icon product-row-icon"></span>${product.descripcion}</td>
      <td>${product.codigoBarra || "-"}</td>
      <td><span class="tag product-category-tag">${product.categoria || "Sin categoria"}</span></td>
      <td>${money(product.precio)}</td>
      <td><span class="tag ${tagClass(product.estado || "Activo")}">${product.estado || "Activo"}</span></td>
      <td class="table-actions">
        <button type="button" data-action="edit-product" data-id="${product.id}">Editar</button>
        <button type="button" data-action="delete-product" data-id="${product.id}">Eliminar</button>
      </td>
    </tr>`).join("");
}

function renderMovements() {
  if (!movementList) return;
  movementList.innerHTML = state.movimientos.slice(0, 6).map((movement) => {
    const kind = movement.tipo === "Entrada" ? "entry" : movement.tipo === "Salida" ? "output" : movement.tipo === "Transferencia" ? "transfer" : "alert";
    return `
      <li class="activity-card ${kind}">
        <span class="activity-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 17 9 11l4 4 8-8" /><path d="M14 7h7v7" /></svg></span>
        <div>
          <strong>${movement.tipo}</strong>
          <span>${movement.cantidad} unidades - ${movement.producto}</span>
          <small>${movement.sucursalOrigen || "-"} a ${movement.sucursalDestino || "-"} - ${new Date(movement.creadoEn || Date.now()).toLocaleString("es-DO")}</small>
        </div>
      </li>`;
  }).join("");
}

function renderMovementOptions() {
  if (!movementForm) return;
  const select = movementForm.elements.inventarioId;
  select.innerHTML = state.inventarios.map((item) => `<option value="${item.id}">${item.sku} - ${item.producto} / ${item.sucursal}</option>`).join("");
}

function renderDashboard() {
  const totalStock = state.inventarios.reduce((total, item) => total + Number(item.stockNeto || 0), 0);
  const lowStock = state.inventarios.filter((item) => Number(item.stockNeto) <= Number(item.umbralAlerta)).length;
  const activeBranches = new Set(state.inventarios.map((item) => item.sucursal)).size;
  const estimatedInventoryValue = state.inventarios.reduce((total, item) => total + Number(item.stockNeto || 0) * Number(item.precioUnitario || 0), 0);
  const now = new Date();
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayMovements = state.movimientos.filter((item) => String(item.creadoEn || item.fecha || "").slice(0, 10) === todayKey);
  const movementCounts = todayMovements.reduce((acc, item) => ({ ...acc, [item.tipo]: (acc[item.tipo] || 0) + 1 }), {});
  const salesBySku = state.movimientos.filter((item) => item.tipo === "Salida").reduce((acc, item) => {
    acc[item.sku] = (acc[item.sku] || 0) + Number(item.cantidad || 0);
    return acc;
  }, {});
  const bestSellerSku = Object.entries(salesBySku).sort((a, b) => b[1] - a[1])[0]?.[0] || state.productos[0]?.sku || "--";
  document.querySelector("#totalStockMetric").textContent = totalStock.toLocaleString("es-DO");
  document.querySelector("#lowStockMetric").textContent = lowStock;
  document.querySelector("#supplierMetric").textContent = state.proveedores.filter((item) => item.estado === "Activo").length;
  document.querySelector("#productMetric").textContent = state.productos.filter((item) => (item.estado || "Activo") === "Activo").length;
  document.querySelector("#executiveStockMetric").textContent = totalStock.toLocaleString("es-DO");
  document.querySelector("#inventoryValueMetric").textContent = estimatedInventoryValue.toLocaleString("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 });
  document.querySelector("#criticalProductsMetric").textContent = lowStock;
  document.querySelector("#lastSyncMetric").textContent = now.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
  document.querySelector("#inventoryTotalKpi").textContent = totalStock.toLocaleString("es-DO");
  document.querySelector("#activeBranchesKpi").textContent = activeBranches;
  document.querySelector("#lowInventoryKpi").textContent = lowStock;
  document.querySelector("#todayMovementsKpi").textContent = todayMovements.length;
  document.querySelector("#inventoryLastSync").textContent = now.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
  document.querySelectorAll(".preview-kpis strong")[0].textContent = totalStock.toLocaleString("es-DO");
  document.querySelectorAll(".preview-kpis strong")[3].textContent = lowStock;
  document.querySelector(".insight-row .risk strong").textContent = `${lowStock} SKU`;
  const insightCards = document.querySelectorAll(".insight-row article strong");
  if (insightCards[1]) insightCards[1].textContent = movementCounts.Entrada || 0;
  document.querySelector("#dashboardProductsMetric").textContent = state.productos.length;
  document.querySelector("#dashboardEntriesMetric").textContent = movementCounts.Entrada || 0;
  document.querySelector("#dashboardOutputsMetric").textContent = movementCounts.Salida || 0;
  document.querySelector("#dashboardTransfersMetric").textContent = movementCounts.Transferencia || 0;
  document.querySelector("#dashboardAlertsMetric").textContent = lowStock;
  document.querySelector("#dashboardBestSellerMetric").textContent = bestSellerSku;
  document.querySelector("#dashboardActiveSuppliersMetric").textContent = state.proveedores.filter((item) => item.estado === "Activo").length;
  document.querySelector("#dashboardSyncMetric").textContent = now.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
}


function filteredClients() {
  const filter = state.filters.clientes;
  return state.clientes.filter((item) => {
    const haystack = normalize(`${item.nombre} ${item.documento} ${item.correo} ${item.telefono}`);
    return (!filter.search || haystack.includes(normalize(filter.search))) && (filter.estado === "Todos" || item.estado === filter.estado);
  });
}

function filteredLoans() {
  const filter = state.filters.prestamos;
  return state.prestamos.filter((item) => {
    const haystack = normalize(`${item.cliente} ${item.estado} ${item.id}`);
    return (!filter.search || haystack.includes(normalize(filter.search))) && (filter.estado === "Todos" || item.estado === filter.estado);
  });
}

function filteredPayments() {
  const filter = state.filters.pagos;
  return state.pagos.filter((item) => {
    const haystack = normalize(`${item.cliente} ${item.metodo} ${item.referencia} ${item.estado}`);
    return (!filter.search || haystack.includes(normalize(filter.search))) && (filter.estado === "Todos" || item.estado === filter.estado);
  });
}

function renderClientOptions() {
  if (loanForm) {
    loanForm.elements.clienteId.innerHTML = state.clientes.map((item) => `<option value="${item.id}">${item.nombre} - ${item.documento}</option>`).join("");
  }
  if (paymentForm) {
    paymentForm.elements.prestamoId.innerHTML = state.prestamos.map((item) => `<option value="${item.id}">${item.id} - ${item.cliente} / ${money(item.balancePendiente)}</option>`).join("");
  }
}

function renderClients() {
  if (!clientTable) return;
  const rows = filteredClients();
  const clientsWithLoans = new Set(state.prestamos.map((item) => item.clienteId));
  document.querySelector("#clientTotalKpi").textContent = state.clientes.length;
  document.querySelector("#clientActiveKpi").textContent = state.clientes.filter((item) => item.estado === "Activo").length;
  document.querySelector("#clientLoanKpi").textContent = clientsWithLoans.size;
  document.querySelector("#clientInactiveKpi").textContent = state.clientes.filter((item) => item.estado === "Inactivo").length;
  clientTable.innerHTML = rows.map((client) => `
    <tr><td>${client.nombre}</td><td>${client.documento}</td><td>${client.telefono || "-"}</td><td>${client.correo || "-"}</td><td>${client.direccion || "-"}</td><td><span class="tag ${tagClass(client.estado)}">${client.estado || "Activo"}</span></td><td class="table-actions"><button type="button" data-action="edit-client" data-id="${client.id}">Editar</button><button type="button" data-action="delete-client" data-id="${client.id}">Eliminar</button></td></tr>`).join("");
  renderClientOptions();
}

function renderLoans() {
  if (!loanTable) return;
  const rows = filteredLoans();
  const totalAmount = state.prestamos.reduce((sum, item) => sum + Number(item.monto || 0), 0);
  const totalBalance = state.prestamos.reduce((sum, item) => sum + Number(item.balancePendiente || 0), 0);
  document.querySelector("#loanTotalKpi").textContent = state.prestamos.length;
  document.querySelector("#loanActiveKpi").textContent = state.prestamos.filter((item) => item.estado === "Activo").length;
  document.querySelector("#loanAmountKpi").textContent = money(totalAmount);
  document.querySelector("#loanBalanceKpi").textContent = money(totalBalance);
  loanTable.innerHTML = rows.map((loan) => `
    <tr><td>${loan.cliente}</td><td>${money(loan.monto)}</td><td>${Number(loan.tasa || 0)}%</td><td>${loan.plazoMeses} meses</td><td>${money(loan.balancePendiente)}</td><td><span class="tag ${tagClass(loan.estado)}">${loan.estado}</span></td><td>${loan.fecha || "-"}</td><td class="table-actions"><button type="button" data-action="edit-loan" data-id="${loan.id}">Editar</button><button type="button" data-action="delete-loan" data-id="${loan.id}">Eliminar</button></td></tr>`).join("");
  renderClientOptions();
}

function renderPayments() {
  if (!paymentTable) return;
  const rows = filteredPayments();
  const totalPaid = state.pagos.filter((item) => item.estado === "Aplicado").reduce((sum, item) => sum + Number(item.monto || 0), 0);
  document.querySelector("#paymentTotalKpi").textContent = state.pagos.length;
  document.querySelector("#paymentAppliedKpi").textContent = state.pagos.filter((item) => item.estado === "Aplicado").length;
  document.querySelector("#paymentAmountKpi").textContent = money(totalPaid);
  document.querySelector("#paymentPendingKpi").textContent = state.pagos.filter((item) => item.estado === "Pendiente").length;
  paymentTable.innerHTML = rows.map((payment) => `
    <tr><td>${payment.cliente}</td><td>${payment.prestamoId}</td><td>${money(payment.monto)}</td><td>${payment.metodo}</td><td>${payment.referencia || "-"}</td><td>${payment.fecha || "-"}</td><td><span class="tag ${tagClass(payment.estado)}">${payment.estado}</span></td><td class="table-actions"><button type="button" data-action="edit-payment" data-id="${payment.id}">Editar</button><button type="button" data-action="delete-payment" data-id="${payment.id}">Eliminar</button></td></tr>`).join("");
}

function alertItems() {
  return state.inventarios.filter((item) => Number(item.stockNeto || 0) <= Number(item.umbralAlerta || 0));
}

function filteredAlerts() {
  const filter = state.filters.alertas;
  return alertItems().filter((item) => {
    const severity = Number(item.stockNeto || 0) <= 0 ? "Sin Stock" : "Bajo Umbral";
    const haystack = normalize(`${item.sku} ${item.producto} ${item.sucursal}`);
    const matchesSearch = !filter.search || haystack.includes(normalize(filter.search));
    const matchesBranch = filter.sucursal === "Todas" || item.sucursal === filter.sucursal;
    const matchesSeverity = filter.severidad === "Todas" || severity === filter.severidad;
    return matchesSearch && matchesBranch && matchesSeverity;
  });
}

function renderAlerts() {
  if (!alertTable) return;
  const all = alertItems();
  const rows = filteredAlerts();
  const outOfStock = all.filter((item) => Number(item.stockNeto || 0) <= 0);
  const riskValue = all.reduce((sum, item) => sum + Number(item.stockNeto || 0) * Number(item.precioUnitario || 0), 0);
  document.querySelector("#alertTotalKpi").textContent = all.length;
  document.querySelector("#alertOutOfStockKpi").textContent = outOfStock.length;
  document.querySelector("#alertLowStockKpi").textContent = all.length - outOfStock.length;
  document.querySelector("#alertValueKpi").textContent = money(riskValue);
  const branchFilter = document.querySelector("#alertBranchFilter");
  if (branchFilter) {
    const current = branchFilter.value;
    const branches = Array.from(new Set(state.inventarios.map((item) => item.sucursal).filter(Boolean)));
    branchFilter.innerHTML = `<option>Todas</option>${branches.map((name) => `<option>${name}</option>`).join("")}`;
    branchFilter.value = branches.includes(current) ? current : "Todas";
  }
  alertTable.innerHTML = rows.map((item) => {
    const severity = Number(item.stockNeto || 0) <= 0 ? "Sin Stock" : "Bajo Umbral";
    const riskItemValue = Number(item.stockNeto || 0) * Number(item.precioUnitario || 0);
    return `
      <tr>
        <td><span class="row-icon sku-icon"></span>${item.sku}</td>
        <td>${item.producto}</td>
        <td><span class="row-icon branch-icon"></span>${item.sucursal}</td>
        <td><strong>${Number(item.stockNeto || 0).toLocaleString("es-DO")}</strong></td>
        <td>${Number(item.umbralAlerta || 0).toLocaleString("es-DO")}</td>
        <td><span class="tag ${severity === "Sin Stock" ? "empty" : "low"}">${severity}</span></td>
        <td>${money(riskItemValue)}</td>
        <td class="table-actions"><button type="button" data-action="restock-alert" data-id="${item.id}">Reabastecer</button></td>
      </tr>`;
  }).join("");
}

async function restockAlert(id) {
  const item = state.inventarios.find((inv) => inv.id === id);
  if (!item) return;
  const target = Math.max(Number(item.umbralAlerta || 0) * 2, Number(item.umbralAlerta || 0) + 10);
  const cantidad = Math.max(target - Number(item.stockNeto || 0), 1);
  try {
    await apiRequest("/inventarios/movimientos", { method: "POST", body: JSON.stringify({ inventarioId: item.id, tipo: "Entrada", cantidad, nota: "Reabastecimiento desde Alertas" }) });
    await loadData();
    setStatus("Reabastecimiento registrado correctamente.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function branchList() {
  const meta = state.sucursalesMeta;
  const fromInventory = new Set(state.inventarios.map((item) => item.sucursal).filter(Boolean));
  const names = new Set([...fromInventory, ...Object.keys(meta)]);
  return Array.from(names).map((nombre) => {
    const items = state.inventarios.filter((item) => item.sucursal === nombre);
    const productos = new Set(items.map((item) => item.sku)).size;
    const stockTotal = items.reduce((sum, item) => sum + Number(item.stockNeto || 0), 0);
    const valorInventario = items.reduce((sum, item) => sum + Number(item.stockNeto || 0) * Number(item.precioUnitario || 0), 0);
    const alertas = items.filter((item) => Number(item.stockNeto || 0) <= Number(item.umbralAlerta || 0)).length;
    const info = meta[nombre] || {};
    return {
      nombre,
      productos,
      stockTotal,
      valorInventario,
      alertas,
      hasInventory: items.length > 0,
      direccion: info.direccion || "",
      encargado: info.encargado || "",
      telefono: info.telefono || "",
      estado: info.estado || "Activa",
    };
  });
}

function filteredBranches() {
  const filter = state.filters.sucursales;
  return branchList().filter((item) => {
    const haystack = normalize(`${item.nombre} ${item.encargado} ${item.direccion}`);
    const matchesSearch = !filter.search || haystack.includes(normalize(filter.search));
    const matchesStatus = filter.estado === "Todos" || item.estado === filter.estado;
    return matchesSearch && matchesStatus;
  });
}

function renderBranches() {
  if (!branchTable) return;
  const all = branchList();
  const rows = filteredBranches();
  const topBranch = all.slice().sort((a, b) => b.stockTotal - a.stockTotal)[0];
  const withAlerts = all.filter((item) => item.alertas > 0).length;
  const totalValue = all.reduce((sum, item) => sum + item.valorInventario, 0);
  document.querySelector("#branchTotalKpi").textContent = all.length;
  document.querySelector("#branchTopStockKpi").textContent = topBranch ? topBranch.nombre : "--";
  document.querySelector("#branchAlertKpi").textContent = withAlerts;
  document.querySelector("#branchValueKpi").textContent = money(totalValue);
  branchTable.innerHTML = rows.map((branch) => `
    <tr>
      <td><span class="row-icon branch-icon"></span>${branch.nombre}</td>
      <td>${branch.encargado || "-"}</td>
      <td>${branch.telefono || "-"}</td>
      <td>${branch.productos}</td>
      <td><strong>${branch.stockTotal.toLocaleString("es-DO")}</strong></td>
      <td>${money(branch.valorInventario)}</td>
      <td><span class="tag ${branch.alertas ? "low" : "ok"}">${branch.alertas}</span></td>
      <td><span class="tag ${tagClass(branch.estado)}">${branch.estado}</span></td>
      <td class="table-actions">
        <button type="button" data-action="edit-branch" data-id="${branch.nombre}">Editar</button>
        <button type="button" data-action="delete-branch" data-id="${branch.nombre}"${branch.hasInventory ? " disabled title=\"Tiene inventario asociado\"" : ""}>Eliminar</button>
      </td>
    </tr>`).join("");
}

function saveBranch(form) {
  const data = getFormData(form);
  if (!data.nombre) {
    setStatus("El nombre de la sucursal es obligatorio.", "error");
    return;
  }
  const meta = state.sucursalesMeta;
  const editingName = state.editing.sucursales;
  if (editingName && editingName !== data.nombre) delete meta[editingName];
  meta[data.nombre] = { direccion: data.direccion, encargado: data.encargado, telefono: data.telefono, estado: data.estado || "Activa" };
  saveBranchMeta(meta);
  clearForm(form, "sucursales");
  renderAll();
  setStatus(editingName ? "Sucursal actualizada correctamente." : "Sucursal creada correctamente.", "ok");
}

function editBranch(nombre) {
  const branch = branchList().find((item) => item.nombre === nombre);
  if (!branch || !branchForm) return;
  branchForm.elements.nombre.value = branch.nombre;
  branchForm.elements.direccion.value = branch.direccion || "";
  branchForm.elements.encargado.value = branch.encargado || "";
  branchForm.elements.telefono.value = branch.telefono || "";
  branchForm.elements.estado.value = branch.estado || "Activa";
  state.editing.sucursales = nombre;
  branchForm.querySelector("button[type='submit']").textContent = "Actualizar";
  branchForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteBranch(nombre) {
  const branch = branchList().find((item) => item.nombre === nombre);
  if (branch?.hasInventory) {
    setStatus("No puedes eliminar una sucursal con inventario asociado.", "error");
    return;
  }
  if (!window.confirm("Confirma que deseas eliminar esta sucursal.")) return;
  const meta = state.sucursalesMeta;
  delete meta[nombre];
  saveBranchMeta(meta);
  renderAll();
  setStatus("Sucursal eliminada correctamente.", "ok");
}

function renderAll() {
  renderSuppliers();
  renderProducts();
  renderInventory();
  renderMovements();
  renderDashboard();
  renderClients();
  renderLoans();
  renderPayments();
  renderAlerts();
  renderBranches();
}

async function loadData() {
  try {
    const [health, proveedores, productos, inventarios, movimientos, clientes, prestamos, pagos] = await Promise.all([
      apiRequest("/health"), apiRequest("/proveedores"), apiRequest("/productos"), apiRequest("/inventarios"), apiRequest("/movimientos"), apiRequest("/clientes"), apiRequest("/prestamos"), apiRequest("/pagos"),
    ]);
    state.proveedores = proveedores;
    state.productos = productos;
    state.inventarios = inventarios;
    state.movimientos = movimientos;
    state.clientes = clientes;
    state.prestamos = prestamos;
    state.pagos = pagos;
    renderAll();
    setStatus(health.mode === "demo" ? "Modo demostración activo con datos simulados." : "Datos sincronizados con SQL Server.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function saveRecord(collectionName, form) {
  const data = getFormData(form);
  const errors = validateForm(collectionName, data);
  if (errors.length) {
    setStatus(errors.join(". "), "error");
    return;
  }
  await withButtonLock(form, async () => {
    const id = state.editing[collectionName];
    const method = id ? "PUT" : "POST";
    const path = id ? `/${collectionName}/${id}` : `/${collectionName}`;
    await apiRequest(path, { method, body: JSON.stringify(data) });
    clearForm(form, collectionName);
    await loadData();
    setStatus(id ? "Registro actualizado correctamente." : "Registro creado correctamente.", "ok");
  }).catch((error) => setStatus(error.message, "error"));
}

async function saveMovement(form) {
  const data = getFormData(form);
  const errors = validateForm("movimientos", data);
  if (errors.length) {
    setStatus(errors.join(". "), "error");
    return;
  }
  await withButtonLock(form, async () => {
    await apiRequest("/inventarios/movimientos", { method: "POST", body: JSON.stringify(data) });
    clearForm(form);
    await loadData();
    setStatus("Movimiento registrado correctamente.", "ok");
  }).catch((error) => setStatus(error.message, "error"));
}

async function deleteRecord(collectionName, id) {
  const messages = {
    productos: "Este producto puede tener inventario relacionado. Confirma que deseas eliminarlo.",
    inventarios: "Este inventario puede tener movimientos relacionados. Confirma que deseas eliminarlo.",
    proveedores: "Confirma que deseas eliminar este proveedor.",
    clientes: "Este cliente puede tener prestamos relacionados. Confirma que deseas eliminarlo.",
    prestamos: "Este prestamo puede tener pagos relacionados. Confirma que deseas eliminarlo.",
    pagos: "Confirma que deseas eliminar este pago.",
  };
  if (!window.confirm(messages[collectionName] || "Confirma la eliminacion.")) return;
  try {
    await apiRequest(`/${collectionName}/${id}`, { method: "DELETE" });
    await loadData();
    setStatus("Registro eliminado correctamente.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function exportRows(collectionName) {
  const datasets = {
    productos: filteredProducts(),
    inventarios: filteredInventory(),
    proveedores: filteredSuppliers(),
    movimientos: state.movimientos,
    clientes: filteredClients(),
    prestamos: filteredLoans(),
    pagos: filteredPayments(),
    alertas: filteredAlerts(),
    sucursales: filteredBranches(),
  };
  const rows = datasets[collectionName] || [];
  if (!rows.length) {
    setStatus("No hay datos para exportar.", "error");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${collectionName}-predicex.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus(`Exportacion de ${collectionName} generada para Excel.`, "ok");
}

function inferExportCollection(button) {
  if (button.closest("#inventoryView")) return "inventarios";
  if (button.closest("#productsView")) return "productos";
  if (button.closest("#suppliersView")) return "proveedores";
  return button.dataset.export || "movimientos";
}

function wireFilters() {
  document.querySelectorAll("[data-search]").forEach((input) => {
    input.addEventListener("input", () => {
      state.filters[input.dataset.search].search = input.value;
      renderAll();
    });
  });
  document.querySelector("#inventoryView .inventory-tools label:nth-of-type(2) select")?.addEventListener("change", (event) => {
    state.filters.inventarios.sucursal = event.target.value;
    renderAll();
  });
  document.querySelector("#inventoryView .inventory-tools label:nth-of-type(3) select")?.addEventListener("change", (event) => {
    state.filters.inventarios.estado = event.target.value;
    renderAll();
  });
  document.querySelector("#suppliersView .supplier-tools label:nth-of-type(2) select")?.addEventListener("change", (event) => {
    state.filters.proveedores.estado = event.target.value;
    renderAll();
  });
  document.querySelector("#productsView .product-tools label:nth-of-type(2) select")?.addEventListener("change", (event) => {
    state.filters.productos.categoria = event.target.value;
    renderAll();
  });
  document.querySelector("#productsView .product-tools label:nth-of-type(3) select")?.addEventListener("change", (event) => {
    state.filters.productos.estado = event.target.value;
    renderAll();
  });
  document.querySelectorAll("[data-filter]").forEach((select) => {
    select.addEventListener("change", () => {
      const [collection, field] = select.dataset.filter.split(".");
      state.filters[collection][field] = select.value;
      renderAll();
    });
  });
}

function renderCurrentDateTime() {
  const now = new Date();
  if (currentDateTime) {
    currentDateTime.textContent = now.toLocaleString("es-DO", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  if (inventoryDate) inventoryDate.textContent = now.toLocaleDateString("es-DO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  if (inventoryTime) inventoryTime.textContent = now.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function showApp() {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  loadData();
}

function showLogin() {
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
}

function switchView(viewId) {
  views.forEach((view) => view.classList.toggle("active-view", view.id === viewId));
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  viewTitle.textContent = titles[viewId];
}

loginForm.addEventListener("submit", (event) => { event.preventDefault(); showApp(); });
logoutButton.addEventListener("click", showLogin);
navItems.forEach((item) => item.addEventListener("click", () => switchView(item.dataset.view)));
supplierForm.addEventListener("submit", (event) => { event.preventDefault(); saveRecord("proveedores", supplierForm); });
productForm.addEventListener("submit", (event) => { event.preventDefault(); saveRecord("productos", productForm); });
inventoryForm.addEventListener("submit", (event) => { event.preventDefault(); saveRecord("inventarios", inventoryForm); });
movementForm?.addEventListener("submit", (event) => { event.preventDefault(); saveMovement(movementForm); });
clientForm?.addEventListener("submit", (event) => { event.preventDefault(); saveRecord("clientes", clientForm); });
loanForm?.addEventListener("submit", (event) => { event.preventDefault(); saveRecord("prestamos", loanForm); });
paymentForm?.addEventListener("submit", (event) => { event.preventDefault(); saveRecord("pagos", paymentForm); });
branchForm?.addEventListener("submit", (event) => { event.preventDefault(); saveBranch(branchForm); });

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  const { action, id } = target.dataset;
  if (target.classList.contains("export-button")) exportRows(inferExportCollection(target));
  if (!action || !id) return;
  if (action === "edit-supplier") fillForm(supplierForm, state.proveedores.find((item) => item.id === id), "proveedores");
  if (action === "edit-product") fillForm(productForm, state.productos.find((item) => item.id === id), "productos");
  if (action === "edit-inventory") fillForm(inventoryForm, state.inventarios.find((item) => item.id === id), "inventarios");
  if (action === "delete-supplier") await deleteRecord("proveedores", id);
  if (action === "delete-product") await deleteRecord("productos", id);
  if (action === "delete-inventory") await deleteRecord("inventarios", id);
  if (action === "edit-client") fillForm(clientForm, state.clientes.find((item) => item.id === id), "clientes");
  if (action === "edit-loan") fillForm(loanForm, state.prestamos.find((item) => item.id === id), "prestamos");
  if (action === "edit-payment") fillForm(paymentForm, state.pagos.find((item) => item.id === id), "pagos");
  if (action === "delete-client") await deleteRecord("clientes", id);
  if (action === "delete-loan") await deleteRecord("prestamos", id);
  if (action === "delete-payment") await deleteRecord("pagos", id);
  if (action === "restock-alert") await restockAlert(id);
  if (action === "edit-branch") editBranch(id);
  if (action === "delete-branch") deleteBranch(id);
});

addStockButton.addEventListener("click", async () => {
  const firstAlert = state.inventarios.find((item) => Number(item.stockNeto) <= Number(item.umbralAlerta));
  if (!firstAlert) {
    setStatus("No hay inventario bajo umbral para simular entrada.", "ok");
    return;
  }
  await apiRequest("/inventarios/movimientos", { method: "POST", body: JSON.stringify({ inventarioId: firstAlert.id, tipo: "Entrada", cantidad: 24, nota: "Entrada simulada desde dashboard" }) });
  await loadData();
});

wireFilters();
renderCurrentDateTime();
setInterval(renderCurrentDateTime, 1000);







