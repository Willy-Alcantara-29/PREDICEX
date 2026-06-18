const inventory = [
  { sku: "SKU-PRD-018", product: "Arroz premium 25 lb", branch: "Sucursal Norte", stock: 8, min: 20 },
  { sku: "SKU-PRD-104", product: "Aceite vegetal 1 gal", branch: "Almacen Central", stock: 240, min: 60 },
  { sku: "SKU-PRD-231", product: "Cafe molido 1 lb", branch: "Sucursal Este", stock: 36, min: 40 },
  { sku: "SKU-PRD-318", product: "Leche UHT caja", branch: "Sucursal Centro", stock: 128, min: 50 },
];

const loginView = document.querySelector("#loginView");
const appView = document.querySelector("#appView");
const loginForm = document.querySelector("#loginForm");
const logoutButton = document.querySelector("#logoutButton");
const viewTitle = document.querySelector("#viewTitle");
const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const inventoryTable = document.querySelector("#inventoryTable");
const addStockButton = document.querySelector("#addStockButton");

const titles = {
  dashboardView: "Dashboard operativo",
  inventoryView: "Inventario multisucursal",
  suppliersView: "Proveedores",
};

function renderInventory() {
  inventoryTable.innerHTML = inventory
    .map((item) => {
      const isLow = item.stock <= item.min;
      return `
        <tr>
          <td>${item.sku}</td>
          <td>${item.product}</td>
          <td>${item.branch}</td>
          <td>${item.stock}</td>
          <td><span class="tag ${isLow ? "low" : "ok"}">${isLow ? "Bajo umbral" : "Disponible"}</span></td>
        </tr>
      `;
    })
    .join("");
}

function showApp() {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  renderInventory();
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

addStockButton.addEventListener("click", () => {
  inventory[0].stock += 24;
  inventory[2].stock += 12;
  renderInventory();
});

renderInventory();
