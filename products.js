const API_PRODUCTS = "https://68247ca60f0188d7e7297d7a.mockapi.io/people/gift_market";
const API_ORDERS = "https://68247ca60f0188d7e7297d7a.mockapi.io/people/gift_marke_massage";

let products = [];
let filteredProducts = [];
let soldByProductId = new Map();
let activeModalProduct = null;

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

const productModal = document.getElementById("productModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalTitle = document.getElementById("modalTitle");
const modalGallery = document.getElementById("modalGallery");
const modalId = document.getElementById("modalId");
const modalCategory = document.getElementById("modalCategory");
const modalPrice = document.getElementById("modalPrice");
const modalSale = document.getElementById("modalSale");
const modalSold = document.getElementById("modalSold");
const modalDateTime = document.getElementById("modalDateTime");
const modalAbout = document.getElementById("modalAbout");
const modalEditBtn = document.getElementById("modalEditBtn");
const modalDeleteBtn = document.getElementById("modalDeleteBtn");
const modalSaleBtn = document.getElementById("modalSaleBtn");

function pad2(n) {
  const s = String(n);
  return s.length === 1 ? "0" + s : s;
}

function nowLocalDateTimeText() {
  const d = new Date();
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

function parseAnyDateToParts(v) {
  if (!v) return { dateText: "-", dateTimeText: "-" };

  if (typeof v === "number") {
    const d = new Date(v * 1000);
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    return { dateText: `${y}.${m}.${day}`, dateTimeText: `${y}.${m}.${day} ${hh}:${mm}` };
  }

  const s = String(v).trim();

  const dtMatch = s.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})$/);
  if (dtMatch) return { dateText: `${dtMatch[1]}.${dtMatch[2]}.${dtMatch[3]}`, dateTimeText: s };

  const dMatch = s.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (dMatch) return { dateText: s, dateTimeText: s };

  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    return { dateText: `${y}.${m}.${day}`, dateTimeText: `${y}.${m}.${day} ${hh}:${mm}` };
  }

  return { dateText: s, dateTimeText: s };
}

function showStatus(message, type = "normal") {
  if (!message) {
    formStatus.innerHTML = "";
    return;
  }
  formStatus.innerHTML = type === "error"
    ? '<span class="error">' + message + "</span>"
    : '<span class="ok">' + message + "</span>";
}

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  const saleVal = saleFilter.value;

  filteredProducts = products.filter((p) => {
    if (q) {
      const text = (String(p.id || "") + " " + (p.name || "")).toLowerCase();
      if (!text.includes(q)) return false;
    }
    if (cat && p.category !== cat) return false;
    if (saleVal) {
      const boolVal = saleVal === "true";
      if (Boolean(p.sale) !== boolVal) return false;
    }
    return true;
  });
}

function safeFirstImg(p) {
  if (Array.isArray(p.img) && p.img.length) return p.img[0];
  if (typeof p.img === "string" && p.img.trim()) return p.img.trim();
  return "";
}

function soldCountOf(productId) {
  const k = String(productId);
  return soldByProductId.get(k) || 0;
}

