const VALID_USERNAME = "user";
const VALID_PASSWORD = "user";

const form = document.getElementById("loginForm");
const username = document.getElementById("username");
const password = document.getElementById("password");
const msg = document.getElementById("msg");
const togglePass = document.getElementById("togglePass");

togglePass.addEventListener("click", () => {
  const isPass = password.type === "password";
  password.type = isPass ? "text" : "password";
  togglePass.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
});

function setMsg(text, type) {
  msg.textContent = text;
  msg.className = "msg " + (type || "");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const u = (username.value || "").trim();
  const p = (password.value || "").trim();

  if (u === VALID_USERNAME && p === VALID_PASSWORD) {
    setMsg("✅ Login to‘g‘ri. Yo‘naltirilmoqda...", "ok");
    setTimeout(() => {
      window.location.href = "products.html";
    }, 500);
  } else {
    setMsg("❌ Username yoki parol noto‘g‘ri!", "error");
  }
});