const API_URL = "http://localhost:3000";

const state = {
  proveedores: [],
  productos: [],
  inventarios: [],
  editing: {
    proveedores: null,
    productos: null,
    inventarios: null,
  },
};

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
const addStockButton = document.querySelector("#addStockButton");
const supplierForm = document.querySelector("#supplierForm");
const productForm = document.querySelector("#productForm");
const inventoryForm = document.querySelector("#inventoryForm");
const statusMessage = document.querySelector("#statusMessage");
const currentDateTime = document.querySelector("#currentDateTime");
const inventoryDate = document.querySelector("#inventoryDate");
const inventoryTime = document.querySelector("#inventoryTime");

const titles = {
  dashboardView: "Dashboard Operativo",
  inventoryView: "Inventario multisucursal",
  suppliersView: "Proveedores",
  productsView: "Productos",
};

function setStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.className = `status-note ${type}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "No se pudo completar la operacion");
  }

  return data;
}

function getFormData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function clearForm(form, collectionName) {
  form.reset();
  state.editing[collectionName] = null;
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.textContent = submitButton.dataset.defaultText;
}

function fillForm(form, data, collectionName) {
  Object.entries(data).forEach(([key, value]) => {
    if (form.elements[key]) {
      form.elements[key].value = value ?? "";
    }
  });

  state.editing[collectionName] = data.id;
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.textContent = "Actualizar";
}

function renderInventory() {
  inventoryTable.innerHTML = state.inventarios
    .map((item) => {
      const stock = Number(item.stockNeto);
      const price = Number(item.precioUnitario || 0);
      const isEmpty = stock <= 0;
      const isLow = !isEmpty && stock <= item.umbralAlerta;
      const statusClass = isEmpty ? "empty" : isLow ? "low" : "ok";
      const statusText = isEmpty ? "Sin Stock" : isLow ? "Bajo umbral" : "Disponible";
      return `
        <tr>
          <td><span class="row-icon sku-icon"></span>${item.sku}</td>
          <td><span class="row-icon product-icon"></span>${item.producto}</td>
          <td><span class="row-icon branch-icon"></span>${item.sucursal}</td>
          <td><strong>${stock.toLocaleString("es-DO")}</strong></td>
          <td>${price.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}</td>
          <td><span class="tag ${statusClass}">${statusText}</span></td>
          <td>${new Date().toLocaleDateString("es-DO")} ${new Date().toLocaleTimeString("es-DO", {
            hour: "2-digit",
            minute: "2-digit",
          })}</td>
          <td class="table-actions">
            <button type="button" data-action="edit-inventory" data-id="${item.id}">Editar</button>
            <button type="button" data-action="delete-inventory" data-id="${item.id}">Eliminar</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderSuppliers() {
  document.querySelector("#supplierTotalKpi").textContent = state.proveedores.length;
  document.querySelector("#supplierActiveKpi").textContent = state.proveedores.filter(
    (supplier) => String(supplier.estado || "").toLowerCase() === "activo",
  ).length;
  document.querySelector("#supplierEmailKpi").textContent = state.proveedores.filter((supplier) => supplier.correo).length;
  document.querySelector("#supplierPhoneKpi").textContent = state.proveedores.filter((supplier) => supplier.telefono).length;

  supplierTable.innerHTML = state.proveedores
    .map(
      (supplier) => `
        <tr>
          <td><span class="row-icon supplier-company-icon"></span>${supplier.razonSocial}</td>
          <td><span class="row-icon supplier-doc-icon"></span>${supplier.rnc}</td>
          <td>${supplier.telefono || "-"}</td>
          <td>${supplier.correo || "-"}</td>
          <td><span class="tag ok">${supplier.estado}</span></td>
          <td>${new Date().toLocaleDateString("es-DO")}</td>
          <td class="table-actions">
            <button type="button" data-action="edit-supplier" data-id="${supplier.id}">Editar</button>
            <button type="button" data-action="delete-supplier" data-id="${supplier.id}">Eliminar</button>
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderProducts() {
  const categories = new Set(state.productos.map((product) => product.categoria).filter(Boolean));
  const lowStockProductIds = new Set(
    state.inventarios.filter((item) => item.stockNeto <= item.umbralAlerta).map((item) => item.productoId),
  );
  const bestProduct = state.productos[0]?.sku || "--";
  document.querySelector("#productTotalKpi").textContent = state.productos.length;
  document.querySelector("#categoryTotalKpi").textContent = categories.size;
  document.querySelector("#productLowStockKpi").textContent = lowStockProductIds.size;
  document.querySelector("#bestProductKpi").textContent = bestProduct;

  productTable.innerHTML = state.productos
    .map(
      (product) => `
        <tr>
          <td><span class="row-icon product-sku-icon"></span>${product.sku}</td>
          <td><span class="row-icon product-row-icon"></span>${product.descripcion}</td>
          <td>${product.codigoBarra || "-"}</td>
          <td><span class="tag product-category-tag">${product.categoria}</span></td>
          <td class="table-actions">
            <button type="button" data-action="edit-product" data-id="${product.id}">Editar</button>
            <button type="button" data-action="delete-product" data-id="${product.id}">Eliminar</button>
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderDashboard() {
  const totalStock = state.inventarios.reduce((total, item) => total + Number(item.stockNeto), 0);
  const lowStock = state.inventarios.filter((item) => item.stockNeto <= item.umbralAlerta).length;
  const activeBranches = new Set(state.inventarios.map((item) => item.sucursal)).size;
  const todayMovements = Math.max(4, state.inventarios.length + lowStock);
  const estimatedInventoryValue = state.inventarios.reduce((total, item) => total + Number(item.stockNeto) * Number(item.precioUnitario || 0), 0);
  const now = new Date();
  document.querySelector("#totalStockMetric").textContent = totalStock.toLocaleString("es-DO");
  document.querySelector("#lowStockMetric").textContent = lowStock;
  document.querySelector("#supplierMetric").textContent = state.proveedores.length;
  document.querySelector("#productMetric").textContent = state.productos.length;
  document.querySelector("#executiveStockMetric").textContent = totalStock.toLocaleString("es-DO");
  document.querySelector("#inventoryValueMetric").textContent = estimatedInventoryValue.toLocaleString("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  });
  document.querySelector("#criticalProductsMetric").textContent = lowStock;
  document.querySelector("#lastSyncMetric").textContent = now.toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  document.querySelector("#inventoryTotalKpi").textContent = totalStock.toLocaleString("es-DO");
  document.querySelector("#activeBranchesKpi").textContent = activeBranches;
  document.querySelector("#lowInventoryKpi").textContent = lowStock;
  document.querySelector("#todayMovementsKpi").textContent = todayMovements;
  document.querySelector("#inventoryLastSync").textContent = now.toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderCurrentDateTime() {
  if (!currentDateTime) {
    return;
  }

  currentDateTime.textContent = new Date().toLocaleString("es-DO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  if (inventoryDate) {
    inventoryDate.textContent = new Date().toLocaleDateString("es-DO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (inventoryTime) {
    inventoryTime.textContent = new Date().toLocaleTimeString("es-DO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
}

async function loadData() {
  try {
    const [proveedores, productos, inventarios] = await Promise.all([
      apiRequest("/proveedores"),
      apiRequest("/productos"),
      apiRequest("/inventarios"),
    ]);

    state.proveedores = proveedores;
    state.productos = productos;
    state.inventarios = inventarios;
    renderSuppliers();
    renderProducts();
    renderInventory();
    renderDashboard();
    setStatus("Datos sincronizados con la base local.", "ok");
  } catch (error) {
    setStatus("No se pudo conectar con el backend. Ejecuta npm run start:backend.", "error");
  }
}

async function saveRecord(collectionName, form) {
  const id = state.editing[collectionName];
  const method = id ? "PUT" : "POST";
  const path = id ? `/${collectionName}/${id}` : `/${collectionName}`;
  const body = JSON.stringify(getFormData(form));

  await apiRequest(path, { method, body });
  clearForm(form, collectionName);
  await loadData();
}

async function deleteRecord(collectionName, id) {
  await apiRequest(`/${collectionName}/${id}`, { method: "DELETE" });
  await loadData();
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

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  showApp();
});

logoutButton.addEventListener("click", showLogin);

navItems.forEach((item) => {
  item.addEventListener("click", () => switchView(item.dataset.view));
});

supplierForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveRecord("proveedores", supplierForm);
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveRecord("productos", productForm);
});

inventoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveRecord("inventarios", inventoryForm);
});

document.addEventListener("click", async (event) => {
  const { action, id } = event.target.dataset;

  if (!action || !id) {
    return;
  }

  if (action === "edit-supplier") {
    fillForm(supplierForm, state.proveedores.find((item) => item.id === id), "proveedores");
  }

  if (action === "edit-product") {
    fillForm(productForm, state.productos.find((item) => item.id === id), "productos");
  }

  if (action === "edit-inventory") {
    fillForm(inventoryForm, state.inventarios.find((item) => item.id === id), "inventarios");
  }

  if (action === "delete-supplier") {
    await deleteRecord("proveedores", id);
  }

  if (action === "delete-product") {
    await deleteRecord("productos", id);
  }

  if (action === "delete-inventory") {
    await deleteRecord("inventarios", id);
  }
});

addStockButton.addEventListener("click", async () => {
  const firstAlert = state.inventarios.find((item) => item.stockNeto <= item.umbralAlerta);

  if (!firstAlert) {
    setStatus("No hay inventario bajo umbral para simular entrada.", "ok");
    return;
  }

  await apiRequest(`/inventarios/${firstAlert.id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...firstAlert,
      stockNeto: Number(firstAlert.stockNeto) + 24,
    }),
  });
  await loadData();
});

renderCurrentDateTime();
setInterval(renderCurrentDateTime, 1000);
