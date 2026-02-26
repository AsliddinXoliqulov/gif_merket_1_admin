const API_ORDERS = "https://68247ca60f0188d7e7297d7a.mockapi.io/people/gift_marke_massage";

let orders = [];
let activeTab = 1;

const ordersList = document.getElementById("ordersList");
const ordersInfo = document.getElementById("ordersInfo");
const btnReloadOrders = document.getElementById("btnReloadOrders");
const tabBtns = Array.from(document.querySelectorAll(".tab-btn"));

const mapModal = document.getElementById("mapModal");
const mapCloseBtn = document.getElementById("mapCloseBtn");
const mapText = document.getElementById("mapText");

let mapInstance = null;
let mapMarker = null;

function fmtDelivery(v) {
  return v ? "🚚 Yetkazib beriladi" : "🏃 O‘zi olib ketadi";
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function parseLatLng(mapStr) {
  if (!mapStr) return null;
  const s = String(mapStr).trim();
  const m = s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, raw: s };
}

function statusName(st) {
  const n = Number(st);
  if (n === 1) return "Yangi";
  if (n === 2) return "Jarayonda";
  if (n === 3) return "Yakunlangan";
  return String(st ?? "-");
}

function firstImg(o) {
  const imgs = safeArr(o.image);
  return imgs.length ? String(imgs[0]) : "";
}

