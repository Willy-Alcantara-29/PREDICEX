const API_URL = window.location.origin.startsWith("http")
  ? window.location.origin
  : "http://localhost:3000";

const state = {
  proveedores: [],
  productos: [],
  inventarios: [],
  movimientos: [],
  clientes: [],
  prestamos: [],
  pagos: [],
  sucursales: [],
  filters: {
    proveedores: { search: "", estado: "Todos", rnc: "Todos" },
    productos: { search: "", categoria: "Todas", estado: "Todos" },
    inventarios: { search: "", sucursal: "Todas", estado: "Todos" },
    clientes: { search: "", estado: "Todos" },
    prestamos: { search: "", estado: "Todos" },
    pagos: { search: "", estado: "Todos" },
    sucursales: { search: "" },
  },
  editing: { proveedores: null, productos: null, inventarios: null, clientes: null, prestamos: null, pagos: null, sucursales: null },
};


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
        <div class="panel-heading products-heading"><div><p class="eyebrow">Cartera comercial</p><h3>Gestion de clientes</h3><span>Registro, busqueda y seguimiento de clientes</span></div></div>
        <div class="product-kpis"><article><span class="product-kpi-icon total"></span><div><strong id="clientTotalKpi">0</strong><span>Total clientes</span></div></article><article><span class="product-kpi-icon best"></span><div><strong id="clientActiveKpi">0</strong><span>Clientes activos</span></div></article><article><span class="product-kpi-icon category"></span><div><strong id="clientLoanKpi">0</strong><span>Con prestamos</span></div></article><article><span class="product-kpi-icon low"></span><div><strong id="clientInactiveKpi">0</strong><span>Inactivos</span></div></article></div>
        <div class="form-helper-note">Aqui puedes crear un cliente nuevo o editar su informacion comercial.</div><form id="clientForm" class="crud-form"><label>Nombre<span class="field-shell supplier-company-field"><input name="nombre" placeholder="Nombre completo" required /></span></label><label>Documento<span class="field-shell supplier-doc-field"><input name="documento" placeholder="001-0000000-0" required /></span></label><label>Telefono<span class="field-shell supplier-phone-field"><input name="telefono" placeholder="809-555-0000" /></span></label><label>Correo<span class="field-shell supplier-email-field"><input name="correo" type="email" placeholder="cliente@correo.com" /></span></label><label>Direccion<span class="field-shell branch-field"><input name="direccion" placeholder="Direccion" /></span></label><label>Estado<span class="field-shell supplier-status-field"><input name="estado" placeholder="Activo" /></span></label><button type="submit" class="small-button" data-default-text="Guardar cliente">Guardar cliente</button></form>
        <div class="product-tools module-tools"><label class="search-control"><span>Buscar cliente</span><input data-search="clientes" type="search" placeholder="Buscar por nombre, documento o correo" /></label><label><span>Estado</span><select data-filter="clientes.estado"><option>Todos</option><option>Activo</option><option>Inactivo</option></select></label><button type="button" class="export-button" data-export="clientes">Exportar Excel</button></div>
        <div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Documento</th><th>Telefono</th><th>Correo</th><th>Direccion</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="clientTable"></tbody></table></div>
      </article>
    </section>
    <section id="loansView" class="view">
      <article class="panel products-panel">
        <div class="panel-heading products-heading"><div><p class="eyebrow">Cartera financiera</p><h3>Gestion de prestamos</h3><span>Prestamos, balances y estados</span></div></div>
        <div class="product-kpis"><article><span class="product-kpi-icon total"></span><div><strong id="loanTotalKpi">0</strong><span>Total prestamos</span></div></article><article><span class="product-kpi-icon best"></span><div><strong id="loanActiveKpi">0</strong><span>Activos</span></div></article><article><span class="product-kpi-icon category"></span><div><strong id="loanAmountKpi">RD$ 0</strong><span>Monto colocado</span></div></article><article><span class="product-kpi-icon low"></span><div><strong id="loanBalanceKpi">RD$ 0</strong><span>Balance pendiente</span></div></article></div>
        <form id="loanForm" class="crud-form"><label>Cliente<select name="clienteId" required></select></label><label>Monto<span class="field-shell stock-field"><input name="monto" type="number" min="0" step="0.01" placeholder="50000" required /></span></label><label>Tasa %<span class="field-shell stock-field"><input name="tasa" type="number" min="0" step="0.01" placeholder="12" required /></span></label><label>Plazo meses<span class="field-shell alert-field"><input name="plazoMeses" type="number" min="1" placeholder="12" required /></span></label><label>Balance<span class="field-shell stock-field"><input name="balancePendiente" type="number" min="0" step="0.01" placeholder="50000" /></span></label><label>Fecha<span class="field-shell product-description-field"><input name="fecha" type="date" /></span></label><label>Estado<span class="field-shell supplier-status-field"><input name="estado" placeholder="Activo" /></span></label><button type="submit" class="small-button" data-default-text="Guardar prestamo">Guardar prestamo</button></form>
        <div class="product-tools module-tools"><label class="search-control"><span>Buscar prestamo</span><input data-search="prestamos" type="search" placeholder="Buscar por cliente o estado" /></label><label><span>Estado</span><select data-filter="prestamos.estado"><option>Todos</option><option>Activo</option><option>Cerrado</option><option>En mora</option></select></label><button type="button" class="export-button" data-export="prestamos">Exportar Excel</button></div>
        <div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Monto</th><th>Tasa</th><th>Plazo</th><th>Balance</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody id="loanTable"></tbody></table></div>
      </article>
    </section>
    <section id="paymentsView" class="view">
      <article class="panel products-panel">
        <div class="panel-heading products-heading"><div><p class="eyebrow">Recaudos</p><h3>Gestion de pagos</h3><span>Registro y control de pagos</span></div></div>
        <div class="product-kpis"><article><span class="product-kpi-icon total"></span><div><strong id="paymentTotalKpi">0</strong><span>Total pagos</span></div></article><article><span class="product-kpi-icon best"></span><div><strong id="paymentAppliedKpi">0</strong><span>Aplicados</span></div></article><article><span class="product-kpi-icon category"></span><div><strong id="paymentAmountKpi">RD$ 0</strong><span>Monto pagado</span></div></article><article><span class="product-kpi-icon low"></span><div><strong id="paymentPendingKpi">0</strong><span>Pendientes</span></div></article></div>
        <form id="paymentForm" class="crud-form"><label>Prestamo<select name="prestamoId" required></select></label><label>Monto<span class="field-shell stock-field"><input name="monto" type="number" min="0" step="0.01" placeholder="5000" required /></span></label><label>Metodo<span class="field-shell supplier-status-field"><input name="metodo" placeholder="Efectivo" required /></span></label><label>Referencia<span class="field-shell product-description-field"><input name="referencia" placeholder="REC-001" /></span></label><label>Fecha<span class="field-shell product-description-field"><input name="fecha" type="date" /></span></label><label>Estado<span class="field-shell supplier-status-field"><input name="estado" placeholder="Aplicado" /></span></label><button type="submit" class="small-button" data-default-text="Guardar pago">Guardar pago</button></form>
        <div class="product-tools module-tools"><label class="search-control"><span>Buscar pago</span><input data-search="pagos" type="search" placeholder="Buscar por cliente, metodo o referencia" /></label><label><span>Estado</span><select data-filter="pagos.estado"><option>Todos</option><option>Aplicado</option><option>Pendiente</option><option>Anulado</option></select></label><button type="button" class="export-button" data-export="pagos">Exportar Excel</button></div>
        <div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Prestamo</th><th>Monto</th><th>Metodo</th><th>Referencia</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="paymentTable"></tbody></table></div>
      </article>
    </section>
  `);
}

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
  purchaseOrdersView: "Ordenes de compra",
  branchesView: "Sucursales",
};


const collectionLabels = {
  proveedores: "proveedor",
  productos: "producto",
  inventarios: "inventario",
  clientes: "cliente",
  prestamos: "prestamo",
  pagos: "pago",
  sucursales: "sucursal",
};

function friendlyErrorMessage(error, collectionName) {
  const message = error?.message || "No se pudo completar la operacion";
  if (collectionName === "productos" && /duplicado|existe|sku/i.test(message)) {
    return "Ese SKU ya esta registrado. Usa otro SKU o edita el producto existente.";
  }
  if (/Registro duplicado/i.test(message)) {
    const label = collectionLabels[collectionName] || "registro";
    return `Ya existe un ${label} con esos datos. Revisa la informacion e intenta de nuevo.`;
  }
  return message;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function confirmAction({ title, message, confirmText = "Confirmar", cancelText = "Cancelar", danger = false }) {
  return new Promise((resolve) => {
    const existing = document.querySelector(".confirm-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    overlay.innerHTML = `
      <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
        <div class="confirm-icon ${danger ? "danger" : "info"}" aria-hidden="true"></div>
        <div class="confirm-content">
          <h3 id="confirmTitle">${escapeHtml(title)}</h3>
          <p>${escapeHtml(message)}</p>
        </div>
        <div class="confirm-actions">
          <button type="button" class="confirm-cancel">${escapeHtml(cancelText)}</button>
          <button type="button" class="confirm-submit ${danger ? "danger" : ""}">${escapeHtml(confirmText)}</button>
        </div>
      </section>`;

    const close = (value) => {
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
      resolve(value);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") close(false);
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest(".confirm-cancel")) close(false);
      if (event.target.closest(".confirm-submit")) close(true);
    });
    document.addEventListener("keydown", onKeyDown);
    document.body.appendChild(overlay);
    overlay.querySelector(".confirm-cancel")?.focus();
  });
}
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
  if (collectionName === "sucursales") {
    if (!data.nombre) errors.push("Nombre de sucursal obligatorio");
  }
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
    const stock = Number(item.stockNeto || 0);
    const unitPrice = Number(item.precioUnitario || 0);
    return `
      <tr>
        <td><span class="row-icon sku-icon"></span>${item.sku}</td>
        <td><span class="row-icon product-icon"></span>${item.producto}</td>
        <td><span class="row-icon branch-icon"></span>${item.sucursal}</td>
        <td><strong>${stock.toLocaleString("es-DO")}</strong></td>
        <td>${money(unitPrice)}</td>
        <td>${money(stock * unitPrice)}</td>
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
        <button type="button" data-action="toggle-supplier-status" data-next-status="${(supplier.estado || "Activo") === "Activo" ? "Inactivo" : "Activo"}" data-id="${supplier.id}">${(supplier.estado || "Activo") === "Activo" ? "Desactivar" : "Activar"}</button>
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
  productTable.innerHTML = rows.map((product) => {
    const stock = state.inventarios.reduce((sum, item) => item.productoId === product.id || item.sku === product.sku ? sum + Number(item.stockNeto || 0) : sum, 0);
    const unitPrice = Number(product.precio || 0);
    return `
    <tr>
      <td><span class="row-icon product-sku-icon"></span>${product.sku}</td>
      <td><span class="row-icon product-row-icon"></span>${product.descripcion}</td>
      <td>${product.codigoBarra || "-"}</td>
      <td><span class="tag product-category-tag">${product.categoria || "Sin categoria"}</span></td>
      <td>${money(unitPrice)}</td>
      <td>${money(stock * unitPrice)}</td>
      <td><span class="tag ${tagClass(product.estado || "Activo")}">${product.estado || "Activo"}</span></td>
      <td class="table-actions">
        <button type="button" data-action="edit-product" data-id="${product.id}">Editar</button>
        <button type="button" data-action="toggle-product-status" data-next-status="${(product.estado || "Activo") === "Activo" ? "Inactivo" : "Activo"}" data-id="${product.id}">${(product.estado || "Activo") === "Activo" ? "Desactivar" : "Activar"}</button>
        <button type="button" data-action="delete-product" data-id="${product.id}">Eliminar</button>
      </td>
    </tr>`;
  }).join("");
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
    <tr><td>${client.nombre}</td><td>${client.documento}</td><td>${client.telefono || "-"}</td><td>${client.correo || "-"}</td><td>${client.direccion || "-"}</td><td><span class="tag ${tagClass(client.estado)}">${client.estado || "Activo"}</span></td><td class="table-actions"><button type="button" data-action="edit-client" data-id="${client.id}">Editar</button><button type="button" data-action="toggle-client-status" data-next-status="${(client.estado || "Activo") === "Activo" ? "Inactivo" : "Activo"}" data-id="${client.id}">${(client.estado || "Activo") === "Activo" ? "Desactivar" : "Activar"}</button><button type="button" data-action="delete-client" data-id="${client.id}">Eliminar</button></td></tr>`).join("");
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
    <tr><td>${loan.cliente}</td><td>${money(loan.monto)}</td><td>${Number(loan.tasa || 0)}%</td><td>${loan.plazoMeses} meses</td><td>${money(loan.balancePendiente)}</td><td><span class="tag ${tagClass(loan.estado)}">${loan.estado}</span></td><td>${loan.fecha || "-"}</td><td class="table-actions"><button type="button" data-action="edit-loan" data-id="${loan.id}">Editar</button><button type="button" data-action="toggle-loan-status" data-next-status="${loan.estado === "Activo" ? "Anulado" : "Activo"}" data-id="${loan.id}">${loan.estado === "Activo" ? "Anular" : "Activar"}</button><button type="button" data-action="delete-loan" data-id="${loan.id}">Eliminar</button></td></tr>`).join("");
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
function renderAll() {
  renderSuppliers();
  renderProducts();
  renderInventory();
  renderMovements();
  renderDashboard();
  renderClients();
  renderLoans();
  renderPayments();
  renderOperationsModules();
  renderPurchaseOrdersView();
  renderBranchesView();
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
    state.sucursales = sucursales;
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

async function toggleSupplierStatus(id) {
  const supplier = state.proveedores.find((item) => item.id === id);
  if (!supplier) return setStatus("Proveedor no encontrado.", "error");
  const nextStatus = (supplier.estado || "Activo") === "Activo" ? "Inactivo" : "Activo";
  try {
    await apiRequest(`/proveedores/${id}`, { method: "PUT", body: JSON.stringify({ ...supplier, estado: nextStatus }) });
    await loadData();
    setStatus(`Proveedor ${nextStatus === "Activo" ? "activado" : "desactivado"} correctamente.`, "ok");
  } catch (error) {
    setStatus(typeof friendlyErrorMessage === "function" ? friendlyErrorMessage(error, "proveedores") : error.message, "error");
  }
}

async function toggleProductStatus(id) {
  const product = state.productos.find((item) => item.id === id);
  if (!product) return setStatus("Producto no encontrado.", "error");
  const nextStatus = (product.estado || "Activo") === "Activo" ? "Inactivo" : "Activo";
  try {
    await apiRequest(`/productos/${id}`, { method: "PUT", body: JSON.stringify({ ...product, estado: nextStatus }) });
    await loadData();
    setStatus(`Producto ${nextStatus === "Activo" ? "activado" : "desactivado"} correctamente.`, "ok");
  } catch (error) {
    setStatus(typeof friendlyErrorMessage === "function" ? friendlyErrorMessage(error, "productos") : error.message, "error");
  }
}

async function toggleLoanStatus(id) {
  const loan = state.prestamos.find((item) => item.id === id);
  if (!loan) return setStatus("Prestamo no encontrado.", "error");
  const nextStatus = loan.estado === "Activo" ? "Anulado" : "Activo";
  try {
    await apiRequest(`/prestamos/${id}`, { method: "PUT", body: JSON.stringify({ ...loan, estado: nextStatus }) });
    await loadData();
    setStatus(`Prestamo ${nextStatus === "Activo" ? "activado" : "anulado"} correctamente.`, "ok");
  } catch (error) {
    setStatus(typeof friendlyErrorMessage === "function" ? friendlyErrorMessage(error, "prestamos") : error.message, "error");
  }
}

async function toggleClientStatus(id) {
  const client = state.clientes.find((item) => item.id === id);
  if (!client) return setStatus("Cliente no encontrado.", "error");
  const nextStatus = (client.estado || "Activo") === "Activo" ? "Inactivo" : "Activo";
  try {
    await apiRequest(`/clientes/${id}`, { method: "PUT", body: JSON.stringify({ ...client, estado: nextStatus }) });
    await loadData();
    setStatus(`Cliente ${nextStatus === "Activo" ? "activado" : "desactivado"} correctamente.`, "ok");
  } catch (error) {
    setStatus(typeof friendlyErrorMessage === "function" ? friendlyErrorMessage(error, "clientes") : error.message, "error");
  }
}

async function deleteRecord(collectionName, id) {
  const record = state[collectionName]?.find((item) => item.id === id) || {};
  const name = record.razonSocial || record.descripcion || record.producto || record.nombre || record.referencia || record.id || id;
  const label = collectionLabels[collectionName] || "registro";
  const confirmed = await confirmAction({
    title: `Eliminar ${label}`,
    message: `Se aplicara la eliminacion de "${name}". Si tiene historial relacionado, quedara inactivo para conservar la auditoria.`,
    confirmText: "Eliminar",
    danger: true,
  });
  if (!confirmed) return;
  try {
    await apiRequest(`/${collectionName}/${id}`, { method: "DELETE" });
    await loadData();
    setStatus(`${label} eliminado correctamente.`, "ok");
  } catch (error) {
    setStatus(friendlyErrorMessage(error, collectionName), "error");
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

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  const { action, id } = target.dataset;
  if (target.classList.contains("export-button")) exportRows(inferExportCollection(target));
  if (!action || !id) return;
  if (action === "edit-supplier") fillForm(supplierForm, state.proveedores.find((item) => item.id === id), "proveedores");
  if (action === "toggle-supplier-status") await toggleSupplierStatus(id);
  if (action === "edit-product") fillForm(productForm, state.productos.find((item) => item.id === id), "productos");
  if (action === "toggle-product-status") await toggleProductStatus(id);
  if (action === "edit-inventory") fillForm(inventoryForm, state.inventarios.find((item) => item.id === id), "inventarios");
  if (action === "delete-supplier") await deleteRecord("proveedores", id);
  if (action === "delete-product") await deleteRecord("productos", id);
  if (action === "delete-inventory") await deleteRecord("inventarios", id);
  if (action === "edit-client") fillForm(clientForm, state.clientes.find((item) => item.id === id), "clientes");
  if (action === "toggle-client-status") await toggleClientStatus(id);
  if (action === "edit-loan") fillForm(loanForm, state.prestamos.find((item) => item.id === id), "prestamos");
  if (action === "toggle-loan-status") await toggleLoanStatus(id);
  if (action === "edit-payment") fillForm(paymentForm, state.pagos.find((item) => item.id === id), "pagos");
  if (action === "delete-client") await deleteRecord("clientes", id);
  if (action === "delete-loan") await deleteRecord("prestamos", id);
  if (action === "delete-payment") await deleteRecord("pagos", id);
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









function setLoginMessage(message, type = "info") {
  const loginMessage = document.querySelector("#loginMessage");
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.className = `login-message ${type}`;
}
// Produccion overrides: auth, metricas centralizadas, paginacion y formatos
state.metrics = null;
state.pagination = {
  proveedores: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
  productos: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
  inventarios: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
  movimientos: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
  clientes: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
  prestamos: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
  pagos: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
  sucursales: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
};
state.auth = { token: sessionStorage.getItem("predicexToken") || "", user: JSON.parse(sessionStorage.getItem("predicexUser") || "null") };

function formatMoney(value) {
  return Number(value || 0).toLocaleString("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
money = formatMoney;

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(String(value).includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("es-DO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("es-DO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
}

function normalizeUiStatus(value) {
  if (value === "Sin Stock" || value === "Bajo Umbral") return "Bajo stock";
  if (value === "FL") return "Inactivo";
  return value || "Activo";
}

tagClass = function(status) {
  const normalizedStatus = normalizeUiStatus(status);
  if (["Inactivo", "Anulado"].includes(normalizedStatus)) return "empty";
  if (["Bajo stock", "Pendiente"].includes(normalizedStatus)) return "low";
  if (["Disponible", "Activo", "Aplicado", "Cerrado"].includes(normalizedStatus)) return "ok";
  return "info";
};

apiRequest = async function(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.auth.token) headers.Authorization = `Bearer ${state.auth.token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    const details = Array.isArray(data.errors) ? `: ${data.errors.join(", ")}` : "";
    throw new Error(`${data.error || "No se pudo completar la operacion"}${details}`);
  }
  return data;
};

function queryFor(collectionName) {
  const page = state.pagination[collectionName] || { page: 1, pageSize: 10 };
  const filter = state.filters[collectionName] || {};
  const params = new URLSearchParams({ page: page.page, pageSize: page.pageSize });
  Object.entries(filter).forEach(([key, value]) => {
    if (value && value !== "Todos") params.set(key, value);
  });
  return params.toString();
}

async function loadPaged(collectionName) {
  const result = await apiRequest(`/${collectionName}?${queryFor(collectionName)}`);
  state.pagination[collectionName] = result.pagination;
  return result.items;
}

loadData = async function() {
  try {
    const [health, metrics, proveedores, productos, inventarios, movimientos, clientes, prestamos, pagos, sucursales] = await Promise.all([
      apiRequest("/health"), apiRequest("/metrics"), loadPaged("proveedores"), loadPaged("productos"), loadPaged("inventarios"), loadPaged("movimientos"), loadPaged("clientes"), loadPaged("prestamos"), loadPaged("pagos"), loadPaged("sucursales"),
    ]);
    if (health.mode === "demo") throw new Error("SQL Server no esta conectado. No se muestran datos simulados en modo produccion.");
    state.metrics = metrics;
    state.proveedores = proveedores;
    state.productos = productos;
    state.inventarios = inventarios;
    state.movimientos = movimientos;
    state.clientes = clientes;
    state.prestamos = prestamos;
    state.pagos = pagos;
    state.sucursales = sucursales;
    renderAll();
    renderPaginationAll();
    setStatus(`Datos sincronizados con SQL Server. Ultima sincronizacion: ${formatDateTime(metrics.syncedAt)}`, "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
};

renderDashboard = function() {
  const metrics = state.metrics;
  if (!metrics) return;
  document.querySelector("#totalStockMetric").textContent = metrics.inventarios.totalStock.toLocaleString("es-DO");
  document.querySelector("#lowStockMetric").textContent = metrics.inventarios.lowStock;
  document.querySelector("#supplierMetric").textContent = metrics.proveedores.active;
  document.querySelector("#productMetric").textContent = metrics.productos.active;
  document.querySelector("#executiveStockMetric").textContent = metrics.inventarios.totalStock.toLocaleString("es-DO");
  document.querySelector("#inventoryValueMetric").textContent = formatMoney(metrics.inventarios.inventoryValue);
  document.querySelector("#criticalProductsMetric").textContent = metrics.inventarios.lowStock;
  document.querySelector("#lastSyncMetric")?.closest("article")?.classList.add("hidden");
  document.querySelector("#inventoryTotalKpi").textContent = metrics.inventarios.totalStock.toLocaleString("es-DO");
  document.querySelector("#activeBranchesKpi").textContent = metrics.inventarios.activeBranches;
  document.querySelector("#lowInventoryKpi").textContent = metrics.inventarios.lowStock;
  document.querySelector("#todayMovementsKpi").textContent = metrics.movimientos.total;
  document.querySelector("#inventoryLastSync")?.closest("span")?.classList.add("hidden");
  document.querySelectorAll(".preview-kpis strong")[0].textContent = metrics.inventarios.totalStock.toLocaleString("es-DO");
  document.querySelectorAll(".preview-kpis strong")[3].textContent = metrics.inventarios.lowStock;
  document.querySelector(".insight-row .risk strong").textContent = `${metrics.inventarios.lowStock} SKU`;
  const insightCards = document.querySelectorAll(".insight-row article strong");
  if (insightCards[1]) insightCards[1].textContent = metrics.movimientos.entradas;
};

renderSuppliers = function() {
  const metrics = state.metrics?.proveedores || { total: 0, active: 0, email: 0, phone: 0 };
  document.querySelector("#supplierTotalKpi").textContent = metrics.total;
  document.querySelector("#supplierActiveKpi").textContent = metrics.active;
  document.querySelector("#supplierEmailKpi").textContent = metrics.email;
  document.querySelector("#supplierPhoneKpi").textContent = metrics.phone;
  supplierTable.innerHTML = state.proveedores.map((supplier) => {
    const nextAction = (supplier.estado || "Activo") === "Activo" ? "Desactivar" : "Activar";
    return `
    <tr><td>${supplier.razonSocial}</td><td>${supplier.rnc}</td><td>${supplier.telefono || "-"}</td><td>${supplier.correo || "-"}</td><td><span class="tag ${tagClass(supplier.estado)}">${normalizeUiStatus(supplier.estado)}</span></td><td>-</td><td class="table-actions"><button type="button" data-action="edit-supplier" data-id="${supplier.id}">Editar</button><button type="button" data-action="toggle-supplier-status" data-next-status="${nextAction === "Activar" ? "Activo" : "Inactivo"}" data-id="${supplier.id}">${nextAction}</button><button type="button" data-action="delete-supplier" data-id="${supplier.id}" data-record-name="${supplier.razonSocial}">Eliminar</button></td></tr>`;
  }).join("");
};

renderProducts = function() {
  const metrics = state.metrics?.productos || { total: 0, categories: 0, lowStockProducts: 0, bestSeller: null };
  document.querySelector("#productTotalKpi").textContent = metrics.total;
  document.querySelector("#categoryTotalKpi").textContent = metrics.categories;
  document.querySelector("#productLowStockKpi").textContent = metrics.lowStockProducts;
  document.querySelector("#bestProductKpi").textContent = metrics.bestSeller?.sku || "--";
  productTable.innerHTML = state.productos.map((product) => {
    const stock = state.inventarios.reduce((sum, item) => item.productoId === product.id || item.sku === product.sku ? sum + Number(item.stockNeto || 0) : sum, 0);
    const unitPrice = Number(product.precio || 0);
    const nextAction = (product.estado || "Activo") === "Activo" ? "Desactivar" : "Activar";
    return `
    <tr><td><span class="row-icon product-sku-icon"></span>${product.sku}</td><td><span class="row-icon product-row-icon"></span>${product.descripcion}</td><td>${product.codigoBarra || "-"}</td><td><span class="tag product-category-tag">${product.categoria || "Sin categoria"}</span></td><td>${formatMoney(unitPrice)}</td><td>${formatMoney(stock * unitPrice)}</td><td><span class="tag ${tagClass(product.estado)}">${normalizeUiStatus(product.estado)}</span></td><td class="table-actions"><button type="button" data-action="edit-product" data-id="${product.id}">Editar</button><button type="button" data-action="toggle-product-status" data-next-status="${nextAction === "Activar" ? "Activo" : "Inactivo"}" data-id="${product.id}">${nextAction}</button><button type="button" data-action="delete-product" data-id="${product.id}" data-record-name="${product.descripcion}">Eliminar</button></td></tr>`;
  }).join("");
};

renderInventory = function() {
  inventoryTable.innerHTML = state.inventarios.map((item) => {
    const status = normalizeUiStatus(item.estado);
    const stock = Number(item.stockNeto || 0);
    const unitPrice = Number(item.precioUnitario || 0);
    return `<tr><td><span class="row-icon sku-icon"></span>${item.sku}</td><td><span class="row-icon product-icon"></span>${item.producto}</td><td><span class="row-icon branch-icon"></span>${item.sucursal}</td><td>${stock.toLocaleString("es-DO")}</td><td>${formatMoney(unitPrice)}</td><td>${formatMoney(stock * unitPrice)}</td><td><span class="tag ${tagClass(status)}">${status}</span></td><td>${formatDateTime(item.actualizadoEn)}</td><td class="table-actions"><button type="button" data-action="edit-inventory" data-id="${item.id}">Editar</button><button type="button" data-action="delete-inventory" data-id="${item.id}" data-record-name="${item.producto} / ${item.sucursal}">Eliminar</button></td></tr>`;
  }).join("");
};

renderMovements = function() {
  movementList.innerHTML = state.movimientos.slice(0, 8).map((movement) => {
    const kind = movement.tipo === "Entrada" ? "entry" : movement.tipo === "Salida" ? "output" : movement.tipo === "Transferencia" ? "transfer" : "alert";
    return `<li class="activity-card ${kind}"><span class="activity-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 17 9 11l4 4 8-8" /><path d="M14 7h7v7" /></svg></span><div><strong>${movement.tipo}</strong><span>${Number(movement.cantidad || 0).toLocaleString("es-DO")} unidades - ${movement.producto}</span><small>${movement.sucursalOrigen || "-"} a ${movement.sucursalDestino || "-"} - ${formatDateTime(movement.creadoEn)}</small></div></li>`;
  }).join("");
};

renderClients = function() {
  if (!clientTable) return;
  const metrics = state.metrics?.clientes || { total: 0, active: 0, withLoans: 0, inactive: 0 };
  document.querySelector("#clientTotalKpi").textContent = metrics.total;
  document.querySelector("#clientActiveKpi").textContent = metrics.active;
  document.querySelector("#clientLoanKpi").textContent = metrics.withLoans;
  document.querySelector("#clientInactiveKpi").textContent = metrics.inactive;
  clientTable.innerHTML = state.clientes.map((client) => { const nextAction = (client.estado || "Activo") === "Activo" ? "Desactivar" : "Activar"; return `<tr><td>${client.nombre}</td><td>${client.documento}</td><td>${client.telefono || "-"}</td><td>${client.correo || "-"}</td><td>${client.direccion || "-"}</td><td><span class="tag ${tagClass(client.estado)}">${normalizeUiStatus(client.estado)}</span></td><td class="table-actions"><button type="button" data-action="edit-client" data-id="${client.id}">Editar</button><button type="button" data-action="toggle-client-status" data-next-status="${nextAction === "Activar" ? "Activo" : "Inactivo"}" data-id="${client.id}">${nextAction}</button><button type="button" data-action="delete-client" data-id="${client.id}" data-record-name="${client.nombre}">Eliminar</button></td></tr>`; }).join("");
  renderClientOptions();
};

renderLoans = function() {
  if (!loanTable) return;
  const metrics = state.metrics?.prestamos || { total: 0, active: 0, amount: 0, balance: 0 };
  document.querySelector("#loanTotalKpi").textContent = metrics.total;
  document.querySelector("#loanActiveKpi").textContent = metrics.active;
  document.querySelector("#loanAmountKpi").textContent = formatMoney(metrics.amount);
  document.querySelector("#loanBalanceKpi").textContent = formatMoney(metrics.balance);
  loanTable.innerHTML = state.prestamos.map((loan) => { const nextAction = loan.estado === "Activo" ? "Anular" : "Activar"; return `<tr><td>${loan.cliente}</td><td>${formatMoney(loan.monto)}</td><td>${Number(loan.tasa || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td><td>${loan.plazoMeses} meses</td><td>${formatMoney(loan.balancePendiente)}</td><td><span class="tag ${tagClass(loan.estado)}">${normalizeUiStatus(loan.estado)}</span></td><td>${formatDate(loan.fecha)}</td><td class="table-actions"><button type="button" data-action="edit-loan" data-id="${loan.id}">Editar</button><button type="button" data-action="toggle-loan-status" data-next-status="${nextAction === "Activar" ? "Activo" : "Anulado"}" data-id="${loan.id}">${nextAction}</button><button type="button" data-action="delete-loan" data-id="${loan.id}" data-record-name="${loan.cliente}">Eliminar</button></td></tr>`; }).join("");
  renderClientOptions();
};

renderPayments = function() {
  if (!paymentTable) return;
  const metrics = state.metrics?.pagos || { total: 0, applied: 0, pending: 0, amount: 0 };
  document.querySelector("#paymentTotalKpi").textContent = metrics.total;
  document.querySelector("#paymentAppliedKpi").textContent = metrics.applied;
  document.querySelector("#paymentAmountKpi").textContent = formatMoney(metrics.amount);
  document.querySelector("#paymentPendingKpi").textContent = metrics.pending;
  paymentTable.innerHTML = state.pagos.map((payment) => `<tr><td>${payment.cliente}</td><td>${payment.prestamoId}</td><td>${formatMoney(payment.monto)}</td><td>${payment.metodo}</td><td>${payment.referencia || "-"}</td><td>${formatDate(payment.fecha)}</td><td><span class="tag ${tagClass(payment.estado)}">${normalizeUiStatus(payment.estado)}</span></td><td class="table-actions"><button type="button" data-action="edit-payment" data-id="${payment.id}">Editar</button><button type="button" data-action="delete-payment" data-id="${payment.id}" data-record-name="${payment.referencia || payment.id}">Eliminar</button></td></tr>`).join("");
};

function ensurePaginationControl(collectionName, tableBody) {
  const wrap = tableBody?.closest(".table-wrap");
  if (!wrap || wrap.nextElementSibling?.dataset?.pagination === collectionName) return wrap?.nextElementSibling;
  const control = document.createElement("div");
  control.className = "pagination-bar";
  control.dataset.pagination = collectionName;
  wrap.insertAdjacentElement("afterend", control);
  return control;
}

function renderPagination(collectionName, tableBody) {
  const page = state.pagination[collectionName];
  const control = ensurePaginationControl(collectionName, tableBody);
  if (!control || !page) return;
  control.innerHTML = `<span>${page.total} registros - Pagina ${page.page} de ${page.totalPages}</span><label>Por pagina <select data-page-size="${collectionName}"><option ${page.pageSize === 10 ? "selected" : ""}>10</option><option ${page.pageSize === 25 ? "selected" : ""}>25</option><option ${page.pageSize === 50 ? "selected" : ""}>50</option></select></label><button type="button" data-page-prev="${collectionName}" ${!page.hasPrevious ? "disabled" : ""}>Anterior</button><button type="button" data-page-next="${collectionName}" ${!page.hasNext ? "disabled" : ""}>Siguiente</button>`;
}

function renderPaginationAll() {
  renderPagination("inventarios", inventoryTable);
  renderPagination("proveedores", supplierTable);
  renderPagination("productos", productTable);
  renderPagination("clientes", clientTable);
  renderPagination("prestamos", loanTable);
  renderPagination("pagos", paymentTable);
  renderPagination("sucursales", document.querySelector("#branchesTableBody"));
}

saveRecord = async function(collectionName, form) {
  const data = getFormData(form);
  const errors = validateForm(collectionName, data);
  if (errors.length) return setStatus(errors.join(". "), "error");
  await withButtonLock(form, async () => {
    const id = state.editing[collectionName];
    await apiRequest(id ? `/${collectionName}/${id}` : `/${collectionName}`, { method: id ? "PUT" : "POST", body: JSON.stringify(data) });
    clearForm(form, collectionName);
    await loadData();
    const label = collectionLabels[collectionName] || "registro";
    setStatus(id ? `${label} actualizado correctamente.` : `${label} creado correctamente.`, "ok");
  }).catch((error) => setStatus(friendlyErrorMessage(error, collectionName), "error"));
};

saveMovement = async function(form) {
  const data = getFormData(form);
  const errors = validateForm("movimientos", data);
  if (errors.length) return setStatus(errors.join(". "), "error");
  await withButtonLock(form, async () => {
    await apiRequest("/inventarios/movimientos", { method: "POST", body: JSON.stringify(data) });
    clearForm(form);
    await loadData();
    setStatus("Movimiento registrado correctamente.", "ok");
  }).catch((error) => setStatus(error.message, "error"));
};

deleteRecord = async function(collectionName, id) {
  const record = state[collectionName].find((item) => item.id === id) || {};
  const name = record.razonSocial || record.descripcion || record.producto || record.nombre || record.referencia || record.id || id;
  const label = collectionLabels[collectionName] || "registro";
  const confirmed = await confirmAction({
    title: `Eliminar ${label}`,
    message: `Se aplicara la eliminacion de "${name}". Si tiene historial relacionado, quedara inactivo para conservar la auditoria.`,
    confirmText: "Eliminar",
    danger: true,
  });
  if (!confirmed) return;
  try {
    await apiRequest(`/${collectionName}/${id}`, { method: "DELETE" });
    await loadData();
    setStatus(`${label} eliminado correctamente.`, "ok");
  } catch (error) {
    setStatus(friendlyErrorMessage(error, collectionName), "error");
  }
};

exportRows = async function(collectionName) {
  try {
    const reportName = { inventarios: "inventario", productos: "productos", proveedores: "proveedores", clientes: "clientes", prestamos: "prestamos", pagos: "pagos", movimientos: "movimientos", sucursales: "sucursales" }[collectionName] || collectionName;
    const report = await apiRequest(`/reportes/${reportName}?${queryFor(collectionName)}`);
    if (!report.items.length) return setStatus("No hay datos para exportar.", "error");
    const headers = Object.keys(report.items[0]);
    const csv = [headers.join(","), ...report.items.map((row) => headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${collectionName}-predicex.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus(`Exportacion de ${collectionName} generada con datos filtrados.`, "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  const [email, password] = loginForm.querySelectorAll("input");
  setLoginMessage("Validando credenciales...");
  try {
    const session = await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.value, password: password.value }) }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar sesion");
      return data;
    });
    state.auth.token = session.token;
    state.auth.user = session.user;
    sessionStorage.setItem("predicexToken", session.token);
    sessionStorage.setItem("predicexUser", JSON.stringify(session.user));
    setLoginMessage("");
    showApp();
  } catch (error) {
    setLoginMessage(error.message, "error");
  }
}, true);

logoutButton.addEventListener("click", (event) => {
  event.stopImmediatePropagation();
  sessionStorage.removeItem("predicexToken");
  sessionStorage.removeItem("predicexUser");
  state.auth.token = "";
  state.auth.user = null;
}, true);

document.addEventListener("click", async (event) => {
  const prev = event.target.closest("[data-page-prev]");
  const next = event.target.closest("[data-page-next]");
  if (prev || next) {
    const collectionName = prev?.dataset.pagePrev || next?.dataset.pageNext;
    state.pagination[collectionName].page += prev ? -1 : 1;
    await loadData();
  }
}, true);

document.addEventListener("change", async (event) => {
  const select = event.target.closest("[data-page-size]");
  if (!select) return;
  const collectionName = select.dataset.pageSize;
  state.pagination[collectionName].pageSize = Number(select.value);
  state.pagination[collectionName].page = 1;
  await loadData();
}, true);

document.querySelectorAll("[data-search]").forEach((input) => {
  input.addEventListener("input", () => {
    state.pagination[input.dataset.search].page = 1;
    clearTimeout(input._predicexSearchTimer);
    input._predicexSearchTimer = setTimeout(loadData, 250);
  }, true);
});
// Produccion filter reload
function collectionFromFilterElement(element) {
  if (element.closest("#inventoryView")) return "inventarios";
  if (element.closest("#suppliersView")) return "proveedores";
  if (element.closest("#productsView")) return "productos";
  if (element.closest("#clientsView")) return "clientes";
  if (element.closest("#loansView")) return "prestamos";
  if (element.closest("#paymentsView")) return "pagos";
  return null;
}

document.addEventListener("change", (event) => {
  const select = event.target.closest(".inventory-tools select, .supplier-tools select, .product-tools select, .module-tools select");
  if (!select || select.matches("[data-page-size]")) return;
  const collectionName = collectionFromFilterElement(select);
  if (!collectionName) return;
  state.pagination[collectionName].page = 1;
  setTimeout(loadData, 0);
});
// Predictive production UI
state.predictive = null;

function ensurePredictivePanel() {
  const dashboard = document.querySelector("#dashboardView");
  if (!dashboard || document.querySelector("#predictivePanel")) return;
  dashboard.insertAdjacentHTML("beforeend", `
    <article id="predictivePanel" class="panel predictive-panel">
      <div class="panel-heading">
        <div>
          <h3>Métricas predictivas</h3>
          <span>Alertas basadas en salidas reales e inventario actual</span>
        </div>
        <button id="trainModelButton" type="button" class="small-button secondary-action">Entrenar modelo</button>
      </div>
      <div class="predictive-kpis">
        <article><span>Riesgo crítico</span><strong id="criticalForecastMetric">0</strong></article>
        <article><span>Riesgo alto</span><strong id="highForecastMetric">0</strong></article>
        <article><span>Demanda 7 días</span><strong id="weeklyDemandMetric">0</strong></article>
        <article><span>Reorden sugerido</span><strong id="reorderMetric">0</strong></article>
      </div>
      <div id="predictiveEmpty" class="form-helper-note hidden">No hay movimientos suficientes para estimar demanda predictiva.</div>
      <ul id="predictiveList" class="activity-list predictive-list"></ul>
    </article>
  `);
  document.querySelector("#trainModelButton")?.addEventListener("click", trainPredictiveFromUi);
}

function renderPredictivePanel() {
  ensurePredictivePanel();
  const model = state.predictive;
  if (!model) return;
  document.querySelector("#criticalForecastMetric").textContent = model.summary.alertasCriticas;
  document.querySelector("#highForecastMetric").textContent = model.summary.alertasAltas;
  document.querySelector("#weeklyDemandMetric").textContent = Number(model.summary.demanda7Dias || 0).toLocaleString("es-DO");
  document.querySelector("#reorderMetric").textContent = Number(model.summary.reordenSugerido || 0).toLocaleString("es-DO");
  const actionable = model.forecasts.filter((item) => ["critico", "alto", "medio"].includes(item.riesgo));
  document.querySelector("#predictiveEmpty").classList.toggle("hidden", actionable.length > 0);
  document.querySelector("#predictiveList").innerHTML = actionable.slice(0, 6).map((item) => `
    <li class="activity-card alert predictive-alert"><span class="activity-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span><div><strong>${item.producto}</strong><span>${item.sucursal} - riesgo ${item.riesgo}</span><small>Stock ${item.stockNeto} / demanda 7 días ${item.demanda7Dias} / reorden sugerido ${item.recomendacion}</small></div></li>`).join("");
}

const previousLoadDataForPredictive = loadData;
loadData = async function() {
  await previousLoadDataForPredictive();
  if (!state.auth.token) return;
  try {
    const [predictive, stockAlerts] = await Promise.all([apiRequest("/predictivo/metricas"), apiRequest("/alertas-stock")]);
    state.predictive = predictive;
    state.stockAlerts = stockAlerts;
    renderPredictivePanel();
    renderAlertsView();
  } catch {
    // El estado principal ya muestra errores de sincronizacion.
  }
};
// Alerts module
state.stockAlerts = [];
state.alertFilters = { riesgo: "Todos", sucursal: "Todos" };

function alertRiskLabel(value) {
  const map = { critico: "Critico", alto: "Alto", medio: "Medio", bajo: "Bajo" };
  return map[String(value || "").toLowerCase()] || "Informativo";
}

function alertRiskClass(value) {
  const risk = String(value || "").toLowerCase();
  if (risk === "critico") return "empty";
  if (risk === "alto" || risk === "medio") return "low";
  return "info";
}

function filteredStockAlerts() {
  return (state.stockAlerts || []).filter((item) => {
    const riskOk = state.alertFilters.riesgo === "Todos" || alertRiskLabel(item.riesgo) === state.alertFilters.riesgo;
    const branchOk = state.alertFilters.sucursal === "Todos" || item.sucursal === state.alertFilters.sucursal;
    return riskOk && branchOk;
  });
}

function ensureMovementsView() {
  const workspace = document.querySelector(".workspace");
  if (!workspace || document.querySelector("#movementsView")) return;
  workspace.insertAdjacentHTML("beforeend", `
    <section id="movementsView" class="view">
      <article class="panel products-panel movement-module-panel">
        <div class="panel-heading products-heading">
          <div>
            <p class="eyebrow">Operaciones</p>
            <h3>Movimientos</h3>
            <span>Entradas, salidas, transferencias y ajustes registrados</span>
          </div>
        </div>
        <div class="predictive-kpis movement-kpis">
          <article><span>Total</span><strong id="movementTotalKpi">0</strong></article>
          <article><span>Entradas</span><strong id="movementEntryKpi">0</strong></article>
          <article><span>Salidas</span><strong id="movementOutputKpi">0</strong></article>
          <article><span>Ajustes</span><strong id="movementAdjustKpi">0</strong></article>
        </div>
        <div class="table-wrap movement-table-wrap">
          <table>
            <thead><tr><th>Tipo</th><th>SKU</th><th>Producto</th><th>Origen</th><th>Destino</th><th>Cantidad</th><th>Fecha</th><th>Nota</th></tr></thead>
            <tbody id="movementsTableBody"></tbody>
          </table>
        </div>
      </article>
    </section>`);
}

function ensureTransfersView() {
  const workspace = document.querySelector(".workspace");
  if (!workspace || document.querySelector("#transfersView")) return;
  workspace.insertAdjacentHTML("beforeend", `
    <section id="transfersView" class="view">
      <article class="panel products-panel movement-module-panel">
        <div class="panel-heading products-heading">
          <div>
            <p class="eyebrow">Operaciones</p>
            <h3>Transferencias</h3>
            <span>Movimientos entre sucursales registrados en inventario</span>
          </div>
        </div>
        <div class="predictive-kpis movement-kpis">
          <article><span>Total transferencias</span><strong id="transferTotalKpi">0</strong></article>
          <article><span>Unidades movidas</span><strong id="transferUnitsKpi">0</strong></article>
          <article><span>Origenes</span><strong id="transferOriginKpi">0</strong></article>
          <article><span>Destinos</span><strong id="transferDestinationKpi">0</strong></article>
        </div>
        <div class="table-wrap movement-table-wrap">
          <table>
            <thead><tr><th>SKU</th><th>Producto</th><th>Origen</th><th>Destino</th><th>Cantidad</th><th>Fecha</th><th>Nota</th></tr></thead>
            <tbody id="transfersTableBody"></tbody>
          </table>
        </div>
      </article>
    </section>`);
}

function movementTypeClass(type) {
  if (type === "Entrada") return "ok";
  if (type === "Salida") return "empty";
  if (type === "Transferencia") return "info";
  return "low";
}

function renderOperationsModules() {
  ensureMovementsView();
  ensureTransfersView();
  const movements = state.movimientos || [];
  const transfers = movements.filter((item) => item.tipo === "Transferencia");
  const countByType = movements.reduce((acc, item) => {
    acc[item.tipo] = (acc[item.tipo] || 0) + 1;
    return acc;
  }, {});
  document.querySelector("#movementTotalKpi") && (document.querySelector("#movementTotalKpi").textContent = movements.length.toLocaleString("es-DO"));
  document.querySelector("#movementEntryKpi") && (document.querySelector("#movementEntryKpi").textContent = Number(countByType.Entrada || 0).toLocaleString("es-DO"));
  document.querySelector("#movementOutputKpi") && (document.querySelector("#movementOutputKpi").textContent = Number(countByType.Salida || 0).toLocaleString("es-DO"));
  document.querySelector("#movementAdjustKpi") && (document.querySelector("#movementAdjustKpi").textContent = Number(countByType.Ajuste || 0).toLocaleString("es-DO"));
  document.querySelector("#transferTotalKpi") && (document.querySelector("#transferTotalKpi").textContent = transfers.length.toLocaleString("es-DO"));
  document.querySelector("#transferUnitsKpi") && (document.querySelector("#transferUnitsKpi").textContent = transfers.reduce((sum, item) => sum + Number(item.cantidad || 0), 0).toLocaleString("es-DO"));
  document.querySelector("#transferOriginKpi") && (document.querySelector("#transferOriginKpi").textContent = new Set(transfers.map((item) => item.sucursalOrigen).filter(Boolean)).size.toLocaleString("es-DO"));
  document.querySelector("#transferDestinationKpi") && (document.querySelector("#transferDestinationKpi").textContent = new Set(transfers.map((item) => item.sucursalDestino).filter(Boolean)).size.toLocaleString("es-DO"));

  const movementsBody = document.querySelector("#movementsTableBody");
  if (movementsBody) {
    movementsBody.innerHTML = movements.length
      ? movements.map((item) => `<tr><td><span class="tag ${movementTypeClass(item.tipo)}">${item.tipo || "-"}</span></td><td>${item.sku || "-"}</td><td>${item.producto || "-"}</td><td>${item.sucursalOrigen || "-"}</td><td>${item.sucursalDestino || "-"}</td><td>${Number(item.cantidad || 0).toLocaleString("es-DO")}</td><td>${formatDateTime(item.creadoEn || item.fecha)}</td><td>${item.nota || "-"}</td></tr>`).join("")
      : `<tr><td colspan="8" class="empty-table-cell">Sin movimientos registrados.</td></tr>`;
  }
  const transfersBody = document.querySelector("#transfersTableBody");
  if (transfersBody) {
    transfersBody.innerHTML = transfers.length
      ? transfers.map((item) => `<tr><td>${item.sku || "-"}</td><td>${item.producto || "-"}</td><td>${item.sucursalOrigen || "-"}</td><td>${item.sucursalDestino || "-"}</td><td>${Number(item.cantidad || 0).toLocaleString("es-DO")}</td><td>${formatDateTime(item.creadoEn || item.fecha)}</td><td>${item.nota || "-"}</td></tr>`).join("")
      : `<tr><td colspan="7" class="empty-table-cell">Sin transferencias registradas.</td></tr>`;
  }
}
function purchaseOrderSuggestions() {
  return (state.inventarios || [])
    .filter((item) => Number(item.stockNeto || 0) <= Number(item.umbralAlerta || 0))
    .map((item, index) => {
      const deficit = Math.max(Number(item.umbralAlerta || 0) - Number(item.stockNeto || 0), 0);
      const suggested = Math.max(deficit + Number(item.umbralAlerta || 0), 1);
      const product = (state.productos || []).find((prod) => prod.sku === item.sku) || {};
      const supplier = (state.proveedores || [])[index % Math.max((state.proveedores || []).length, 1)] || {};
      return {
        id: `oc-${item.id || index}`,
        sku: item.sku,
        producto: item.producto,
        sucursal: item.sucursal,
        proveedor: supplier.razonSocial || "Proveedor por asignar",
        cantidad: suggested,
        costo: suggested * Number(item.precioUnitario || product.precio || 0),
        estado: Number(item.stockNeto || 0) <= 0 ? "Critica" : "Pendiente",
        prioridad: Number(item.stockNeto || 0) <= 0 ? "Alta" : "Media",
      };
    });
}

function ensurePurchaseOrdersView() {
  const workspace = document.querySelector(".workspace");
  if (!workspace || document.querySelector("#purchaseOrdersView")) return;
  workspace.insertAdjacentHTML("beforeend", `
    <section id="purchaseOrdersView" class="view">
      <article class="panel products-panel movement-module-panel">
        <div class="panel-heading products-heading">
          <div><p class="eyebrow">Abastecimiento</p><h3>Ordenes de compra</h3><span>Ordenes sugeridas por stock bajo y reposicion</span></div>
          <button type="button" id="refreshPurchaseOrdersButton" class="small-button">Actualizar</button>
        </div>
        <div class="predictive-kpis movement-kpis">
          <article><span>Ordenes sugeridas</span><strong id="purchaseOrderTotalKpi">0</strong></article>
          <article><span>Unidades a comprar</span><strong id="purchaseOrderUnitsKpi">0</strong></article>
          <article><span>Costo estimado</span><strong id="purchaseOrderCostKpi">RD$ 0</strong></article>
          <article><span>Prioridad alta</span><strong id="purchaseOrderHighKpi">0</strong></article>
        </div>
        <div class="table-wrap movement-table-wrap">
          <table>
            <thead><tr><th>Orden</th><th>SKU</th><th>Producto</th><th>Sucursal destino</th><th>Proveedor</th><th>Cantidad</th><th>Costo estimado</th><th>Prioridad</th><th>Estado</th><th>Accion</th></tr></thead>
            <tbody id="purchaseOrdersTableBody"></tbody>
          </table>
        </div>
      </article>
    </section>`);
  document.querySelector("#refreshPurchaseOrdersButton")?.addEventListener("click", () => {
    renderPurchaseOrdersView();
    setStatus("Ordenes de compra actualizadas segun inventario actual.", "ok");
  });
}

function renderPurchaseOrdersView() {
  ensurePurchaseOrdersView();
  const orders = purchaseOrderSuggestions();
  document.querySelector("#purchaseOrderTotalKpi") && (document.querySelector("#purchaseOrderTotalKpi").textContent = orders.length.toLocaleString("es-DO"));
  document.querySelector("#purchaseOrderUnitsKpi") && (document.querySelector("#purchaseOrderUnitsKpi").textContent = orders.reduce((sum, item) => sum + Number(item.cantidad || 0), 0).toLocaleString("es-DO"));
  document.querySelector("#purchaseOrderCostKpi") && (document.querySelector("#purchaseOrderCostKpi").textContent = formatMoney(orders.reduce((sum, item) => sum + Number(item.costo || 0), 0)));
  document.querySelector("#purchaseOrderHighKpi") && (document.querySelector("#purchaseOrderHighKpi").textContent = orders.filter((item) => item.prioridad === "Alta").length.toLocaleString("es-DO"));
  const body = document.querySelector("#purchaseOrdersTableBody");
  if (!body) return;
  body.innerHTML = orders.length
    ? orders.map((item) => `<tr><td>${item.id}</td><td>${item.sku}</td><td>${item.producto}</td><td>${item.sucursal}</td><td>${item.proveedor}</td><td>${Number(item.cantidad || 0).toLocaleString("es-DO")}</td><td>${formatMoney(item.costo)}</td><td><span class="tag ${item.prioridad === "Alta" ? "empty" : "low"}">${item.prioridad}</span></td><td><span class="tag ${item.estado === "Critica" ? "empty" : "low"}">${item.estado}</span></td><td class="table-actions"><button type="button" data-action="mark-purchase-order" data-id="${item.id}">Marcar revisada</button></td></tr>`).join("")
    : `<tr><td colspan="10" class="empty-table-cell">No hay productos bajo minimo para ordenar.</td></tr>`;
}

function ensureBranchesView() {
  const workspace = document.querySelector(".workspace");
  if (!workspace || document.querySelector("#branchesView")) return;
  workspace.insertAdjacentHTML("beforeend", `
    <section id="branchesView" class="view">
      <article class="panel products-panel movement-module-panel">
        <div class="panel-heading products-heading"><div><p class="eyebrow">Red operacional</p><h3>Sucursales</h3><span>Registro y control de sucursales activas</span></div></div>
        <div class="product-kpis">
          <article><span class="inventory-kpi-icon branch"></span><div><strong id="branchTotalKpi">0</strong><span>Total sucursales</span></div></article>
          <article><span class="product-kpi-icon total"></span><div><strong id="branchWithStockKpi">0</strong><span>Con inventario</span></div></article>
          <article><span class="product-kpi-icon low"></span><div><strong id="branchLowStockKpi">0</strong><span>Con bajo stock</span></div></article>
          <article><span class="product-kpi-icon best"></span><div><strong id="branchStockUnitsKpi">0</strong><span>Unidades totales</span></div></article>
        </div>
        <div class="form-helper-note">Crea una sucursal nueva o edita el nombre de una existente.</div>
        <form id="branchForm" class="crud-form"><label>Nombre de sucursal<span class="field-shell branch-field"><input name="nombre" placeholder="Sucursal Norte" required /></span></label><button type="submit" class="small-button" data-default-text="Guardar sucursal">Guardar sucursal</button></form>
        <div class="product-tools module-tools"><label class="search-control"><span>Buscar sucursal</span><input data-search="sucursales" type="search" placeholder="Buscar por nombre" /></label><button type="button" class="export-button" data-export="sucursales">Exportar Excel</button></div>
        <div class="table-wrap movement-table-wrap"><table><thead><tr><th>Sucursal</th><th>Productos</th><th>Stock total</th><th>Bajo stock</th><th>Acciones</th></tr></thead><tbody id="branchesTableBody"></tbody></table></div>
      </article>
    </section>`);
  document.querySelector("#branchForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveRecord("sucursales", event.currentTarget);
  });
}

function filteredBranches() {
  const filter = state.filters.sucursales || { search: "" };
  return (state.sucursales || []).filter((item) => !filter.search || normalize(item.nombre).includes(normalize(filter.search)));
}

function renderBranchesView() {
  ensureBranchesView();
  const rows = filteredBranches();
  const inventory = state.inventarios || [];
  const totalStock = inventory.reduce((sum, item) => sum + Number(item.stockNeto || 0), 0);
  const withStock = new Set(inventory.map((item) => item.sucursal).filter(Boolean));
  const lowBranches = new Set(inventory.filter((item) => Number(item.stockNeto || 0) <= Number(item.umbralAlerta || 0)).map((item) => item.sucursal).filter(Boolean));
  document.querySelector("#branchTotalKpi") && (document.querySelector("#branchTotalKpi").textContent = (state.sucursales || []).length.toLocaleString("es-DO"));
  document.querySelector("#branchWithStockKpi") && (document.querySelector("#branchWithStockKpi").textContent = withStock.size.toLocaleString("es-DO"));
  document.querySelector("#branchLowStockKpi") && (document.querySelector("#branchLowStockKpi").textContent = lowBranches.size.toLocaleString("es-DO"));
  document.querySelector("#branchStockUnitsKpi") && (document.querySelector("#branchStockUnitsKpi").textContent = totalStock.toLocaleString("es-DO"));
  const body = document.querySelector("#branchesTableBody");
  if (!body) return;
  body.innerHTML = rows.length ? rows.map((branch) => {
    const items = inventory.filter((item) => item.sucursal === branch.nombre);
    const stock = items.reduce((sum, item) => sum + Number(item.stockNeto || 0), 0);
    const low = items.filter((item) => Number(item.stockNeto || 0) <= Number(item.umbralAlerta || 0)).length;
    return `<tr><td><span class="row-icon branch-icon"></span>${branch.nombre}</td><td>${items.length.toLocaleString("es-DO")}</td><td>${stock.toLocaleString("es-DO")}</td><td><span class="tag ${low ? "low" : "ok"}">${low.toLocaleString("es-DO")}</span></td><td class="table-actions"><button type="button" data-action="edit-branch" data-id="${branch.id}">Editar</button><button type="button" data-action="delete-branch" data-id="${branch.id}" data-record-name="${branch.nombre}">Eliminar</button></td></tr>`;
  }).join("") : `<tr><td colspan="5" class="empty-table-cell">Sin sucursales registradas.</td></tr>`;
}
function ensureAlertsView() {
  const workspace = document.querySelector(".workspace");
  if (!workspace || document.querySelector("#alertsView")) return;
  workspace.insertAdjacentHTML("beforeend", `
    <section id="alertsView" class="view">
      <article class="panel alerts-panel products-panel">
        <div class="panel-heading products-heading">
          <div>
            <p class="eyebrow">Gestion</p>
            <h3>Alertas</h3>
            <span>Riesgos de stock calculados con inventario real y demanda predictiva</span>
          </div>
          <div class="alerts-actions">
            <button id="refreshAlertsButton" type="button" class="small-button secondary-action">Actualizar</button>
            <button id="trainAlertsModelButton" type="button" class="small-button">Entrenar modelo</button>
          </div>
        </div>
        <div class="predictive-kpis alerts-kpis">
          <article><span>Criticas</span><strong id="alertsCriticalKpi">0</strong></article>
          <article><span>Altas</span><strong id="alertsHighKpi">0</strong></article>
          <article><span>Medias</span><strong id="alertsMediumKpi">0</strong></article>
          <article><span>Reorden sugerido</span><strong id="alertsReorderKpi">0</strong></article>
        </div>
        <div class="product-tools module-tools alerts-tools">
          <label><span>Riesgo</span><select id="alertRiskFilter"><option>Todos</option><option>Critico</option><option>Alto</option><option>Medio</option></select></label>
          <label><span>Sucursal</span><select id="alertBranchFilter"><option>Todos</option></select></label>
          <span id="alertsUpdatedAt" class="alerts-updated">Sin sincronizar</span>
        </div>
        <div id="alertsEmpty" class="form-helper-note hidden">No hay alertas de stock con los filtros seleccionados.</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>SKU</th><th>Producto</th><th>Sucursal</th><th>Stock</th><th>Umbral</th><th>Demanda 7 dias</th><th>Cobertura</th><th>Riesgo</th><th>Reorden</th></tr></thead>
            <tbody id="alertsTableBody"></tbody>
          </table>
        </div>
      </article>
    </section>`);
  document.querySelector("#alertRiskFilter")?.addEventListener("change", (event) => {
    state.alertFilters.riesgo = event.target.value;
    renderAlertsView();
  });
  document.querySelector("#alertBranchFilter")?.addEventListener("change", (event) => {
    state.alertFilters.sucursal = event.target.value;
    renderAlertsView();
  });
  document.querySelector("#refreshAlertsButton")?.addEventListener("click", refreshAlertsModule);
  document.querySelector("#trainAlertsModelButton")?.addEventListener("click", trainPredictiveFromUi);
}

async function trainPredictiveFromUi() {
  try {
    state.predictive = await apiRequest("/predictivo/entrenar", { method: "POST", body: JSON.stringify({}) });
    state.stockAlerts = await apiRequest("/alertas-stock");
    renderPredictivePanel();
    renderAlertsView();
    setStatus("Modelo predictivo entrenado y alertas actualizadas.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function refreshAlertsModule() {
  try {
    state.predictive = await apiRequest("/predictivo/metricas");
    state.stockAlerts = await apiRequest("/alertas-stock");
    renderPredictivePanel();
    renderAlertsView();
    setStatus("Alertas actualizadas con datos reales de SQL Server.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function renderAlertsView() {
  ensureAlertsView();
  const alerts = state.stockAlerts || [];
  const summary = alerts.reduce((acc, item) => {
    const risk = String(item.riesgo || "").toLowerCase();
    if (risk === "critico") acc.critico += 1;
    if (risk === "alto") acc.alto += 1;
    if (risk === "medio") acc.medio += 1;
    acc.reorden += Number(item.recomendacion || 0);
    return acc;
  }, { critico: 0, alto: 0, medio: 0, reorden: 0 });
  document.querySelector("#alertsCriticalKpi") && (document.querySelector("#alertsCriticalKpi").textContent = summary.critico);
  document.querySelector("#alertsHighKpi") && (document.querySelector("#alertsHighKpi").textContent = summary.alto);
  document.querySelector("#alertsMediumKpi") && (document.querySelector("#alertsMediumKpi").textContent = summary.medio);
  document.querySelector("#alertsReorderKpi") && (document.querySelector("#alertsReorderKpi").textContent = Number(summary.reorden || 0).toLocaleString("es-DO"));
  const branchFilter = document.querySelector("#alertBranchFilter");
  if (branchFilter) {
    const current = state.alertFilters.sucursal;
    const branches = [...new Set(alerts.map((item) => item.sucursal).filter(Boolean))].sort();
    branchFilter.innerHTML = `<option>Todos</option>${branches.map((branch) => `<option ${branch === current ? "selected" : ""}>${branch}</option>`).join("")}`;
  }
  const visibleAlerts = filteredStockAlerts();
  document.querySelector("#alertsEmpty")?.classList.toggle("hidden", visibleAlerts.length > 0);
  document.querySelector("#alertsUpdatedAt") && (document.querySelector("#alertsUpdatedAt").textContent = state.predictive?.trainedAt ? `Actualizado ${formatDateTime(state.predictive.trainedAt)}` : "Sin sincronizar");
  const table = document.querySelector("#alertsTableBody");
  if (!table) return;
  table.innerHTML = visibleAlerts.map((item) => {
    const coverage = item.diasCobertura === null || item.diasCobertura === undefined ? "Sin salidas" : `${item.diasCobertura} dias`;
    return `<tr><td><span class="row-icon sku-icon"></span>${item.sku || "-"}</td><td>${item.producto || "-"}</td><td>${item.sucursal || "-"}</td><td>${Number(item.stockNeto || 0).toLocaleString("es-DO")}</td><td>${Number(item.umbralAlerta || 0).toLocaleString("es-DO")}</td><td>${Number(item.demanda7Dias || 0).toLocaleString("es-DO")}</td><td>${coverage}</td><td><span class="tag ${alertRiskClass(item.riesgo)}">${alertRiskLabel(item.riesgo)}</span></td><td>${Number(item.recomendacion || 0).toLocaleString("es-DO")}</td></tr>`;
  }).join("");
}
// Reports module
state.report = { type: "inventario", data: null, rows: [], filters: { estado: "Todos", sucursal: "Todos", desde: "", hasta: "" } };

const reportDefinitions = {
  inventario: { label: "Inventario actual", endpoint: "inventario" },
  bajo_stock: { label: "Bajo stock", endpoint: "bajo_stock" },
  movimientos: { label: "Movimientos", endpoint: "movimientos" },
  transferencias: { label: "Transferencias", endpoint: "transferencias" },
  productos: { label: "Productos", endpoint: "productos" },
  proveedores: { label: "Proveedores", endpoint: "proveedores" },
  clientes: { label: "Clientes", endpoint: "clientes" },
  prestamos: { label: "Prestamos", endpoint: "prestamos" },
  balances: { label: "Balances", endpoint: "balances" },
  pagos: { label: "Pagos", endpoint: "pagos" },
};

function reportDateValue(row) {
  return row.fecha || row.creadoEn || row.actualizadoEn || row.fechaPago || "";
}

function reportBranchValue(row) {
  return row.sucursal || row.sucursalOrigen || row.sucursalDestino || "";
}

function reportStatusValue(row) {
  return normalizeUiStatus(row.estado || row.riesgo || "");
}

function reportMoneyTotal(rows) {
  return rows.reduce((sum, row) => sum + Number(row.monto || row.balancePendiente || row.precioUnitario || row.precio || 0), 0);
}

function applyReportFilters(rows) {
  const filters = state.report.filters;
  return rows.filter((row) => {
    const status = reportStatusValue(row);
    const branch = reportBranchValue(row);
    const dateValue = reportDateValue(row);
    const rowDate = dateValue ? new Date(String(dateValue).includes("T") ? dateValue : `${dateValue}T00:00:00`) : null;
    const statusOk = filters.estado === "Todos" || status === filters.estado;
    const branchOk = filters.sucursal === "Todos" || branch === filters.sucursal;
    const fromOk = !filters.desde || (rowDate && rowDate >= new Date(`${filters.desde}T00:00:00`));
    const toOk = !filters.hasta || (rowDate && rowDate <= new Date(`${filters.hasta}T23:59:59`));
    return statusOk && branchOk && fromOk && toOk;
  });
}

function reportColumnsFor(rows) {
  const preferred = ["id", "sku", "producto", "descripcion", "razonSocial", "nombre", "cliente", "sucursal", "sucursalOrigen", "sucursalDestino", "tipo", "cantidad", "stockNeto", "umbralAlerta", "monto", "balancePendiente", "metodo", "referencia", "estado", "fecha", "creadoEn", "actualizadoEn"];
  const present = new Set(rows.flatMap((row) => Object.keys(row)));
  const ordered = preferred.filter((key) => present.has(key));
  const extra = [...present].filter((key) => !ordered.includes(key));
  return [...ordered, ...extra].slice(0, 12);
}

function formatReportCell(key, value) {
  if (value === null || value === undefined || value === "") return "-";
  if (["monto", "balancePendiente", "precio", "precioUnitario"].includes(key)) return formatMoney(value);
  if (["fecha", "creadoEn", "actualizadoEn", "fechaPago"].includes(key)) return String(value).includes("T") ? formatDateTime(value) : formatDate(value);
  if (key === "estado") return normalizeUiStatus(value);
  return String(value);
}

function renderReportOptions() {
  const select = document.querySelector("#reportTypeSelect");
  if (!select) return;
  select.innerHTML = Object.entries(reportDefinitions).map(([key, report]) => `<option value="${key}" ${key === state.report.type ? "selected" : ""}>${report.label}</option>`).join("");
}

function renderReportFilters(rows) {
  const statusSelect = document.querySelector("#reportStatusFilter");
  const branchSelect = document.querySelector("#reportBranchFilter");
  if (statusSelect) {
    const current = state.report.filters.estado;
    const statuses = [...new Set(rows.map(reportStatusValue).filter(Boolean))].sort();
    statusSelect.innerHTML = `<option>Todos</option>${statuses.map((status) => `<option ${status === current ? "selected" : ""}>${status}</option>`).join("")}`;
  }
  if (branchSelect) {
    const current = state.report.filters.sucursal;
    const branches = [...new Set(rows.map(reportBranchValue).filter(Boolean))].sort();
    branchSelect.innerHTML = `<option>Todos</option>${branches.map((branch) => `<option ${branch === current ? "selected" : ""}>${branch}</option>`).join("")}`;
  }
  const from = document.querySelector("#reportDateFrom");
  const to = document.querySelector("#reportDateTo");
  if (from) from.value = state.report.filters.desde;
  if (to) to.value = state.report.filters.hasta;
}

function ensureReportsView() {
  const workspace = document.querySelector(".workspace");
  if (!workspace || document.querySelector("#reportsView")) return;
  workspace.insertAdjacentHTML("beforeend", `
    <section id="reportsView" class="view">
      <article class="panel reports-panel products-panel">
        <div class="panel-heading products-heading">
          <div>
            <p class="eyebrow">Control</p>
            <h3>Reportes</h3>
            <span>Consultas operativas generadas con los mismos datos filtrados del sistema</span>
          </div>
          <div class="reports-actions">
            <button id="refreshReportButton" type="button" class="small-button secondary-action">Actualizar</button>
            <button id="exportReportCsvButton" type="button" class="small-button secondary-action">Exportar Excel</button>
            <button id="printReportButton" type="button" class="small-button">Exportar PDF</button>
          </div>
        </div>
        <div class="product-tools module-tools reports-tools">
          <label><span>Reporte</span><select id="reportTypeSelect"></select></label>
          <label><span>Estado</span><select id="reportStatusFilter"><option>Todos</option></select></label>
          <label><span>Sucursal</span><select id="reportBranchFilter"><option>Todos</option></select></label>
          <label><span>Desde</span><input id="reportDateFrom" type="date" /></label>
          <label><span>Hasta</span><input id="reportDateTo" type="date" /></label>
        </div>
        <div class="predictive-kpis reports-kpis">
          <article><span>Registros</span><strong id="reportTotalKpi">0</strong></article>
          <article><span>Total monetario</span><strong id="reportMoneyKpi">RD$ 0.00</strong></article>
          <article><span>Fuente</span><strong id="reportSourceKpi">SQL</strong></article>
          <article><span>Actualizado</span><strong id="reportUpdatedKpi">-</strong></article>
        </div>
        <div id="reportsEmpty" class="form-helper-note hidden">No hay datos para el reporte y filtros seleccionados.</div>
        <div class="table-wrap">
          <table>
            <thead id="reportsTableHead"></thead>
            <tbody id="reportsTableBody"></tbody>
          </table>
        </div>
      </article>
    </section>`);
  renderReportOptions();
  document.querySelector("#reportTypeSelect")?.addEventListener("change", async (event) => {
    state.report.type = event.target.value;
    state.report.filters = { estado: "Todos", sucursal: "Todos", desde: "", hasta: "" };
    await loadReportData();
  });
  ["#reportStatusFilter", "#reportBranchFilter", "#reportDateFrom", "#reportDateTo"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("change", (event) => {
      if (selector === "#reportStatusFilter") state.report.filters.estado = event.target.value;
      if (selector === "#reportBranchFilter") state.report.filters.sucursal = event.target.value;
      if (selector === "#reportDateFrom") state.report.filters.desde = event.target.value;
      if (selector === "#reportDateTo") state.report.filters.hasta = event.target.value;
      renderReportsView();
    });
  });
  document.querySelector("#refreshReportButton")?.addEventListener("click", loadReportData);
  document.querySelector("#exportReportCsvButton")?.addEventListener("click", exportCurrentReportCsv);
  document.querySelector("#printReportButton")?.addEventListener("click", printCurrentReport);
}

async function loadReportData() {
  try {
    ensureReportsView();
    const definition = reportDefinitions[state.report.type] || reportDefinitions.inventario;
    const report = await apiRequest(`/reportes/${definition.endpoint}`);
    state.report.data = report;
    state.report.rows = report.items || [];
    renderReportsView();
    setStatus(`Reporte ${definition.label} actualizado.`, "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function renderReportsView() {
  ensureReportsView();
  const rows = state.report.rows || [];
  renderReportOptions();
  renderReportFilters(rows);
  const visibleRows = applyReportFilters(rows);
  const columns = reportColumnsFor(visibleRows.length ? visibleRows : rows);
  document.querySelector("#reportTotalKpi") && (document.querySelector("#reportTotalKpi").textContent = visibleRows.length.toLocaleString("es-DO"));
  document.querySelector("#reportMoneyKpi") && (document.querySelector("#reportMoneyKpi").textContent = formatMoney(reportMoneyTotal(visibleRows)));
  document.querySelector("#reportSourceKpi") && (document.querySelector("#reportSourceKpi").textContent = state.report.data ? "Real" : "-");
  document.querySelector("#reportUpdatedKpi") && (document.querySelector("#reportUpdatedKpi").textContent = state.report.data?.metrics?.syncedAt ? formatDateTime(state.report.data.metrics.syncedAt) : "-");
  document.querySelector("#reportsEmpty")?.classList.toggle("hidden", visibleRows.length > 0);
  const head = document.querySelector("#reportsTableHead");
  const body = document.querySelector("#reportsTableBody");
  if (!head || !body) return;
  head.innerHTML = columns.length ? `<tr>${columns.map((column) => `<th>${column}</th>`).join("")}</tr>` : "";
  body.innerHTML = visibleRows.map((row) => `<tr>${columns.map((column) => `<td>${formatReportCell(column, row[column])}</td>`).join("")}</tr>`).join("");
}

function exportCurrentReportCsv() {
  const rows = applyReportFilters(state.report.rows || []);
  if (!rows.length) return setStatus("No hay datos para exportar.", "error");
  const columns = reportColumnsFor(rows);
  const csv = [columns.join(","), ...rows.map((row) => columns.map((column) => `"${String(formatReportCell(column, row[column])).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${state.report.type}-predicex.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus("Exportacion del reporte generada con los filtros actuales.", "ok");
}

function printCurrentReport() {
  const rows = applyReportFilters(state.report.rows || []);
  if (!rows.length) return setStatus("No hay datos para exportar.", "error");
  const columns = reportColumnsFor(rows);
  const definition = reportDefinitions[state.report.type] || reportDefinitions.inventario;
  const html = `<!doctype html><html><head><title>${definition.label}</title><style>body{font-family:Arial,sans-serif;color:#111827}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #cbd5e1;padding:6px;text-align:left}th{background:#e5edf7}h1{font-size:20px}p{color:#475569}</style></head><body><h1>${definition.label}</h1><p>Generado ${formatDateTime(new Date().toISOString())} - ${rows.length} registros</p><table><thead><tr>${columns.map((column) => `<th>${column}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((column) => `<td>${formatReportCell(column, row[column])}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return setStatus("El navegador bloqueo la ventana de impresion.", "error");
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
// Audit module
state.audit = { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 }, filters: { usuario: "", modulo: "Todos", accion: "Todos", resultado: "Todos", desde: "", hasta: "" } };

function auditQuery() {
  const params = new URLSearchParams({ page: state.audit.pagination.page, pageSize: state.audit.pagination.pageSize });
  Object.entries(state.audit.filters).forEach(([key, value]) => {
    if (value && value !== "Todos") params.set(key, value);
  });
  return params.toString();
}

function auditTagClass(result) {
  return result === "ok" ? "ok" : "empty";
}

function auditSummaryText(value) {
  if (!value) return "-";
  const text = JSON.stringify(value);
  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
}

function renderAuditFilterOptions() {
  const modules = [...new Set(state.audit.items.map((item) => item.modulo).filter(Boolean))].sort();
  const actions = [...new Set(state.audit.items.map((item) => item.accion).filter(Boolean))].sort();
  const moduleSelect = document.querySelector("#auditModuleFilter");
  const actionSelect = document.querySelector("#auditActionFilter");
  if (moduleSelect) moduleSelect.innerHTML = `<option>Todos</option>${modules.map((item) => `<option ${item === state.audit.filters.modulo ? "selected" : ""}>${item}</option>`).join("")}`;
  if (actionSelect) actionSelect.innerHTML = `<option>Todos</option>${actions.map((item) => `<option ${item === state.audit.filters.accion ? "selected" : ""}>${item}</option>`).join("")}`;
}

function ensureAuditView() {
  const workspace = document.querySelector(".workspace");
  if (!workspace || document.querySelector("#auditView")) return;
  workspace.insertAdjacentHTML("beforeend", `
    <section id="auditView" class="view">
      <article class="panel audit-panel products-panel">
        <div class="panel-heading products-heading">
          <div>
            <p class="eyebrow">Control</p>
            <h3>Auditoria</h3>
            <span>Registro de acciones, usuario, resultado, IP y cambios aplicados</span>
          </div>
          <div class="audit-actions">
            <button id="refreshAuditButton" type="button" class="small-button secondary-action">Actualizar</button>
          </div>
        </div>
        <div class="product-tools module-tools audit-tools">
          <label><span>Usuario</span><input id="auditUserFilter" type="search" placeholder="correo o usuario" /></label>
          <label><span>Modulo</span><select id="auditModuleFilter"><option>Todos</option></select></label>
          <label><span>Accion</span><select id="auditActionFilter"><option>Todos</option></select></label>
          <label><span>Resultado</span><select id="auditResultFilter"><option>Todos</option><option value="ok">ok</option><option value="error">error</option></select></label>
          <label><span>Desde</span><input id="auditDateFrom" type="date" /></label>
          <label><span>Hasta</span><input id="auditDateTo" type="date" /></label>
        </div>
        <div class="predictive-kpis audit-kpis">
          <article><span>Eventos</span><strong id="auditTotalKpi">0</strong></article>
          <article><span>Pagina</span><strong id="auditPageKpi">1/1</strong></article>
          <article><span>Correctos</span><strong id="auditOkKpi">0</strong></article>
          <article><span>Errores</span><strong id="auditErrorKpi">0</strong></article>
        </div>
        <div id="auditEmpty" class="form-helper-note hidden">No hay eventos de auditoria con los filtros seleccionados.</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Usuario</th><th>Rol</th><th>Modulo</th><th>Accion</th><th>Registro</th><th>IP</th><th>Resultado</th><th>Cambios</th></tr></thead>
            <tbody id="auditTableBody"></tbody>
          </table>
        </div>
        <div class="pagination-bar audit-pagination">
          <label>Por pagina<select id="auditPageSize"><option>10</option><option selected>20</option><option>50</option><option>100</option></select></label>
          <span id="auditPaginationLabel">0 registros</span>
          <button id="auditPrevPage" type="button">Anterior</button>
          <button id="auditNextPage" type="button">Siguiente</button>
        </div>
      </article>
    </section>`);
  document.querySelector("#refreshAuditButton")?.addEventListener("click", loadAuditData);
  ["#auditUserFilter", "#auditModuleFilter", "#auditActionFilter", "#auditResultFilter", "#auditDateFrom", "#auditDateTo"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("change", (event) => {
      if (selector === "#auditUserFilter") state.audit.filters.usuario = event.target.value;
      if (selector === "#auditModuleFilter") state.audit.filters.modulo = event.target.value;
      if (selector === "#auditActionFilter") state.audit.filters.accion = event.target.value;
      if (selector === "#auditResultFilter") state.audit.filters.resultado = event.target.value;
      if (selector === "#auditDateFrom") state.audit.filters.desde = event.target.value;
      if (selector === "#auditDateTo") state.audit.filters.hasta = event.target.value;
      state.audit.pagination.page = 1;
      loadAuditData();
    });
  });
  document.querySelector("#auditPageSize")?.addEventListener("change", (event) => {
    state.audit.pagination.pageSize = Number(event.target.value);
    state.audit.pagination.page = 1;
    loadAuditData();
  });
  document.querySelector("#auditPrevPage")?.addEventListener("click", () => {
    state.audit.pagination.page = Math.max(1, state.audit.pagination.page - 1);
    loadAuditData();
  });
  document.querySelector("#auditNextPage")?.addEventListener("click", () => {
    state.audit.pagination.page = Math.min(state.audit.pagination.totalPages, state.audit.pagination.page + 1);
    loadAuditData();
  });
}

async function loadAuditData() {
  try {
    ensureAuditView();
    const result = await apiRequest(`/auditoria?${auditQuery()}`);
    state.audit.items = result.items || [];
    state.audit.pagination = result.pagination || state.audit.pagination;
    renderAuditView();
    setStatus("Auditoria actualizada.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function renderAuditView() {
  ensureAuditView();
  renderAuditFilterOptions();
  const items = state.audit.items || [];
  const okCount = items.filter((item) => item.resultado === "ok").length;
  const errorCount = items.filter((item) => item.resultado === "error").length;
  document.querySelector("#auditTotalKpi") && (document.querySelector("#auditTotalKpi").textContent = Number(state.audit.pagination.total || 0).toLocaleString("es-DO"));
  document.querySelector("#auditPageKpi") && (document.querySelector("#auditPageKpi").textContent = `${state.audit.pagination.page}/${state.audit.pagination.totalPages}`);
  document.querySelector("#auditOkKpi") && (document.querySelector("#auditOkKpi").textContent = okCount);
  document.querySelector("#auditErrorKpi") && (document.querySelector("#auditErrorKpi").textContent = errorCount);
  document.querySelector("#auditEmpty")?.classList.toggle("hidden", items.length > 0);
  document.querySelector("#auditPaginationLabel") && (document.querySelector("#auditPaginationLabel").textContent = `${state.audit.pagination.total} registros`);
  document.querySelector("#auditPrevPage") && (document.querySelector("#auditPrevPage").disabled = state.audit.pagination.page <= 1);
  document.querySelector("#auditNextPage") && (document.querySelector("#auditNextPage").disabled = state.audit.pagination.page >= state.audit.pagination.totalPages);
  const body = document.querySelector("#auditTableBody");
  if (!body) return;
  body.innerHTML = items.map((item) => `<tr><td>${formatDateTime(item.fecha)}</td><td>${item.usuario || "-"}</td><td>${item.rol || "-"}</td><td>${item.modulo || "-"}</td><td>${item.accion || "-"}</td><td>${item.registro || "-"}</td><td>${item.ip || "-"}</td><td><span class="tag ${auditTagClass(item.resultado)}">${item.resultado || "-"}</span></td><td><details><summary>Ver</summary><div class="audit-detail"><strong>Anterior</strong><code>${auditSummaryText(item.anterior)}</code><strong>Nuevo</strong><code>${auditSummaryText(item.nuevo)}</code>${item.error ? `<strong>Error</strong><code>${item.error}</code>` : ""}</div></details></td></tr>`).join("");
}
// Users, roles and settings modules
state.usersRoles = { usuarios: [], roles: [], sesionesActivas: 0 };
state.configuration = null;

function permissionLabel(permission) {
  const labels = { read: "Lectura", write: "Escritura", delete: "Eliminacion", export: "Exportacion", backup: "Respaldos" };
  return labels[permission] || permission;
}

function ensureUsersRolesView() {
  const workspace = document.querySelector(".workspace");
  if (!workspace || document.querySelector("#usersRolesView")) return;
  workspace.insertAdjacentHTML("beforeend", `
    <section id="usersRolesView" class="view">
      <article class="panel access-panel products-panel">
        <div class="panel-heading products-heading">
          <div>
            <p class="eyebrow">Control</p>
            <h3>Usuarios y roles</h3>
            <span>Usuarios activos y permisos aplicados por el backend</span>
          </div>
          <button id="refreshUsersRolesButton" type="button" class="small-button secondary-action">Actualizar</button>
        </div>
        <div class="predictive-kpis access-kpis">
          <article><span>Usuarios</span><strong id="usersTotalKpi">0</strong></article>
          <article><span>Roles</span><strong id="rolesTotalKpi">0</strong></article>
          <article><span>Sesiones activas</span><strong id="sessionsTotalKpi">0</strong></article>
          <article><span>Rol actual</span><strong id="currentRoleKpi">-</strong></article>
        </div>
        <div class="access-grid">
          <article class="access-card">
            <div class="panel-heading"><div><h3>Usuarios</h3><span>Cuentas habilitadas para autenticacion</span></div></div>
            <div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Sesion</th></tr></thead><tbody id="usersTableBody"></tbody></table></div>
          </article>
          <article class="access-card">
            <div class="panel-heading"><div><h3>Roles</h3><span>Permisos validados por endpoint</span></div></div>
            <div class="table-wrap"><table><thead><tr><th>Rol</th><th>Permisos</th></tr></thead><tbody id="rolesTableBody"></tbody></table></div>
          </article>
        </div>
      </article>
    </section>`);
  document.querySelector("#refreshUsersRolesButton")?.addEventListener("click", loadUsersRolesData);
}

async function loadUsersRolesData() {
  try {
    ensureUsersRolesView();
    state.usersRoles = await apiRequest("/usuarios-roles");
    renderUsersRolesView();
    setStatus("Usuarios y roles actualizados.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function renderUsersRolesView() {
  ensureUsersRolesView();
  const data = state.usersRoles || { usuarios: [], roles: [], sesionesActivas: 0 };
  document.querySelector("#usersTotalKpi") && (document.querySelector("#usersTotalKpi").textContent = data.usuarios.length);
  document.querySelector("#rolesTotalKpi") && (document.querySelector("#rolesTotalKpi").textContent = data.roles.length);
  document.querySelector("#sessionsTotalKpi") && (document.querySelector("#sessionsTotalKpi").textContent = data.sesionesActivas || 0);
  document.querySelector("#currentRoleKpi") && (document.querySelector("#currentRoleKpi").textContent = state.auth.user?.rol || "-");
  const usersTable = document.querySelector("#usersTableBody");
  if (usersTable) usersTable.innerHTML = data.usuarios.map((user) => `<tr><td>${user.nombre}</td><td>${user.email}</td><td><span class="tag info">${user.rol}</span></td><td><span class="tag ${tagClass(user.estado)}">${user.estado}</span></td><td>${user.sesionActual ? "Actual" : "-"}</td></tr>`).join("");
  const rolesTable = document.querySelector("#rolesTableBody");
  if (rolesTable) rolesTable.innerHTML = data.roles.map((role) => `<tr><td>${role.rol}</td><td>${role.permisos.map((permission) => `<span class="tag info permission-pill">${permissionLabel(permission)}</span>`).join("")}</td></tr>`).join("");
}

function ensureSettingsView() {
  const workspace = document.querySelector(".workspace");
  if (!workspace || document.querySelector("#settingsView")) return;
  workspace.insertAdjacentHTML("beforeend", `
    <section id="settingsView" class="view">
      <article class="panel settings-panel products-panel">
        <div class="panel-heading products-heading">
          <div>
            <p class="eyebrow">Sistema</p>
            <h3>Configuracion</h3>
            <span>Preferencias operativas no sensibles del sistema</span>
          </div>
          <button id="refreshSettingsButton" type="button" class="small-button secondary-action">Actualizar</button>
        </div>
        <form id="settingsForm" class="crud-form settings-form">
          <label>Empresa<span class="field-shell branch-field"><input name="empresaNombre" required /></span></label>
          <label>Moneda<span class="field-shell supplier-status-field"><input name="moneda" required maxlength="3" /></span></label>
          <label>Zona horaria<span class="field-shell product-description-field"><input name="zonaHoraria" required /></span></label>
          <label>Registros por pagina<span class="field-shell stock-field"><input name="registrosPorPagina" type="number" min="5" max="100" required /></span></label>
          <label>Directorio de respaldos<span class="field-shell product-description-field"><input name="respaldoDirectorio" required /></span></label>
          <button type="submit" class="small-button" data-default-text="Guardar configuracion">Guardar configuracion</button>
        </form>
        <div class="settings-grid">
          <article><span>Modo de datos</span><strong id="settingsModeKpi">-</strong></article>
          <article><span>SQL Server</span><strong id="settingsSqlServerKpi">-</strong></article>
          <article><span>Base de datos</span><strong id="settingsSqlDbKpi">-</strong></article>
          <article><span>Administrador</span><strong id="settingsAdminKpi">-</strong></article>
        </div>
      </article>
    </section>`);
  document.querySelector("#refreshSettingsButton")?.addEventListener("click", loadConfigurationData);
  document.querySelector("#settingsForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = getFormData(form);
    await withButtonLock(form, async () => {
      state.configuration = await apiRequest("/configuracion", { method: "PUT", body: JSON.stringify(data) });
      renderSettingsView();
      setStatus("Configuracion guardada correctamente.", "ok");
    }).catch((error) => setStatus(error.message, "error"));
  });
}

async function loadConfigurationData() {
  try {
    ensureSettingsView();
    state.configuration = await apiRequest("/configuracion");
    renderSettingsView();
    setStatus("Configuracion actualizada.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function renderSettingsView() {
  ensureSettingsView();
  const config = state.configuration;
  if (!config) return;
  const form = document.querySelector("#settingsForm");
  if (form) {
    form.empresaNombre.value = config.empresaNombre || "";
    form.moneda.value = config.moneda || "";
    form.zonaHoraria.value = config.zonaHoraria || "";
    form.registrosPorPagina.value = config.registrosPorPagina || 20;
    form.respaldoDirectorio.value = config.respaldoDirectorio || "";
  }
  document.querySelector("#settingsModeKpi") && (document.querySelector("#settingsModeKpi").textContent = config.modoDatos || "-");
  document.querySelector("#settingsSqlServerKpi") && (document.querySelector("#settingsSqlServerKpi").textContent = config.sqlServer || "-");
  document.querySelector("#settingsSqlDbKpi") && (document.querySelector("#settingsSqlDbKpi").textContent = config.sqlDatabase || "-");
  document.querySelector("#settingsAdminKpi") && (document.querySelector("#settingsAdminKpi").textContent = config.adminEmail || "-");
}
// Backups and help modules
state.backups = { items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } };

function backupQuery() {
  return new URLSearchParams({ page: state.backups.pagination.page, pageSize: state.backups.pagination.pageSize }).toString();
}

function ensureBackupsView() {
  const workspace = document.querySelector(".workspace");
  if (!workspace || document.querySelector("#backupsView")) return;
  workspace.insertAdjacentHTML("beforeend", `
    <section id="backupsView" class="view">
      <article class="panel backups-panel products-panel">
        <div class="panel-heading products-heading">
          <div>
            <p class="eyebrow">Sistema</p>
            <h3>Respaldos</h3>
            <span>Respaldos manuales de SQL Server con validacion y auditoria</span>
          </div>
          <div class="backups-actions">
            <button id="refreshBackupsButton" type="button" class="small-button secondary-action">Actualizar</button>
            <button id="createBackupButton" type="button" class="small-button">Crear respaldo</button>
          </div>
        </div>
        <div class="predictive-kpis backups-kpis">
          <article><span>Registros</span><strong id="backupTotalKpi">0</strong></article>
          <article><span>Completados</span><strong id="backupOkKpi">0</strong></article>
          <article><span>Errores</span><strong id="backupErrorKpi">0</strong></article>
          <article><span>Pagina</span><strong id="backupPageKpi">1/1</strong></article>
        </div>
        <div id="backupsEmpty" class="form-helper-note hidden">No hay respaldos registrados en auditoria.</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Nombre</th><th>Estado</th><th>Validado</th><th>Usuario</th><th>Ubicacion</th><th>Mensaje</th></tr></thead>
            <tbody id="backupsTableBody"></tbody>
          </table>
        </div>
        <div class="pagination-bar backups-pagination">
          <span id="backupPaginationLabel">0 registros</span>
          <button id="backupPrevPage" type="button">Anterior</button>
          <button id="backupNextPage" type="button">Siguiente</button>
        </div>
      </article>
    </section>`);
  document.querySelector("#refreshBackupsButton")?.addEventListener("click", loadBackupsData);
  document.querySelector("#createBackupButton")?.addEventListener("click", createManualBackup);
  document.querySelector("#backupPrevPage")?.addEventListener("click", () => {
    state.backups.pagination.page = Math.max(1, state.backups.pagination.page - 1);
    loadBackupsData();
  });
  document.querySelector("#backupNextPage")?.addEventListener("click", () => {
    state.backups.pagination.page = Math.min(state.backups.pagination.totalPages, state.backups.pagination.page + 1);
    loadBackupsData();
  });
}

async function loadBackupsData() {
  try {
    ensureBackupsView();
    const result = await apiRequest(`/backups?${backupQuery()}`);
    state.backups.items = result.items || [];
    state.backups.pagination = result.pagination || state.backups.pagination;
    renderBackupsView();
    setStatus("Historial de respaldos actualizado.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function createManualBackup() {
  const confirmed = await confirmAction({
    title: "Crear respaldo",
    message: "Se creara un respaldo manual de SQL Server y se validara antes de registrarlo. Esta accion puede tardar varios minutos.",
    confirmText: "Crear respaldo",
  });
  if (!confirmed) return;
  try {
    await apiRequest("/backups", { method: "POST", body: JSON.stringify({}) });
    await loadBackupsData();
    setStatus("Respaldo manual completado y validado.", "ok");
  } catch (error) {
    await loadBackupsData().catch(() => {});
    setStatus(error.message, "error");
  }
}

function renderBackupsView() {
  ensureBackupsView();
  const items = state.backups.items || [];
  const ok = items.filter((item) => item.estado === "Completado").length;
  const errors = items.filter((item) => item.estado === "Error").length;
  document.querySelector("#backupTotalKpi") && (document.querySelector("#backupTotalKpi").textContent = Number(state.backups.pagination.total || 0).toLocaleString("es-DO"));
  document.querySelector("#backupOkKpi") && (document.querySelector("#backupOkKpi").textContent = ok);
  document.querySelector("#backupErrorKpi") && (document.querySelector("#backupErrorKpi").textContent = errors);
  document.querySelector("#backupPageKpi") && (document.querySelector("#backupPageKpi").textContent = `${state.backups.pagination.page}/${state.backups.pagination.totalPages}`);
  document.querySelector("#backupPaginationLabel") && (document.querySelector("#backupPaginationLabel").textContent = `${state.backups.pagination.total} registros`);
  document.querySelector("#backupPrevPage") && (document.querySelector("#backupPrevPage").disabled = state.backups.pagination.page <= 1);
  document.querySelector("#backupNextPage") && (document.querySelector("#backupNextPage").disabled = state.backups.pagination.page >= state.backups.pagination.totalPages);
  document.querySelector("#backupsEmpty")?.classList.toggle("hidden", items.length > 0);
  const body = document.querySelector("#backupsTableBody");
  if (!body) return;
  body.innerHTML = items.map((item) => `<tr><td>${formatDateTime(item.fecha)}</td><td>${item.nombre || "-"}</td><td><span class="tag ${item.estado === "Completado" ? "ok" : "empty"}">${item.estado}</span></td><td>${item.validado ? "Si" : "No"}</td><td>${item.usuario || "-"}</td><td>${item.ubicacion || "-"}</td><td>${item.mensaje || "-"}</td></tr>`).join("");
}

function ensureHelpView() {
  const workspace = document.querySelector(".workspace");
  if (!workspace || document.querySelector("#helpView")) return;
  workspace.insertAdjacentHTML("beforeend", `
    <section id="helpView" class="view">
      <article class="panel help-panel products-panel">
        <div class="panel-heading products-heading">
          <div>
            <p class="eyebrow">Sistema</p>
            <h3>Ayuda</h3>
            <span>Guia rapida de operacion y soporte de Predicex</span>
          </div>
        </div>
        <div class="help-grid">
          <article><h3>Acceso demo</h3><p><strong>Usuario:</strong> admin@predicex.local</p><p><strong>Clave:</strong> predicex2026</p></article>
          <article><h3>Flujo operativo</h3><p>Inicia en Inventario, registra entradas, salidas o transferencias, revisa Alertas y confirma Reportes.</p></article>
          <article><h3>Seguridad</h3><p>Los permisos se validan en backend. Si una accion no aparece o falla, revisa el rol del usuario conectado.</p></article>
          <article><h3>Respaldos</h3><p>Solo Administrador puede crear respaldos. Cada intento queda registrado en Auditoria.</p></article>
          <article><h3>Formato</h3><p>Fechas en formato dominicano y montos en RD$ con dos decimales.</p></article>
          <article><h3>Soporte tecnico</h3><p>Revisa Auditoria, Reportes y Configuracion antes de diagnosticar errores de datos o conexion.</p></article>
        </div>
      </article>
    </section>`);
}

function renderHelpView() {
  ensureHelpView();
}
// Professional sidebar navigation
const modulePermissions = {
  Administrador: ["dashboardView", "inventoryView", "movementsView", "transfersView", "productsView", "suppliersView", "purchaseOrdersView", "branchesView", "clientsView", "loansView", "paymentsView", "alertsView", "reportsView", "auditView", "usersRolesView", "settingsView", "backupsView", "helpView"],
  Operador: ["dashboardView", "inventoryView", "movementsView", "transfersView", "productsView", "suppliersView", "branchesView", "alertsView", "reportsView", "settingsView", "helpView"],
  Consulta: ["dashboardView", "inventoryView", "productsView", "suppliersView", "branchesView", "alertsView", "reportsView", "helpView"],
};

const menuSections = [
  { id: "dashboard", label: "Dashboard", standalone: true, items: [{ id: "dashboardView", label: "Dashboard", icon: "dashboard" }] },
  { id: "operations", label: "Operaciones", items: [
    { id: "inventoryView", label: "Inventario", icon: "inventory" },
    { id: "movementsView", label: "Movimientos", icon: "movements" },
    { id: "transfersView", label: "Transferencias", icon: "transfer" },
    { id: "productsView", label: "Productos", icon: "products" },
    { id: "suppliersView", label: "Proveedores", icon: "suppliers" },
    { id: "purchaseOrdersView", label: "Ordenes de compra", icon: "orders" },
    { id: "branchesView", label: "Sucursales", icon: "branches" },
  ] },
  { id: "management", label: "Gestion", items: [
    { id: "clientsView", label: "Clientes", icon: "clients" },
    { id: "loansView", label: "Prestamos", icon: "loans" },
    { id: "paymentsView", label: "Pagos", icon: "payments" },
    { id: "alertsView", label: "Alertas", icon: "alerts" },
  ] },
  { id: "control", label: "Control", items: [
    { id: "reportsView", label: "Reportes", icon: "reports" },
    { id: "auditView", label: "Auditoria", icon: "audit" },
    { id: "usersRolesView", label: "Usuarios y roles", icon: "users" },
  ] },
  { id: "system", label: "Sistema", items: [
    { id: "settingsView", label: "Configuracion", icon: "settings" },
    { id: "backupsView", label: "Respaldos", icon: "backup" },
    { id: "helpView", label: "Ayuda", icon: "help" },
  ] },
];

const iconPaths = {
  dashboard: '<rect x="3" y="3" width="7" height="8" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="15" width="7" height="6" rx="2"/>',
  inventory: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  movements: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  transfer: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>',
  products: '<path d="m16.5 9.4-9-5.2"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  suppliers: '<path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-7h6v7"/><path d="M8 9h1M12 9h1M16 9h1"/>',
  orders: '<path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 10h8"/><path d="M8 14h6"/>',
  branches: '<path d="M6 3v18"/><path d="M18 3v18"/><path d="M6 7h12"/><path d="M6 13h12"/><path d="M9 21v-4h6v4"/>',
  clients: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  loans: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M13 16V8"/><path d="M18 16v-8"/>',
  payments: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>',
  alerts: '<path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  reports: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h6"/>',
  audit: '<path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.6 0 3.1.42 4.4 1.16"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  settings: '<path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82V22a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8.6 20a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.82-.33H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1.82V2a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15.4 4a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.3.31.5.7.6 1.1H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.82.9Z"/>',
  backup: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4"/><path d="M12 17h.01"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  collapse: '<path d="m15 18-6-6 6-6"/>',
  logout: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
};

function menuIcon(name) {
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${iconPaths[name] || iconPaths.dashboard}</svg>`;
}

function allowedMenuIds() {
  const role = state.auth.user?.rol || "Administrador";
  return new Set(modulePermissions[role] || modulePermissions.Consulta);
}

function createPlaceholderView(id, label) {
  const workspace = document.querySelector(".workspace");
  if (!workspace || document.querySelector(`#${id}`)) return;
  workspace.insertAdjacentHTML("beforeend", `
    <section id="${id}" class="view">
      <article class="panel placeholder-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">PREDICEX</p>
            <h3>${label}</h3>
            <span>Modulo operativo</span>
          </div>
        </div>
        <div class="module-placeholder">
          ${menuIcon("settings")}
          <strong>${label}</strong>
          <span>En preparación</span>
        </div>
      </article>
    </section>`);
}

function ensureModuleViews() {
  ensureAlertsView();
  ensureReportsView();
  ensureAuditView();
  ensureUsersRolesView();
  ensureSettingsView();
  ensureBackupsView();
  ensureHelpView();
  ensureMovementsView();
  ensureTransfersView();
  ensurePurchaseOrdersView();
  ensureBranchesView();
  menuSections.flatMap((section) => section.items).filter((item) => !["purchaseOrdersView", "branchesView", "movementsView", "transfersView", "alertsView", "reportsView", "auditView", "usersRolesView", "settingsView", "backupsView", "helpView"].includes(item.id)).forEach((item) => createPlaceholderView(item.id, item.label));
}


function renderSidebarNavigation(activeViewId = "dashboardView") {
  ensureModuleViews();
  const sidebar = document.querySelector(".sidebar");
  const navList = document.querySelector(".nav-list");
  if (!sidebar || !navList) return;
  const allowed = allowedMenuIds();
  const collapsed = localStorage.getItem("predicexSidebarCollapsed") === "true";

  sidebar.classList.toggle("is-collapsed", collapsed);
  navList.innerHTML = menuSections.map((section) => {
    const items = section.items.filter((item) => allowed.has(item.id));
    if (!items.length) return "";
    if (section.standalone) {
      const item = items[0];
      return `<button class="nav-item nav-leaf ${activeViewId === item.id ? "active" : ""}" data-view="${item.id}" title="${item.label}" aria-label="${item.label}">${menuIcon(item.icon)}<span>${item.label}</span></button>`;
    }
    return `<div class="nav-section" data-section="${section.id}">
      <div class="nav-section-label" aria-label="${section.label}">
        <span class="section-label">${section.label}</span>
      </div>
      <div class="nav-section-items">
        ${items.map((item) => `<button class="nav-item nav-leaf ${activeViewId === item.id ? "active" : ""}" data-view="${item.id}" title="${item.label}" aria-label="${item.label}">${menuIcon(item.icon)}<span>${item.label}</span></button>`).join("")}
      </div>
    </div>`;
  }).join("");

}

function ensureSidebarShell() {
  const appShell = document.querySelector("#appView");
  const sidebar = document.querySelector(".sidebar");
  if (!appShell || !sidebar || document.querySelector("#sidebarToggle")) return;
  appShell.insertAdjacentHTML("afterbegin", `<button id="mobileMenuButton" class="mobile-menu-button" type="button" aria-label="Abrir menu">${menuIcon("menu")}</button><div id="sidebarOverlay" class="sidebar-overlay" tabindex="-1"></div>`);
  sidebar.querySelector(".brand-row")?.insertAdjacentHTML("beforeend", `<button id="sidebarToggle" class="sidebar-toggle" type="button" aria-label="Contraer menu" title="Contraer menu">${menuIcon("collapse")}</button>`);
  sidebar.insertAdjacentHTML("beforeend", `<div class="sidebar-footer"><div class="connected-user"><strong id="connectedUserName">Administrador</strong><span id="connectedUserRole">Administrador</span></div></div>`);
  const footer = sidebar.querySelector(".sidebar-footer");
  const logout = document.querySelector("#logoutButton");
  if (footer && logout) {
    logout.setAttribute("title", "Cerrar sesion");
    footer.appendChild(logout);
  }
  document.querySelector("#sidebarToggle")?.addEventListener("click", () => {
    const next = !sidebar.classList.contains("is-collapsed");
    localStorage.setItem("predicexSidebarCollapsed", String(next));
    renderSidebarNavigation(document.querySelector(".view.active-view")?.id || "dashboardView");
  });
  document.querySelector("#mobileMenuButton")?.addEventListener("click", () => appShell.classList.add("sidebar-open"));
  document.querySelector("#sidebarOverlay")?.addEventListener("click", () => appShell.classList.remove("sidebar-open"));
}

function updateConnectedUser() {
  const user = state.auth.user || { nombre: "Administrador", rol: "Administrador" };
  document.querySelector("#connectedUserName") && (document.querySelector("#connectedUserName").textContent = user.nombre || user.email || "Usuario");
  document.querySelector("#connectedUserRole") && (document.querySelector("#connectedUserRole").textContent = user.rol || "Consulta");
}

function activateModuleView(viewId) {
  const allowed = allowedMenuIds();
  if (!allowed.has(viewId)) {
    setStatus("No tienes permisos para acceder a este modulo.", "error");
    return;
  }
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active-view", view.id === viewId));
  document.querySelectorAll(".nav-leaf").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  const item = menuSections.flatMap((section) => section.items).find((entry) => entry.id === viewId);
  if (viewTitle && item) viewTitle.textContent = item.label === "Dashboard" ? "Dashboard Operativo" : item.label;
  renderSidebarNavigation(viewId);
  if (viewId === "reportsView") {
    if (!state.report.data) loadReportData();
    else renderReportsView();
  }
  if (viewId === "auditView") {
    if (!state.audit.items.length) loadAuditData();
    else renderAuditView();
  }
  if (viewId === "usersRolesView") {
    if (!state.usersRoles.usuarios.length) loadUsersRolesData();
    else renderUsersRolesView();
  }
  if (viewId === "settingsView") {
    if (!state.configuration) loadConfigurationData();
    else renderSettingsView();
  }
  if (viewId === "backupsView") {
    if (!state.backups.items.length) loadBackupsData();
    else renderBackupsView();
  }
  if (viewId === "helpView") renderHelpView();
  document.querySelector("#appView")?.classList.remove("sidebar-open");
}

function initializeProfessionalSidebar() {
  ensureSidebarShell();
  renderSidebarNavigation(document.querySelector(".view.active-view")?.id || "dashboardView");
  updateConnectedUser();
}

switchView = activateModuleView;
initializeProfessionalSidebar();

document.addEventListener("click", (event) => {
  const item = event.target.closest(".nav-leaf[data-view]");
  if (item) activateModuleView(item.dataset.view);
});

const previousShowAppForSidebar = showApp;
showApp = function() {
  previousShowAppForSidebar();
  initializeProfessionalSidebar();
};













document.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  const { action, id } = target.dataset;
  if (action === "edit-branch") fillForm(document.querySelector("#branchForm"), state.sucursales.find((item) => item.id === id), "sucursales");
  if (action === "delete-branch") await deleteRecord("sucursales", id);
  if (action === "mark-purchase-order") setStatus(`Orden ${id} marcada como revisada.`, "ok");
});
document.addEventListener("input", (event) => {
  const input = event.target.closest("[data-search]");
  if (!input || input._predicexDelegatedSearch) return;
  const collectionName = input.dataset.search;
  if (!state.filters[collectionName]) return;
  state.filters[collectionName].search = input.value;
  if (state.pagination[collectionName]) state.pagination[collectionName].page = 1;
  clearTimeout(input._predicexSearchTimer);
  input._predicexSearchTimer = setTimeout(() => {
    if (collectionName === "sucursales") renderBranchesView();
    else loadData();
  }, 250);
}, true);