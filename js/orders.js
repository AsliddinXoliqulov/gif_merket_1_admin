const API_ORDERS = "https://68247ca60f0188d7e7297d7a.mockapi.io/people/gift_marke_massage";

let orders = [];
let activeTab = 1;
const completedCount = document.getElementById("completed_count");
const newCount = document.getElementById("new_count");
const deliveringCount = document.getElementById("delivering_count");
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
  return v ? "<i style=\"color: #10b981;\" class=\"fa-solid fa-truck-fast\"></i> Yetkazib beriladi" : "<i style=\"color: #f59e0b;\" class=\"fa-solid fa-person-walking\"></i> O‘zi olib ketadi";
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

function formatUzTime(iso){
  if(!iso) return "-";

  const d = new Date(iso);

  const formatted = d.toLocaleString("en-US", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  return formatted.replace("a.m.", "AM").replace("p.m.", "PM").replace("/", ".").replace("/", ".").replace(",", " |");
}

function orderCard(o) {
  const ids = safeArr(o.productID);
  const names = safeArr(o.name);
  const prices = safeArr(o.price);
  const counts = safeArr(o.productr_count);
  const img = safeArr(o.image);

  let itemsHtml = "";
  const maxLen = Math.max(ids.length, names.length, prices.length, counts.length);

  for (let i = 0; i < maxLen; i++) {
    const pid = ids[i] ?? "-";
    const nm = cutText(names[i] ?? "-", 30);
    const pr = prices[i] ?? "-";
    const pimg = img[i] ?? "-";
    const ct = counts[i] ?? 1;


    itemsHtml += `
      <div class="order-item">
        <div class="mono">${pid}</div>
        <div class="order-image">
          <img src="${pimg}" alt="order image" loading="lazy" />
        </div>
        <div class="order-item-info">
          <span class="order-item-name">${nm}</span>
          <div class="small order-item-info-number"><span class="price">Narx: ${pr} </span> <span class=" mono"> Soni:  - ${ct}</span></div>
        </div>
      </div>
    `;
  }

  const st = Number(o.status ?? 1);
const prevBtn =
  st === 2
    ? `<button class="btn-secondary order-action" data-act="to1" data-id="${o.id}" type="button">jarayondan olish</button>`
    : st === 3
    ? `<button class="btn-secondary order-action" data-act="to2" data-id="${o.id}" type="button">Jarayonga qaytarish</button>`
    : ``;
  const nextBtn =
    st === 1
      ? `<button class="btn-primary order-action" data-act="to2" data-id="${o.id}" type="button">Qabul qilish</button>`
      : st === 2
      ? `<button class="btn-primary order-action" data-act="to3" data-id="${o.id}" type="button">Yakunlash</button>`
      : `<span class="btn-secondary order-action">Yakunlangan</span>`;

  const hasMap = !!parseLatLng(o.map);
  const mapBtn = hasMap
  ? `<button class="btn-secondary order-action" data-act="map" data-id="${o.id}" type="button"><i class="fa-solid fa-map-location-dot"></i> Xarita</button>`
  : ``;
  const delBtn = `<button class="btn-danger order-action" data-act="del" data-id="${o.id}" type="button"><i class="fa-regular fa-trash-can"></i></button>`;


  const img0 = firstImg(o);
  return `
    <div class="order-card">
      <div class="order-head">
        <div>
          <div class="order-title">Buyurtma raqami -<span class="mono"> ${o.id} </span> <span class="badge-soft"> ${statusName(st)} </span></div>
          <div class="small"><i class="fa-solid fa-phone-volume"></i> ${o.user_phone ?? "-"} · ${fmtDelivery(Boolean(o.deliver))}</div>
        </div>
        <div class="order-right">
          <div class="small">Jami: <span class="price">${o.total_price ?? "-"}</span></div>
          <div class="small">Sana: <span class="mono">${formatUzTime(o.date)}</span></div>
        </div>
      </div>
      <div class="order-items">${itemsHtml || `<div class="small">Mahsulotlar yo‘q</div>`}</div>
      <div class="order-meta">
        <div class="small"><b>Manzil:</b> ${o.address ?? "-"}</div>
        <div class="small"><b>Xabar:</b> ${o.massage ?? "-"}</div>
          <div class="order-actions-row">
            ${mapBtn}
            ${delBtn}
            ${prevBtn}
            ${nextBtn}
          </div>
        </div>
      </div>
    </div>
  `;
}

function cutText(s, max) {
  const t = String(s ?? "");
  return t.length > max ? t.slice(0, max) + "..." : t;
}

function renderOrders() {
  const list = orders.filter(o => Number(o.status ?? 1) === activeTab);

  ordersList.innerHTML = list.length
    ? list.map(orderCard).join("")
    : `<div class="empty-row">Hozircha buyurtma yo‘q.</div>`;

  const c1 = orders.filter(o => Number(o.status ?? 1) === 1).length;
  const c2 = orders.filter(o => Number(o.status ?? 1) === 2).length;
  const c3 = orders.filter(o => Number(o.status ?? 1) === 3).length;


  newCount.textContent = c1;
  deliveringCount.textContent = c2;
  completedCount.textContent = `${c3}`;
}

async function fetchOrders() {
  ordersInfo.textContent = "Yangilanmoqda...";

  try {
    const res = await fetch(API_ORDERS);
    if (!res.ok) throw new Error(res.status);

    orders = await res.json();
    renderOrders();

    // 🔥 faqat yangilangan vaqt
    const time = new Date().toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit"
    });

    ordersInfo.textContent = "Yangilandi · " + time;

  } catch (err) {
    console.error(err);
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

    let lat = 41.35275740466005;
    let lng = 69.28781615864081;
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

    if (act === "to1") updateStatus(id, 1);
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
if (ordersInfo) {
  ordersInfo.addEventListener("click", fetchOrders);
}

fetchOrders();