function orderCard(o) {
  const ids = safeArr(o.productID);
  const names = safeArr(o.name);
  const prices = safeArr(o.price);
  const counts = safeArr(o.productr_count);

  let itemsHtml = "";
  const maxLen = Math.max(ids.length, names.length, prices.length, counts.length);

  for (let i = 0; i < maxLen; i++) {
    const pid = ids[i] ?? "-";
    const nm = names[i] ?? "-";
    const pr = prices[i] ?? "-";
    const ct = counts[i] ?? 1;

    itemsHtml += `
      <div class="order-item">
        <div class="mono">#${pid}</div>
        <div class="order-item-main">
          <div class="order-item-name">${nm}</div>
          <div class="small">Narx: <span class="price">${pr}</span> · Soni: <span class="badge-soft mono">${ct}</span></div>
        </div>
      </div>
    `;
  }

  const st = Number(o.status ?? 1);

  const nextBtn =
    st === 1
      ? `<button class="btn-primary order-action" data-act="to2" data-id="${o.id}" type="button">➡️ Status 2</button>`
      : st === 2
      ? `<button class="btn-primary order-action" data-act="to3" data-id="${o.id}" type="button">✅ Status 3</button>`
      : `<span class="badge-soft mono">Yakunlangan</span>`;

  const mapBtn = `<button class="btn-secondary order-action" data-act="map" data-id="${o.id}" type="button">📍 Xarita</button>`;
  const delBtn = `<button class="btn-danger order-action" data-act="del" data-id="${o.id}" type="button">🗑 O‘chirish</button>`;

  const img0 = firstImg(o);
  const imgCount = safeArr(o.image).length;

  const imageHtml = img0
    ? `
      <div class="order-image">
        <img src="${img0}" alt="order image" loading="lazy" />
        ${imgCount > 1 ? `<div class="badge-soft mono">+${imgCount - 1}</div>` : ``}
      </div>
    `
    : `<div class="order-image empty"><div class="small">Rasm yo‘q</div></div>`;

  return `
    <div class="order-card">
      <div class="order-head">
        <div>
          <div class="order-title">Buyurtma #<span class="mono">${o.id}</span> · <span class="badge-soft">${statusName(st)}</span></div>
          <div class="small">📞 ${o.user_phone ?? "-"} · ${fmtDelivery(Boolean(o.deliver))}</div>
        </div>
        <div class="order-right">
          <div class="small">Jami: <span class="price">${o.total_price ?? "-"}</span></div>
          <div class="small">Sana: <span class="mono">${o.date ?? "-"}</span></div>
        </div>
      </div>

      <div class="order-body">
        ${imageHtml}

        <div class="order-items">${itemsHtml || `<div class="small">Mahsulotlar yo‘q</div>`}</div>

        <div class="order-meta">
          <div class="small"><b>Manzil:</b> ${o.address ?? "-"}</div>
          <div class="small"><b>Xabar:</b> ${o.massage ?? "-"}</div>
          <div class="order-actions-row">
            ${mapBtn}
            ${delBtn}
            ${nextBtn}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderOrders() {
  const list = orders.filter(o => Number(o.status ?? 1) === activeTab);

  ordersList.innerHTML = list.length
    ? list.map(orderCard).join("")
    : `<div class="empty-row">Hozircha buyurtma yo‘q.</div>`;

  const c1 = orders.filter(o => Number(o.status ?? 1) === 1).length;
  const c2 = orders.filter(o => Number(o.status ?? 1) === 2).length;
  const c3 = orders.filter(o => Number(o.status ?? 1) === 3).length;

  ordersInfo.textContent = `1: ${c1} ta · 2: ${c2} ta · 3: ${c3} ta · jami: ${orders.length} ta`;
}

async function fetchOrders() {
  ordersInfo.textContent = "Yuklanmoqda...";
  try {
    const res = await fetch(API_ORDERS);
    if (!res.ok) throw new Error(res.status);
    orders = await res.json();
    renderOrders();
  } catch (e) {
    console.error(e);
    ordersInfo.textContent = "Yuklashda xatolik";
  }
}

async function updateStatus(orderId, newStatus) {
  try {
    const res = await fetch(API_ORDERS + "/" + orderId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error("status xato");
    await fetchOrders();
  } catch (e) {
    console.error(e);
    alert("Status o‘zgartirishda xatolik");
  }
}

async function deleteOrder(orderId) {
  if (!confirm("Buyurtmani o‘chirasizmi?")) return;
  try {
    const res = await fetch(API_ORDERS + "/" + orderId, { method: "DELETE" });
    if (!res.ok) throw new Error("delete xato");
    await fetchOrders();
  } catch (e) {
    console.error(e);
    alert("O‘chirishda xatolik");
  }
}

function openMapModal(orderId) {
  const o = orders.find(x => String(x.id) === String(orderId));
  if (!o) return;

  const parsed = parseLatLng(o.map);
  mapText.textContent = o.map ? String(o.map) : "Map yo‘q";

  mapModal.classList.remove("hidden");
  document.body.classList.add("modal-open");

  setTimeout(() => {
    const box = document.getElementById("leafletMap");
    if (!box) return;

    if (!mapInstance) {
      mapInstance = L.map("leafletMap");
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(mapInstance);
    }

    let lat = 41.3111;
    let lng = 69.2797;

    if (parsed) {
      lat = parsed.lat;
      lng = parsed.lng;
    }

    mapInstance.setView([lat, lng], parsed ? 15 : 11);

    if (mapMarker) mapMarker.remove();
    mapMarker = L.marker([lat, lng]).addTo(mapInstance);

    setTimeout(() => {
      try { mapInstance.invalidateSize(); } catch (_) {}
    }, 50);
  }, 50);
}

function closeMapModal() {
  mapModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

if (mapModal) {
  mapModal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.dataset && t.dataset.close === "1") closeMapModal();
  });
}
if (mapCloseBtn) {
  mapCloseBtn.addEventListener("click", closeMapModal);
}

if (ordersList) {
  ordersList.addEventListener("click", (e) => {
    const btn = e.target.closest(".order-action");
    if (!btn) return;

    const act = btn.dataset.act;
    const id = btn.dataset.id;

    if (act === "to2") updateStatus(id, 2);
    if (act === "to3") updateStatus(id, 3);
    if (act === "map") openMapModal(id);
    if (act === "del") deleteOrder(id);
  });
}

tabBtns.forEach(b => {
  b.addEventListener("click", () => {
    tabBtns.forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    activeTab = Number(b.dataset.tab);
    renderOrders();
  });
});

if (btnReloadOrders) {
  btnReloadOrders.addEventListener("click", fetchOrders);
}

fetchOrders();