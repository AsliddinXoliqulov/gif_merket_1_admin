const API_URL = "https://68247ca60f0188d7e7297d7a.mockapi.io/people/gift_market";

let products = [];
let filteredProducts = [];

const tbody = document.getElementById("productsTableBody");
const totalCountEl = document.getElementById("totalCount");
const statInfoEl = document.getElementById("statInfo");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const saleFilter = document.getElementById("saleFilter");

const productForm = document.getElementById("productForm");
const productIdInput = document.getElementById("productId");
const nameInput = document.getElementById("nameInput");
const priceInput = document.getElementById("priceInput");
const categoryInput = document.getElementById("categoryInput");
const salenumberInput = document.getElementById("salenumberInput");
const aboutInput = document.getElementById("aboutInput");
const imgInput = document.getElementById("imgInput");
const saleInput = document.getElementById("saleInput");
const formStatus = document.getElementById("formStatus");
const formTitle = document.getElementById("formTitle");
const currentIdLabel = document.getElementById("currentIdLabel");
const btnNewProduct = document.getElementById("btnNewProduct");
const btnResetForm = document.getElementById("btnResetForm");

function formatDateFromUnix(timestamp) {
  if (!timestamp) return "-";
  try {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  } catch {
    return "-";
  }
}

function showStatus(message, type = "normal") {
  if (!message) {
    formStatus.innerHTML = "";
    return;
  }
  if (type === "error") {
    formStatus.innerHTML = '<span class="error">' + message + "</span>";
  } else {
    formStatus.innerHTML = '<span class="ok">' + message + "</span>";
  }
}

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  const saleVal = saleFilter.value;

  filteredProducts = products.filter((p) => {
    if (q) {
      const text = (p.name || "") + " " + (p.about || "");
      if (!text.toLowerCase().includes(q)) return false;
    }
    if (cat && p.category !== cat) return false;
    if (saleVal) {
      const boolVal = saleVal === "true";
      if (Boolean(p.sale) !== boolVal) return false;
    }
    return true;
  });
}

function renderTable() {
  applyFilters();
  tbody.innerHTML = "";

  if (!filteredProducts.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "empty-row";
    td.textContent = "Hozircha ma'lumot topilmadi.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    for (const p of filteredProducts) {
      const tr = document.createElement("tr");

      const tdId = document.createElement("td");
      tdId.innerHTML = '<span class="chip-id">#' + p.id + "</span>";
      tr.appendChild(tdId);

      const tdName = document.createElement("td");
      const aboutShort = (p.about || "").length > 36
        ? p.about.slice(0, 36) + "..."
        : (p.about || "");
      tdName.innerHTML =
        '<div>' + (p.name || "-") + '</div>' +
        '<div class="small">' + (aboutShort || "&nbsp;") + "</div>";
      tr.appendChild(tdName);

      const tdCategory = document.createElement("td");
      tdCategory.innerHTML =
        '<span class="badge-soft">' + (p.category || "-") + "</span>";
      tr.appendChild(tdCategory);

      const tdPrice = document.createElement("td");
      tdPrice.innerHTML =
        '<span class="price">' + (p.price ?? "-") + "</span>";
      tr.appendChild(tdPrice);

      const tdSale = document.createElement("td");
      const saleClass = p.sale ? "sale-true" : "sale-false";
      const saleText = p.sale ? "Chegirmada" : "Oddiy";
      const saleNumber = p.salenumber != null ? " · " + p.salenumber : "";
      tdSale.innerHTML =
        '<span class="tag-pill ' + saleClass + '">' +
        (p.sale ? "●" : "○") +
        ' ' + saleText + saleNumber +
        "</span>";
      tr.appendChild(tdSale);

      const tdDate = document.createElement("td");
      tdDate.className = "small";
      tdDate.textContent = formatDateFromUnix(p.date);
      tr.appendChild(tdDate);

      const tdActions = document.createElement("td");
      tdActions.style.textAlign = "right";

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "actions";

      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "btn-ghost";
      btnEdit.textContent = "✏️ Tahrirlash";
      btnEdit.onclick = () => fillFormForEdit(p);
      actionsDiv.appendChild(btnEdit);

      const btnToggle = document.createElement("button");
      btnToggle.type = "button";
      btnToggle.className = "btn-ghost";
      btnToggle.textContent = p.sale ? "⬜ Sale OFF" : "✅ Sale ON";
      btnToggle.onclick = () => toggleSale(p);
      actionsDiv.appendChild(btnToggle);

      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.className = "btn-ghost danger";
      btnDelete.textContent = "🗑 O‘chirish";
      btnDelete.onclick = () => deleteProduct(p.id);
      actionsDiv.appendChild(btnDelete);

      tdActions.appendChild(actionsDiv);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    }
  }

  totalCountEl.textContent = products.length + " ta";
  const saleCount = products.filter(p => p.sale).length;
  statInfoEl.textContent = saleCount + " ta chegirmada · " + products.length + " ta jami";
}

