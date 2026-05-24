const state = {
  products: [],
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
  totalProducts: document.querySelector("#totalProducts"),
  totalStock: document.querySelector("#totalStock"),
  lowStock: document.querySelector("#lowStock"),
  statusLine: document.querySelector("#statusLine"),
  productForm: document.querySelector("#productForm"),
  productId: document.querySelector("#productId"),
  formTitle: document.querySelector("#formTitle"),
  nameInput: document.querySelector("#nameInput"),
  categoryInput: document.querySelector("#categoryInput"),
  quantityInput: document.querySelector("#quantityInput"),
  priceInput: document.querySelector("#priceInput"),
  supplierInput: document.querySelector("#supplierInput"),
  descriptionInput: document.querySelector("#descriptionInput"),
  saveButton: document.querySelector("#saveButton"),
  resetButton: document.querySelector("#resetButton")
};

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(value || 0));
}

function setStatus(message, type = "info") {
  elements.statusLine.textContent = message;
  elements.statusLine.classList.toggle("error", type === "error");
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
    quantity: Number(elements.quantityInput.value || 0),
    price: Number(elements.priceInput.value || 0),
    supplier: elements.supplierInput.value.trim(),
    description: elements.descriptionInput.value.trim()
  };
}

function resetForm() {
  state.editingId = null;
  elements.productForm.reset();
  elements.productId.value = "";
  elements.quantityInput.value = "0";
  elements.priceInput.value = "0";
  elements.formTitle.textContent = "Add Product";
  elements.saveButton.textContent = "Save Product";
}

function updateSummary() {
  const totalStock = state.products.reduce((sum, product) => sum + Number(product.quantity || 0), 0);
  const lowStock = state.products.filter((product) => Number(product.quantity || 0) <= 5).length;

  elements.totalProducts.textContent = String(state.products.length);
  elements.totalStock.textContent = String(totalStock);
  elements.lowStock.textContent = String(lowStock);
}

function updateCategories() {
  const categories = [...new Set(state.products.map((product) => product.category).filter(Boolean))].sort();

  elements.categoryOptions.innerHTML = categories
    .map((category) => `<option value="${escapeHtml(category)}"></option>`)
    .join("");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderProducts() {
  elements.productsTable.innerHTML = state.products
    .map((product) => {
      const quantity = Number(product.quantity || 0);
      const stockClass = quantity <= 5 ? "stock-pill low" : "stock-pill";

      return `
        <tr>
          <td>
            <div class="product-name">
              <strong>${escapeHtml(product.name)}</strong>
              <span>${escapeHtml(product.description || "No description")}</span>
            </div>
          </td>
          <td>${escapeHtml(product.category)}</td>
          <td><span class="${stockClass}">${quantity}</span></td>
          <td>${money(product.price)}</td>
          <td>${escapeHtml(product.supplier || "None")}</td>
          <td>
            <div class="action-row">
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

  setStatus("Loading products...");

  try {
    const data = await apiRequest(`/api/products?${params.toString()}`);
    state.products = data.products || [];
    renderProducts();
    setStatus("Inventory is up to date.");
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
    await loadProducts();
    setStatus(id ? "Product updated." : "Product added.");
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
  elements.quantityInput.value = product.quantity || 0;
  elements.priceInput.value = product.price || 0;
  elements.supplierInput.value = product.supplier || "";
  elements.descriptionInput.value = product.description || "";
  elements.formTitle.textContent = "Edit Product";
  elements.saveButton.textContent = "Update Product";
  elements.nameInput.focus();
}

async function deleteProduct(id) {
  const product = state.products.find((item) => String(item.id) === String(id));
  const name = product ? product.name : "this product";

  if (!window.confirm(`Delete ${name}?`)) {
    return;
  }

  setStatus("Deleting product...");

  try {
    await apiRequest(`/api/products/${id}`, {
      method: "DELETE"
    });
    await loadProducts();
    setStatus("Product deleted.");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

elements.productForm.addEventListener("submit", saveProduct);
elements.resetButton.addEventListener("click", resetForm);
elements.refreshButton.addEventListener("click", loadProducts);
elements.clearFiltersButton.addEventListener("click", () => {
  elements.searchInput.value = "";
  elements.categoryFilter.value = "";
  loadProducts();
});

elements.searchInput.addEventListener("input", () => {
  window.clearTimeout(elements.searchInput.searchTimer);
  elements.searchInput.searchTimer = window.setTimeout(loadProducts, 300);
});

elements.categoryFilter.addEventListener("change", loadProducts);

elements.productsTable.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "edit") editProduct(id);
  if (action === "delete") deleteProduct(id);
});

loadProducts();
