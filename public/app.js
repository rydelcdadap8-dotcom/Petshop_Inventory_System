const state = {
  products: [],
  movements: [],
  editingId: null
};

const elements = {
  refreshButton: document.querySelector("#refreshButton"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  categoryOptions: document.querySelector("#categoryOptions"),
  clearFiltersButton: document.querySelector("#clearFiltersButton"),
  productsTable: document.querySelector("#productsTable"),
  emptyState: document.querySelector("#emptyState"),
  movementsTable: document.querySelector("#movementsTable"),
  movementsEmptyState: document.querySelector("#movementsEmptyState"),
  totalProducts: document.querySelector("#totalProducts"),
  totalStock: document.querySelector("#totalStock"),
  lowStock: document.querySelector("#lowStock"),
  inventoryValue: document.querySelector("#inventoryValue"),
  statusLine: document.querySelector("#statusLine"),
  productForm: document.querySelector("#productForm"),
  productId: document.querySelector("#productId"),
  formTitle: document.querySelector("#formTitle"),
  nameInput: document.querySelector("#nameInput"),
  categoryInput: document.querySelector("#categoryInput"),
  skuInput: document.querySelector("#skuInput"),
  barcodeInput: document.querySelector("#barcodeInput"),
  unitInput: document.querySelector("#unitInput"),
  quantityInput: document.querySelector("#quantityInput"),
  lowStockLimitInput: document.querySelector("#lowStockLimitInput"),
  costPriceInput: document.querySelector("#costPriceInput"),
  priceInput: document.querySelector("#priceInput"),
  supplierInput: document.querySelector("#supplierInput"),
  descriptionInput: document.querySelector("#descriptionInput"),
  saveButton: document.querySelector("#saveButton"),
  resetButton: document.querySelector("#resetButton"),
  stockDialog: document.querySelector("#stockDialog"),
  stockForm: document.querySelector("#stockForm"),
  stockDialogTitle: document.querySelector("#stockDialogTitle"),
  stockProductId: document.querySelector("#stockProductId"),
  stockMovementType: document.querySelector("#stockMovementType"),
  stockQuantityInput: document.querySelector("#stockQuantityInput"),
  stockRemarksInput: document.querySelector("#stockRemarksInput"),
  stockSaveButton: document.querySelector("#stockSaveButton"),
  stockCancelButton: document.querySelector("#stockCancelButton")
};

function money(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(Number(value || 0));
}

function dateTime(value) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila"
  }).format(new Date(value));
}

