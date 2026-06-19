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

const titles = {
  dashboardView: "Dashboard operativo",
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
      const isLow = item.stockNeto <= item.umbralAlerta;
      return `
        <tr>
          <td>${item.sku}</td>
          <td>${item.producto}</td>
          <td>${item.sucursal}</td>
          <td>${item.stockNeto}</td>
          <td><span class="tag ${isLow ? "low" : "ok"}">${isLow ? "Bajo umbral" : "Disponible"}</span></td>
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
  supplierTable.innerHTML = state.proveedores
    .map(
      (supplier) => `
        <tr>
          <td>${supplier.razonSocial}</td>
          <td>${supplier.rnc}</td>
          <td>${supplier.telefono || "-"}</td>
          <td>${supplier.correo || "-"}</td>
          <td><span class="tag ok">${supplier.estado}</span></td>
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
  productTable.innerHTML = state.productos
    .map(
      (product) => `
        <tr>
          <td>${product.sku}</td>
          <td>${product.descripcion}</td>
          <td>${product.codigoBarra || "-"}</td>
          <td>${product.categoria}</td>
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
  document.querySelector("#totalStockMetric").textContent = totalStock.toLocaleString("es-DO");
  document.querySelector("#lowStockMetric").textContent = lowStock;
  document.querySelector("#supplierMetric").textContent = state.proveedores.length;
  document.querySelector("#productMetric").textContent = state.productos.length;
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
