const state = {
  products: [],
  movements: [],
  orders: [],
  editingId: null,
  token: window.localStorage.getItem("petshopToken") || "",
  user: JSON.parse(window.localStorage.getItem("petshopUser") || "null")
};

const elements = {
  loginView: document.querySelector("#loginView"),
  appView: document.querySelector("#appView"),
  sessionBar: document.querySelector("#sessionBar"),
  currentUser: document.querySelector("#currentUser"),
  currentRole: document.querySelector("#currentRole"),
  loginForm: document.querySelector("#loginForm"),
  usernameInput: document.querySelector("#usernameInput"),
  passwordInput: document.querySelector("#passwordInput"),
  loginButton: document.querySelector("#loginButton"),
  loginStatus: document.querySelector("#loginStatus"),
  logoutButton: document.querySelector("#logoutButton"),
  refreshButton: document.querySelector("#refreshButton"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  categoryOptions: document.querySelector("#categoryOptions"),
  clearFiltersButton: document.querySelector("#clearFiltersButton"),
  actionsHeader: document.querySelector("#actionsHeader"),
  stockHeader: document.querySelector("#stockHeader"),
  priceHeader: document.querySelector("#priceHeader"),
  supplierHeader: document.querySelector("#supplierHeader"),
  productsTable: document.querySelector("#productsTable"),
  emptyState: document.querySelector("#emptyState"),
  movementsTable: document.querySelector("#movementsTable"),
  movementsEmptyState: document.querySelector("#movementsEmptyState"),
  ordersPanel: document.querySelector("#ordersPanel"),
  ordersEyebrow: document.querySelector("#ordersEyebrow"),
  ordersTitle: document.querySelector("#ordersTitle"),
  ordersTable: document.querySelector("#ordersTable"),
  ordersEmptyState: document.querySelector("#ordersEmptyState"),
  orderCustomerHeader: document.querySelector("#orderCustomerHeader"),
  orderActionHeader: document.querySelector("#orderActionHeader"),
  historyPanel: document.querySelector("#historyPanel"),
  totalProductsMetric: document.querySelector("#totalProductsMetric"),
  totalStockMetric: document.querySelector("#totalStockMetric"),
  lowStockMetric: document.querySelector("#lowStockMetric"),
  inventoryValueMetric: document.querySelector("#inventoryValueMetric"),
  totalProductsLabel: document.querySelector("#totalProductsLabel"),
  totalStockLabel: document.querySelector("#totalStockLabel"),
  lowStockLabel: document.querySelector("#lowStockLabel"),
  inventoryValueLabel: document.querySelector("#inventoryValueLabel"),
  totalProducts: document.querySelector("#totalProducts"),
  totalStock: document.querySelector("#totalStock"),
  lowStock: document.querySelector("#lowStock"),
  inventoryValue: document.querySelector("#inventoryValue"),
  statusLine: document.querySelector("#statusLine"),
  productForm: document.querySelector("#productForm"),
  productFormPanel: document.querySelector("#productFormPanel"),
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
  stockDialogEyebrow: document.querySelector("#stockDialogEyebrow"),
  stockDialogTitle: document.querySelector("#stockDialogTitle"),
  stockProductId: document.querySelector("#stockProductId"),
  stockMovementType: document.querySelector("#stockMovementType"),
  stockQuantityInput: document.querySelector("#stockQuantityInput"),
  paymentOptions: document.querySelector("#paymentOptions"),
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

function paymentLabel(value) {
  return value === "gcash" ? "GCash" : "Cash on Delivery";
}

function statusLabel(value) {
  const labels = {
    pending: "Pending",
    preparing: "Preparing",
    completed: "Completed",
    cancelled: "Cancelled"
  };

  return labels[value] || value;
}

function setStatus(message, type = "info") {
  elements.statusLine.textContent = message;
  elements.statusLine.classList.toggle("error", type === "error");
}

function formatReminderDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila"
  }).format(new Date(`${value}T00:00:00+08:00`));
}

function purchaseInsightMessage(insight) {
  if (!insight) return "Order placed.";

  const suggestions = Array.isArray(insight.suggestions) && insight.suggestions.length
    ? ` Suggested next: ${insight.suggestions.join(", ")}.`
    : "";
  const date = formatReminderDate(insight.reminderDate);
  const reminder = date ? `${insight.reminder} around ${date}.` : `${insight.reminder}.`;

  return `Order placed. Reminder: ${reminder}${suggestions}`;
}

function setLoginStatus(message, type = "info") {
  elements.loginStatus.textContent = message;
  elements.loginStatus.classList.toggle("error", type === "error");
}

function isAdmin() {
  return state.user && state.user.role === "admin";
}

function isCustomer() {
  return state.user && state.user.role === "user";
}

function canSell() {
  return state.user && ["admin", "user"].includes(state.user.role);
}

function setSession(token, user) {
  state.token = token;
  state.user = user;
  window.localStorage.setItem("petshopToken", token);
  window.localStorage.setItem("petshopUser", JSON.stringify(user));
}