function setStatus(message, type = "info") {
  elements.statusLine.textContent = message;
  elements.statusLine.classList.toggle("error", type === "error");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFilters() {
  return {
    search: elements.searchInput.value.trim(),
    category: elements.categoryFilter.value.trim()
  };
}

function productPayload() {
  return {
    name: elements.nameInput.value.trim(),
    category: elements.categoryInput.value.trim(),
    sku: elements.skuInput.value.trim(),
    barcode: elements.barcodeInput.value.trim(),
    unit: elements.unitInput.value.trim(),
    quantity: Number(elements.quantityInput.value || 0),
    lowStockLimit: Number(elements.lowStockLimitInput.value || 0),
    costPrice: Number(elements.costPriceInput.value || 0),
    price: Number(elements.priceInput.value || 0),
    supplier: elements.supplierInput.value.trim(),
    description: elements.descriptionInput.value.trim()
  };
}

function resetForm() {
  state.editingId = null;
  elements.productForm.reset();
  elements.productId.value = "";
  elements.unitInput.value = "pcs";
  elements.quantityInput.value = "0";
  elements.lowStockLimitInput.value = "5";
  elements.costPriceInput.value = "0";
  elements.priceInput.value = "0";
  elements.formTitle.textContent = "Add Product";
  elements.saveButton.textContent = "Save Product";
}

function updateSummary(summary) {
  if (summary) {
    elements.totalProducts.textContent = String(summary.total_products || 0);
    elements.totalStock.textContent = String(summary.total_stock || 0);
    elements.lowStock.textContent = String(summary.low_stock_products || 0);
    elements.inventoryValue.textContent = money(summary.inventory_value || 0);
    return;
  }

  const totalStock = state.products.reduce((sum, product) => sum + Number(product.quantity || 0), 0);
  const lowStock = state.products.filter((product) => Number(product.quantity || 0) <= Number(product.low_stock_limit || 5)).length;
  const value = state.products.reduce((sum, product) => sum + Number(product.quantity || 0) * Number(product.price || 0), 0);

  elements.totalProducts.textContent = String(state.products.length);
  elements.totalStock.textContent = String(totalStock);
  elements.lowStock.textContent = String(lowStock);
  elements.inventoryValue.textContent = money(value);
}

function updateCategories() {
  const categories = [...new Set(state.products.map((product) => product.category).filter(Boolean))].sort();

  elements.categoryOptions.innerHTML = categories
    .map((category) => `<option value="${escapeHtml(category)}"></option>`)
    .join("");
}

function movementLabel(value) {
  const labels = {
    stock_in: "Stock In",
    stock_out: "Stock Out",
    adjustment: "Adjustment"
  };

  return labels[value] || value;
}

function renderProducts() {
  elements.productsTable.innerHTML = state.products
    .map((product) => {
      const quantity = Number(product.quantity || 0);
      const lowLimit = Number(product.low_stock_limit || 5);
      const stockClass = quantity <= lowLimit ? "stock-pill low" : "stock-pill";
      const skuLine = [product.sku, product.barcode].filter(Boolean).join(" / ");

      return `
        <tr>
          <td>
            <div class="product-name">
              <strong>${escapeHtml(product.name)}</strong>
              <span>${escapeHtml(skuLine || product.description || "No SKU or barcode")}</span>
            </div>
          </td>
          <td>${escapeHtml(product.category)}</td>
          <td><span class="${stockClass}">${quantity} ${escapeHtml(product.unit || "pcs")}</span></td>
          <td>
            <div class="price-cell">
              <strong>${money(product.price)}</strong>
              <span>Cost: ${money(product.cost_price)}</span>
            </div>
          </td>
          <td>${escapeHtml(product.supplier || "None")}</td>
          <td>
            <div class="action-row">
              <button class="success-button" type="button" data-action="stock_in" data-id="${product.id}">In</button>
              <button class="warning-button" type="button" data-action="stock_out" data-id="${product.id}">Out</button>
              <button class="text-button" type="button" data-action="adjustment" data-id="${product.id}">Adjust</button>
              <button class="text-button" type="button" data-action="edit" data-id="${product.id}">Edit</button>
              <button class="danger-button" type="button" data-action="delete" data-id="${product.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  elements.emptyState.hidden = state.products.length > 0;
  updateSummary();
  updateCategories();
}

function renderMovements() {
  elements.movementsTable.innerHTML = state.movements
    .map((movement) => `
      <tr>
        <td>${dateTime(movement.created_at)}</td>
        <td>${escapeHtml(movement.product_name)}</td>
        <td>${movementLabel(movement.movement_type)}</td>
        <td>${movement.quantity}</td>
        <td>${movement.previous_quantity}</td>
        <td>${movement.new_quantity}</td>
        <td>${escapeHtml(movement.remarks || "None")}</td>
      </tr>
    `)
    .join("");

  elements.movementsEmptyState.hidden = state.movements.length > 0;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Request failed.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function loadProducts() {
  const filters = getFilters();
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);

  const data = await apiRequest(`/api/products?${params.toString()}`);
  state.products = data.products || [];
  renderProducts();
}

async function loadDashboard() {
  const data = await apiRequest("/api/dashboard");
  updateSummary(data.summary);
  state.movements = data.recentMovements || [];
  renderMovements();
}

async function refreshAll(message = "Inventory is up to date.") {
  setStatus("Loading inventory...");

  try {
    await loadProducts();
    await loadDashboard();
    setStatus(message);
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function saveProduct(event) {
  event.preventDefault();

  const payload = productPayload();
  const id = state.editingId;
  const url = id ? `/api/products/${id}` : "/api/products";
  const method = id ? "PUT" : "POST";

  elements.saveButton.disabled = true;
  setStatus(id ? "Updating product..." : "Adding product...");

  try {
    await apiRequest(url, {
      method,
      body: JSON.stringify(payload)
    });

    resetForm();
    await refreshAll(id ? "Product updated." : "Product added.");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    elements.saveButton.disabled = false;
  }
}

function editProduct(id) {
  const product = state.products.find((item) => String(item.id) === String(id));
  if (!product) return;

  state.editingId = product.id;
  elements.productId.value = product.id;
  elements.nameInput.value = product.name || "";
  elements.categoryInput.value = product.category || "";
  elements.skuInput.value = product.sku || "";
  elements.barcodeInput.value = product.barcode || "";
  elements.unitInput.value = product.unit || "pcs";
  elements.quantityInput.value = product.quantity || 0;
  elements.lowStockLimitInput.value = product.low_stock_limit || 5;
  elements.costPriceInput.value = product.cost_price || 0;
  elements.priceInput.value = product.price || 0;
  elements.supplierInput.value = product.supplier || "";
  elements.descriptionInput.value = product.description || "";
  elements.formTitle.textContent = "Edit Product";
  elements.saveButton.textContent = "Update Product";
  elements.nameInput.focus();
}

function openStockDialog(id, movementType) {
  const product = state.products.find((item) => String(item.id) === String(id));
  if (!product) return;

  elements.stockProductId.value = id;
  elements.stockMovementType.value = movementType;
  elements.stockQuantityInput.value = movementType === "adjustment" ? product.quantity : "1";
  elements.stockRemarksInput.value = "";
  elements.stockDialogTitle.textContent = `${movementLabel(movementType)}: ${product.name}`;
  elements.stockDialog.showModal();
  elements.stockQuantityInput.focus();
}

async function saveStock(event) {
  event.preventDefault();

  const id = elements.stockProductId.value;
  const movementType = elements.stockMovementType.value;

  elements.stockSaveButton.disabled = true;
  setStatus("Saving stock movement...");

  try {
    await apiRequest(`/api/products/${id}/stock`, {
      method: "POST",
      body: JSON.stringify({
        movementType,
        quantity: Number(elements.stockQuantityInput.value || 0),
        remarks: elements.stockRemarksInput.value.trim()
      })
    });

    elements.stockDialog.close();
    await refreshAll("Stock updated.");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    elements.stockSaveButton.disabled = false;
  }
}

async function deleteProduct(id) {
  const product = state.products.find((item) => String(item.id) === String(id));
  const name = product ? product.name : "this product";

  if (!window.confirm(`Delete ${name}? This also removes its stock movement history.`)) {
    return;
  }

  setStatus("Deleting product...");

  try {
    await apiRequest(`/api/products/${id}`, {
      method: "DELETE"
    });
    await refreshAll("Product deleted.");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

elements.productForm.addEventListener("submit", saveProduct);
elements.resetButton.addEventListener("click", resetForm);
elements.refreshButton.addEventListener("click", () => refreshAll());
elements.stockForm.addEventListener("submit", saveStock);
elements.stockCancelButton.addEventListener("click", () => elements.stockDialog.close());

elements.clearFiltersButton.addEventListener("click", () => {
  elements.searchInput.value = "";
  elements.categoryFilter.value = "";
  refreshAll();
});

elements.searchInput.addEventListener("input", () => {
  window.clearTimeout(elements.searchInput.searchTimer);
  elements.searchInput.searchTimer = window.setTimeout(refreshAll, 300);
});

elements.categoryFilter.addEventListener("change", () => refreshAll());

elements.productsTable.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "edit") editProduct(id);
  if (action === "delete") deleteProduct(id);
  if (["stock_in", "stock_out", "adjustment"].includes(action)) openStockDialog(id, action);
});

refreshAll();