function resetForm() {
  productIdInput.value = "";
  nameInput.value = "";
  priceInput.value = "";
  categoryInput.value = "";
  salenumberInput.value = "";
  aboutInput.value = "";
  imgInput.value = "";
  saleInput.checked = false;
  formTitle.textContent = "Yangi mahsulot";
  currentIdLabel.textContent = "Yangi";
  showStatus("");
}

function fillFormForEdit(p) {
  productIdInput.value = p.id;
  nameInput.value = p.name || "";
  priceInput.value = p.price ?? "";
  categoryInput.value = p.category || "";
  salenumberInput.value = p.salenumber ?? "";
  aboutInput.value = p.about || "";
  imgInput.value = Array.isArray(p.img) ? p.img.join(", ") : "";
  saleInput.checked = Boolean(p.sale);

  formTitle.textContent = "Tahrirlash";
  currentIdLabel.textContent = p.id;
  showStatus("Tahrirlash rejimi.");
}

async function fetchProducts() {
  statInfoEl.textContent = "Yuklanmoqda...";
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("API xato: " + res.status);
    products = await res.json();
    renderTable();
    statInfoEl.textContent = "Yangilandi · " + new Date().toLocaleTimeString("uz-UZ");
  } catch (err) {
    console.error(err);
    statInfoEl.textContent = "Ma'lumotni yuklashda xatolik";
  }
}

async function saveProduct(event) {
  event.preventDefault();
  showStatus("Saqlanmoqda...", "normal");

  const id = productIdInput.value;
  const nowUnix = Math.floor(Date.now() / 1000);

  const imgArr = imgInput.value
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);

  const payload = {
    name: nameInput.value.trim(),
    about: aboutInput.value.trim(),
    price: Number(priceInput.value),
    sale: saleInput.checked,
    salenumber: salenumberInput.value === "" ? null : Number(salenumberInput.value),
    date: id ? undefined : nowUnix,
    category: categoryInput.value,
    img: imgArr
  };

  try {
    let res;
    if (id) {
      res = await fetch(API_URL + "/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) throw new Error("Saqlash xatosi: " + res.status);

    showStatus("Muvaffaqiyatli saqlandi ✅", "normal");
    await fetchProducts();
    if (!id) resetForm();
  } catch (err) {
    console.error(err);
    showStatus("Saqlashda xatolik: " + err.message, "error");
  }
}

async function deleteProduct(id) {
  if (!confirm("Rostdan ham o‘chirmoqchimisiz? (ID: " + id + ")")) return;

  try {
    const res = await fetch(API_URL + "/" + id, { method: "DELETE" });
    if (!res.ok) throw new Error("O‘chirish xatosi: " + res.status);
    if (productIdInput.value === String(id)) resetForm();
    await fetchProducts();
    alert("O‘chirildi.");
  } catch (err) {
    console.error(err);
    alert("O‘chirishda xatolik: " + err.message);
  }
}

async function toggleSale(p) {
  try {
    const res = await fetch(API_URL + "/" + p.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sale: !p.sale })
    });
    if (!res.ok) throw new Error("Sale holatini o‘zgartirish xatosi");
    await fetchProducts();
  } catch (err) {
    console.error(err);
    alert("Xatolik: " + err.message);
  }
}

btnNewProduct.addEventListener("click", () => {
  resetForm();
  nameInput.focus();
});

btnResetForm.addEventListener("click", () => {
  resetForm();
});

productForm.addEventListener("submit", saveProduct);
searchInput.addEventListener("input", renderTable);
categoryFilter.addEventListener("change", renderTable);
saleFilter.addEventListener("change", renderTable);

fetchProducts();