function clearSession() {
  state.token = "";
  state.user = null;
  window.localStorage.removeItem("petshopToken");
  window.localStorage.removeItem("petshopUser");
}

function applyRoleUi() {
  const signedIn = Boolean(state.user);

  elements.loginView.hidden = signedIn;
  elements.appView.hidden = !signedIn;
  elements.sessionBar.hidden = !signedIn;

  if (!signedIn) {
    document.body.classList.remove("customer-view");
    return;
  }

  elements.currentUser.textContent = state.user.username;
  elements.currentRole.textContent = state.user.role;
  document.body.classList.toggle("customer-view", isCustomer());
  elements.productFormPanel.hidden = !isAdmin();
  elements.historyPanel.hidden = !isAdmin();
  elements.ordersEyebrow.textContent = isAdmin() ? "Customer Orders" : "Orders";
  elements.ordersTitle.textContent = isAdmin() ? "Incoming Orders" : "My Orders";
  elements.orderCustomerHeader.hidden = !isAdmin();
  elements.orderActionHeader.hidden = !isAdmin();
  elements.actionsHeader.textContent = isAdmin() ? "Actions" : "Buy";
  elements.stockHeader.textContent = isAdmin() ? "Stock" : "Available Qty";
  elements.priceHeader.textContent = isAdmin() ? "Selling Price" : "Price";
  elements.supplierHeader.hidden = !isAdmin();
  elements.searchInput.placeholder = isAdmin() ? "Name, SKU, barcode, supplier" : "Search pet food, toys, grooming";
  elements.totalProductsLabel.textContent = isAdmin() ? "Products" : "Products";
  elements.totalStockLabel.textContent = isAdmin() ? "Total Stock" : "Available Items";
  elements.lowStockMetric.hidden = !isAdmin();
  elements.inventoryValueMetric.hidden = !isAdmin();

  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    element.hidden = !isAdmin();
  });
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
  if (isCustomer()) {
    const available = summary
      ? Number(summary.available_products || 0)
      : state.products.filter((product) => product.in_stock).length;

    elements.totalProducts.textContent = String(summary ? summary.total_products || 0 : state.products.length);
    elements.totalStock.textContent = String(available);
    elements.lowStock.textContent = "";
    elements.inventoryValue.textContent = "";
    return;
  }

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
    stock_out: isAdmin() ? "Stock Out" : "Purchase",
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
      const isInStock = isAdmin() ? quantity > 0 : Number(product.quantity || 0) > 0;
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
          <td>
            ${isAdmin()
              ? `<span class="${stockClass}">${quantity} ${escapeHtml(product.unit || "pcs")}</span>`
              : `<span class="stock-pill ${isInStock ? "" : "low"}">${quantity} ${escapeHtml(product.unit || "pcs")}</span>`
            }
          </td>
          <td>
            <div class="price-cell">
              <strong>${money(product.price)}</strong>
              ${isAdmin() ? `<span>Cost: ${money(product.cost_price)}</span>` : ""}
            </div>
          </td>
          ${isAdmin() ? `<td>${escapeHtml(product.supplier || "None")}</td>` : ""}
          ${canSell() ? `
            <td>
              <div class="action-row">
                ${isAdmin() ? `
                  <button class="success-button" type="button" data-action="stock_in" data-id="${product.id}">In</button>
                  <button class="warning-button" type="button" data-action="stock_out" data-id="${product.id}">Out</button>
                  <button class="text-button" type="button" data-action="adjustment" data-id="${product.id}">Adjust</button>
                  <button class="text-button" type="button" data-action="edit" data-id="${product.id}">Edit</button>
                  <button class="danger-button" type="button" data-action="delete" data-id="${product.id}">Delete</button>
                ` : `
                  <button class="primary-button compact-button" type="button" data-action="stock_out" data-id="${product.id}" ${!isInStock ? "disabled" : ""}>Buy</button>
                `}
              </div>
            </td>
          ` : ""}
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

function renderOrders() {
  elements.ordersTable.innerHTML = state.orders
    .map((order) => `
      <tr>
        ${isAdmin() ? `<td>${escapeHtml(order.username || "Customer")}</td>` : ""}
        <td>${dateTime(order.created_at)}</td>
        <td>${escapeHtml(order.product_name)}</td>
        <td>${order.quantity}</td>
        <td>${money(order.total_amount)}</td>
        <td>${paymentLabel(order.payment_method)}</td>
        <td><span class="status-pill ${escapeHtml(order.status)}">${statusLabel(order.status)}</span></td>
        ${isAdmin() ? `
          <td>
            <select class="status-select" data-order-id="${order.id}">
              ${["pending", "preparing", "completed", "cancelled"].map((status) => `
                <option value="${status}" ${order.status === status ? "selected" : ""}>${statusLabel(status)}</option>
              `).join("")}
            </select>
          </td>
        ` : ""}
      </tr>
    `)
    .join("");

  elements.ordersEmptyState.hidden = state.orders.length > 0;
}

