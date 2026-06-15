import { $, toast, setLoading } from "./ui.js";
import { login, register, saveSession, isLoggedIn } from "./auth.js";

// Zaten girisliyse uygulamaya gonder
if (isLoggedIn()) {
  window.location.href = "index.html";
}

let mode = "login"; // "login" | "register"

const tabLogin = $("#tabLogin");
const tabRegister = $("#tabRegister");
const nameField = $("#nameField");
const submitBtn = $("#submitBtn");
const form = $("#authForm");

function setMode(next) {
  mode = next;
  tabLogin.classList.toggle("active", mode === "login");
  tabRegister.classList.toggle("active", mode === "register");
  nameField.classList.toggle("hidden", mode === "login");
  submitBtn.textContent = mode === "login" ? "Giris Yap" : "Hesap Oluştur";
}

tabLogin.addEventListener("click", () => setMode("login"));
tabRegister.addEventListener("click", () => setMode("register"));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#email").value.trim();
  const password = $("#password").value;
  const fullName = $("#fullName").value.trim();

  setLoading(submitBtn, true);
  try {
    const res =
      mode === "login"
        ? await login(email, password)
        : await register(email, password, fullName);

    saveSession({ token: res.token, user: res.user });
    toast("Giris basarili, yonlendiriliyorsunuz...", "ok");
    setTimeout(() => (window.location.href = "index.html"), 600);
  } catch (err) {
    toast(err.message, "err");
    setLoading(submitBtn, false);
  }
});

setMode("login");