function renderTable() {
  applyFilters();
  tbody.innerHTML = "";

  if (!filteredProducts.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 9;
    td.className = "empty-row";
    td.textContent = "Hozircha ma'lumot topilmadi.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    for (const p of filteredProducts) {
      const tr = document.createElement("tr");
      tr.className = "click-row";
      tr.addEventListener("click", (e) => {
        const t = e.target;
        if (t && (t.closest("button") || t.closest("a"))) return;
        openProductModal(p);
      });

      const tdId = document.createElement("td");
      tdId.innerHTML = '<span class="chip-id">#' + p.id + "</span>";
      tr.appendChild(tdId);

      const tdImg = document.createElement("td");
      tdImg.className = "img-cell";
      const imgUrl = safeFirstImg(p);
      tdImg.innerHTML = imgUrl
        ? `<img class="thumb" src="${imgUrl}" alt="">`
        : `<div class="thumb ph">—</div>`;
      tdImg.addEventListener("click", () => openProductModal(p));
      tr.appendChild(tdImg);

      const tdName = document.createElement("td");
      const aboutShort = (p.about || "").length > 36 ? p.about.slice(0, 36) + "..." : (p.about || "");
      tdName.innerHTML = `<div>${p.name || "-"}</div><div class="small">${aboutShort || "&nbsp;"}</div>`;
      tr.appendChild(tdName);

      const tdCategory = document.createElement("td");
      tdCategory.innerHTML = '<span class="badge-soft">' + (p.category || "-") + "</span>";
      tr.appendChild(tdCategory);

      const tdPrice = document.createElement("td");
      tdPrice.innerHTML = '<span class="price">' + (p.price ?? "-") + "</span>";
      tr.appendChild(tdPrice);

      const tdSale = document.createElement("td");
      const saleClass = p.sale ? "sale-true" : "sale-false";
      const saleText = p.sale ? "Chegirmada" : "Oddiy";
      const saleNumber = p.salenumber != null ? " · " + p.salenumber : "";
      tdSale.innerHTML = `<span class="tag-pill ${saleClass}">${p.sale ? "●" : "○"} ${saleText}${saleNumber}</span>`;
      tr.appendChild(tdSale);

      const tdSold = document.createElement("td");
      tdSold.innerHTML = `<span class="badge-soft mono">${soldCountOf(p.id)}</span>`;
      tr.appendChild(tdSold);

      const tdDate = document.createElement("td");
      tdDate.className = "small";
      tdDate.textContent = parseAnyDateToParts(p.date).dateText;
      tr.appendChild(tdDate);

      const tdActions = document.createElement("td");
      tdActions.style.textAlign = "right";

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "actions";

      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "btn-ghost";
      btnEdit.textContent = "✏️ Tahrirlash";
      btnEdit.onclick = (e) => {
        e.stopPropagation();
        fillFormForEdit(p);
      };
      actionsDiv.appendChild(btnEdit);

      const btnToggle = document.createElement("button");
      btnToggle.type = "button";
      btnToggle.className = "btn-ghost";
      btnToggle.textContent = p.sale ? "⬜ Sale OFF" : "✅ Sale ON";
      btnToggle.onclick = (e) => {
        e.stopPropagation();
        toggleSale(p);
      };
      actionsDiv.appendChild(btnToggle);

      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.className = "btn-ghost danger";
      btnDelete.textContent = "🗑 O‘chirish";
      btnDelete.onclick = (e) => {
        e.stopPropagation();
        deleteProduct(p.id);
      };
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
  imgInput.value = Array.isArray(p.img) ? p.img.join(", ") : (p.img || "");
  saleInput.checked = Boolean(p.sale);

  formTitle.textContent = "Tahrirlash";
  currentIdLabel.textContent = p.id;
  showStatus("Tahrirlash rejimi.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function fetchSoldCounts() {
  soldByProductId = new Map();
  try {
    const res = await fetch(API_ORDERS);
    if (!res.ok) return;
    const orders = await res.json();

    for (const o of orders) {
      const ids = Array.isArray(o.productID) ? o.productID : [];
      const counts = Array.isArray(o.productr_count) ? o.productr_count : [];

      for (let i = 0; i < ids.length; i++) {
        const id = String(ids[i]);
        const c = Number(counts[i] ?? 1);
        const add = Number.isFinite(c) && c > 0 ? c : 1;
        soldByProductId.set(id, (soldByProductId.get(id) || 0) + add);
      }
    }
  } catch {}
}

async function fetchProducts() {
  statInfoEl.textContent = "Yuklanmoqda...";
  try {
    await fetchSoldCounts();
    const res = await fetch(API_PRODUCTS);
    if (!res.ok) throw new Error("API xato: " + res.status);
    products = await res.json();
    renderTable();
    statInfoEl.textContent = "Yangilandi · " + new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  } catch (err) {
    console.error(err);
    statInfoEl.textContent = "Ma'lumotni yuklashda xatolik";
  }
}

async function saveProduct(event) {
  event.preventDefault();
  showStatus("Saqlanmoqda...", "normal");

  const id = productIdInput.value.trim();

  const imgArr = imgInput.value
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);

  const priceVal = priceInput.value === "" ? null : Number(priceInput.value);
  const saleNumVal = salenumberInput.value === "" ? null : Number(salenumberInput.value);

  const payload = {
    name: nameInput.value.trim(),
    about: aboutInput.value.trim(),
    price: priceVal,
    sale: saleInput.checked,
    salenumber: saleNumVal,
    category: categoryInput.value,
    img: imgArr
  };

  if (!id) payload.date = nowLocalDateTimeText();

  try {
    const res = await fetch(id ? (API_PRODUCTS + "/" + id) : API_PRODUCTS, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

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
    const res = await fetch(API_PRODUCTS + "/" + id, { method: "DELETE" });
    if (!res.ok) throw new Error("O‘chirish xatosi: " + res.status);
    if (productIdInput.value === String(id)) resetForm();
    closeProductModal();
    await fetchProducts();
    alert("O‘chirildi.");
  } catch (err) {
    console.error(err);
    alert("O‘chirishda xatolik: " + err.message);
  }
}

async function toggleSale(p) {
  try {
    const res = await fetch(API_PRODUCTS + "/" + p.id, {
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

function openProductModal(p) {
  activeModalProduct = p;

  modalTitle.textContent = p.name || "Mahsulot";
  modalId.textContent = "#" + p.id;
  modalCategory.textContent = p.category || "-";
  modalPrice.textContent = p.price ?? "-";
  modalSold.textContent = String(soldCountOf(p.id));

  const saleText = p.sale ? `Chegirmada${p.salenumber != null ? " · " + p.salenumber : ""}` : "Oddiy";
  modalSale.textContent = saleText;

  const parts = parseAnyDateToParts(p.date);
  modalDateTime.textContent = parts.dateTimeText;
  modalAbout.textContent = p.about || "-";

  modalGallery.innerHTML = "";
  const imgs = Array.isArray(p.img) ? p.img : (p.img ? [p.img] : []);
  if (!imgs.length) {
    modalGallery.innerHTML = `<div class="gallery-empty">Rasm yo‘q</div>`;
  } else {
    for (const u of imgs) {
      const img = document.createElement("img");
      img.src = u;
      img.alt = "";
      img.className = "gallery-img";
      modalGallery.appendChild(img);
    }
  }

  modalSaleBtn.textContent = p.sale ? "⬜ Sale OFF" : "✅ Sale ON";
  productModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeProductModal() {
  activeModalProduct = null;
  productModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

productModal.addEventListener("click", (e) => {
  const t = e.target;
  if (t && (t.dataset && t.dataset.close === "1")) closeProductModal();
});

modalCloseBtn.addEventListener("click", closeProductModal);

modalEditBtn.addEventListener("click", () => {
  if (!activeModalProduct) return;
  fillFormForEdit(activeModalProduct);
  closeProductModal();
});

modalDeleteBtn.addEventListener("click", () => {
  if (!activeModalProduct) return;
  deleteProduct(activeModalProduct.id);
});

modalSaleBtn.addEventListener("click", () => {
  if (!activeModalProduct) return;
  toggleSale(activeModalProduct);
});

btnNewProduct.addEventListener("click", () => {
  resetForm();
  nameInput.focus();
});

btnResetForm.addEventListener("click", () => resetForm());

productForm.addEventListener("submit", saveProduct);
searchInput.addEventListener("input", renderTable);
categoryFilter.addEventListener("change", renderTable);
saleFilter.addEventListener("change", renderTable);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !productModal.classList.contains("hidden")) closeProductModal();
});

fetchProducts();