async function apiRequest(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    if (response.status === 401 && url !== "/api/auth/login") {
      showLogin();
    }
    throw new Error(errorBody.message || "Request failed.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function showLogin(message = "Please log in to continue.", type = "error") {
  clearSession();
  state.products = [];
  state.movements = [];
  resetForm();
  applyRoleUi();
  setLoginStatus(message, type);
  elements.passwordInput.value = "";
  elements.usernameInput.focus();
}

async function login(event) {
  event.preventDefault();

  elements.loginButton.disabled = true;
  setLoginStatus("Logging in...");

  try {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: elements.usernameInput.value.trim(),
        password: elements.passwordInput.value
      })
    });

    setSession(data.token, data.user);
    elements.loginForm.reset();
    setLoginStatus("");
    applyRoleUi();
    await refreshAll(`Logged in as ${data.user.role}.`);
  } catch (error) {
    setLoginStatus(error.message, "error");
  } finally {
    elements.loginButton.disabled = false;
  }
}

async function logout() {
  try {
    if (state.token) {
      await apiRequest("/api/auth/logout", {
        method: "POST"
      });
    }
  } catch (error) {
    // The local session should still be cleared if the server already forgot it.
  } finally {
    showLogin("Logged out.", "info");
  }
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

async function loadOrders() {
  const data = await apiRequest("/api/orders");
  state.orders = data.orders || [];
  renderOrders();
}

async function refreshAll(message = "Inventory is up to date.") {
  setStatus("Loading inventory...");

  try {
    await loadProducts();
    await loadDashboard();
    await loadOrders();
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

  const customerPurchase = movementType === "stock_out" && !isAdmin();
  elements.stockProductId.value = id;
  elements.stockMovementType.value = movementType;
  elements.stockQuantityInput.value = movementType === "adjustment" ? product.quantity : "1";
  elements.stockRemarksInput.value = customerPurchase ? "Customer purchase" : "";
  elements.stockDialogEyebrow.textContent = customerPurchase ? "Checkout" : "Stock Control";
  elements.stockDialogTitle.textContent = customerPurchase ? product.name : `${movementLabel(movementType)}: ${product.name}`;
  elements.stockQuantityInput.closest(".field").querySelector("span").textContent = customerPurchase ? "Quantity to Buy" : "Quantity";
  elements.paymentOptions.hidden = !customerPurchase;
  elements.stockRemarksInput.closest(".field").hidden = customerPurchase;
  elements.stockSaveButton.textContent = customerPurchase ? "Buy" : "Save Stock";
  elements.stockDialog.showModal();
  elements.stockQuantityInput.focus();
}

async function saveStock(event) {
  event.preventDefault();

  const id = elements.stockProductId.value;
  const movementType = elements.stockMovementType.value;
  const customerPurchase = movementType === "stock_out" && !isAdmin();
  const paymentMethod = document.querySelector("input[name='paymentMethod']:checked")?.value || "gcash";

  elements.stockSaveButton.disabled = true;
  setStatus(customerPurchase ? "Placing order..." : "Saving stock movement...");

  try {
    const data = customerPurchase
      ? await apiRequest("/api/orders", {
          method: "POST",
          body: JSON.stringify({
            productId: Number(id),
            quantity: Number(elements.stockQuantityInput.value || 0),
            paymentMethod
          })
        })
      : await apiRequest(`/api/products/${id}/stock`, {
          method: "POST",
          body: JSON.stringify({
            movementType,
            quantity: Number(elements.stockQuantityInput.value || 0),
            remarks: elements.stockRemarksInput.value.trim()
          })
        });

    elements.stockDialog.close();
    await refreshAll(
      customerPurchase
        ? `${purchaseInsightMessage(data.purchaseInsight)} Admin will process your ${paymentLabel(paymentMethod)} order.`
        : "Stock updated."
    );
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

elements.loginForm.addEventListener("submit", login);
elements.logoutButton.addEventListener("click", logout);
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

  if (!isAdmin() && action !== "stock_out") return;

  if (action === "edit") editProduct(id);
  if (action === "delete") deleteProduct(id);
  if (["stock_in", "stock_out", "adjustment"].includes(action)) openStockDialog(id, action);
});

elements.ordersTable.addEventListener("change", async (event) => {
  const select = event.target.closest("select[data-order-id]");
  if (!select || !isAdmin()) return;

  select.disabled = true;
  setStatus("Updating order...");

  try {
    await apiRequest(`/api/orders/${select.dataset.orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status: select.value
      })
    });
    await loadOrders();
    setStatus("Order updated.");
  } catch (error) {
    setStatus(error.message, "error");
    await loadOrders();
  } finally {
    select.disabled = false;
  }
});

async function initialize() {
  applyRoleUi();

  if (!state.token || !state.user) {
    showLogin("Log in to view inventory.", "info");
    return;
  }

  try {
    const data = await apiRequest("/api/auth/me");
    state.user = data.user;
    window.localStorage.setItem("petshopUser", JSON.stringify(data.user));
    applyRoleUi();
    await refreshAll();
  } catch (error) {
    showLogin(error.message);
  }
}

initialize();
