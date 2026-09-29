// ============================================
// State
// ============================================
let ALL_PRODUCTS = [];
let SETTINGS = {};
let wishlistCount = Number(localStorage.getItem('fibronix_wishlist') || 0);

// ============================================
// Mobile menu
// ============================================
const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");
const mobileNav = document.getElementById("mobileNav");

menuToggle?.addEventListener("click", () => mobileNav.classList.add("open"));
menuClose?.addEventListener("click", () => mobileNav.classList.remove("open"));

// ============================================
// Helpers
// ============================================
function formatSom(n) {
  return new Intl.NumberFormat("uz-UZ").format(n) + " so'm";
}

function starIcon() {
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2l-5-4.9 6.9-1L12 2z"/></svg>`;
}

function productCard(p) {
  const flag = p.flag
    ? `<span class="product-flag ${p.flag === "new" ? "flag-new" : "flag-sale"}">${
        p.flag === "new" ? "YANGI" : "CHEGIRMA"
      }</span>`
    : "";

  let priceBlock = `<span class="product-price">${formatSom(p.price)}</span>`;
  if (p.old_price) {
    const discount = Math.round((1 - p.price / p.old_price) * 100);
    priceBlock = `
      <span class="product-price-old">${formatSom(p.old_price)}</span>
      <span class="product-price">${formatSom(p.price)}</span>
      <span class="product-discount">-${discount}%</span>
    `;
  }

  const rating = p.rating || 4.5;

  return `
    <article class="product-card">
      <div class="product-media">
        ${flag}
        <img src="${p.image || "placeholder.svg"}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-body">
        <span class="product-brand">FIBRONIX</span>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-rating">${starIcon()} ${rating.toFixed(1)}</div>
        <div class="product-price-row">
          <div>${priceBlock}</div>
          <button class="add-btn" data-id="${p.id}" aria-label="Savatchaga qo'shish">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
          </button>
        </div>
      </div>
    </article>
  `;
}

// ============================================
// Product loading + rendering
// ============================================
async function loadProducts() {
  try {
    const res = await fetch("products.json", { cache: "no-store" });
    const data = await res.json();
    ALL_PRODUCTS = data.products || [];

    const bestEl = document.getElementById("bestProducts");
    const newEl = document.getElementById("newProducts");

    const best = ALL_PRODUCTS.filter((p) => p.section === "best");
    const fresh = ALL_PRODUCTS.filter((p) => p.section === "new");

    if (bestEl) bestEl.innerHTML = best.map(productCard).join("");
    if (newEl) newEl.innerHTML = fresh.map(productCard).join("");
  } catch (err) {
    console.error("Mahsulotlarni yuklashda xatolik:", err);
  }
}

// ============================================
// Category filtering (no page navigation — in-page view swap)
// ============================================
const homeView = document.getElementById("homeView");
const categoryView = document.getElementById("categoryView");
const categoryViewTitle = document.getElementById("categoryViewTitle");
const categoryCount = document.getElementById("categoryCount");
const categoryProductsEl = document.getElementById("categoryProducts");
const backBtn = document.getElementById("backBtn");

function showCategory(cat) {
  let matched = ALL_PRODUCTS;
  let title = "Barcha mahsulotlar";

  if (cat && cat !== "all") {
    matched = ALL_PRODUCTS.filter((p) => p.category === cat);
    title = cat;
  }

  categoryViewTitle.textContent = title;
  categoryCount.textContent = matched.length + " ta mahsulot";
  categoryProductsEl.innerHTML = matched.length
    ? matched.map(productCard).join("")
    : `<p class="empty-note">Bu kategoriyada hozircha mahsulot yo'q.</p>`;

  homeView.hidden = true;
  categoryView.hidden = false;
  mobileNav?.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function showHome() {
  categoryView.hidden = true;
  homeView.hidden = false;
  window.scrollTo({ top: 0, behavior: "instant" });
}

document.querySelectorAll("[data-cat]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    showCategory(btn.dataset.cat);
  });
});

backBtn?.addEventListener("click", showHome);
document.getElementById("logoHome")?.addEventListener("click", (e) => {
  e.preventDefault();
  showHome();
});

// ============================================
// Search with live autocomplete (starts-with matching)
// ============================================
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchSuggestions = document.getElementById("searchSuggestions");

function renderSuggestions(list) {
  if (!list.length) {
    searchSuggestions.hidden = true;
    searchSuggestions.innerHTML = "";
    return;
  }
  searchSuggestions.innerHTML = list
    .slice(0, 6)
    .map(
      (p) => `
      <button class="suggestion-item" data-name="${p.name.replace(/"/g, "&quot;")}">
        <img src="${p.image || "placeholder.svg"}" alt="">
        <span>
          <strong>${p.name}</strong>
          <small>${p.category}</small>
        </span>
      </button>`
    )
    .join("");
  searchSuggestions.hidden = false;
}

searchInput?.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    renderSuggestions([]);
    return;
  }
  // Prioritize names that START WITH the typed text, per request
  const startsWith = ALL_PRODUCTS.filter((p) => p.name.toLowerCase().startsWith(q));
  const contains = ALL_PRODUCTS.filter(
    (p) => !p.name.toLowerCase().startsWith(q) && p.name.toLowerCase().includes(q)
  );
  renderSuggestions([...startsWith, ...contains]);
});

searchSuggestions?.addEventListener("click", (e) => {
  const item = e.target.closest(".suggestion-item");
  if (!item) return;
  searchInput.value = item.dataset.name;
  renderSuggestions([]);
  runSearch();
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) {
    searchSuggestions.hidden = true;
  }
});

function runSearch() {
  const q = (searchInput?.value || "").trim().toLowerCase();
  if (!q) return;
  const matched = ALL_PRODUCTS.filter(
    (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );
  categoryViewTitle.textContent = `"${searchInput.value}" bo'yicha qidiruv natijalari`;
  categoryCount.textContent = matched.length + " ta mahsulot topildi";
  categoryProductsEl.innerHTML = matched.length
    ? matched.map(productCard).join("")
    : `<p class="empty-note">Hech narsa topilmadi. Boshqa so'z bilan qidirib ko'ring.</p>`;
  homeView.hidden = true;
  categoryView.hidden = false;
  mobileNav?.classList.remove("open");
  searchSuggestions.hidden = true;
  window.scrollTo({ top: 0, behavior: "instant" });
}

searchBtn?.addEventListener("click", runSearch);
searchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});

// ============================================
// Cart (real items, persisted) + Telegram checkout
// ============================================
let cart = JSON.parse(localStorage.getItem("fibronix_cart_items") || "[]");

function saveCart() {
  localStorage.setItem("fibronix_cart_items", JSON.stringify(cart));
  updateBadges();
}

function addToCart(id) {
  const product = ALL_PRODUCTS.find((p) => p.id === id);
  if (!product) return;
  const existing = cart.find((i) => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  }
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  renderCart();
}

function cartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function renderCart() {
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  if (!cartItemsEl) return;

  cartItemsEl.innerHTML = cart.length
    ? cart
        .map(
          (i) => `
      <div class="cart-item">
        <div>
          <div class="cart-item-name">${i.name}</div>
          <div class="cart-item-sub">${i.qty} x ${formatSom(i.price)}</div>
        </div>
        <button class="cart-item-remove" data-id="${i.id}" aria-label="O'chirish">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>`
        )
        .join("")
    : `<p class="empty-note">Savatchangiz hozircha bo'sh.</p>`;

  cartTotalEl.textContent = formatSom(cartTotal());
}

function updateBadges() {
  const cartBadge = document.getElementById("cartBadge");
  const wishlistBadge = document.getElementById("wishlistBadge");
  if (cartBadge) cartBadge.textContent = cart.reduce((n, i) => n + i.qty, 0);
  if (wishlistBadge) wishlistBadge.textContent = wishlistCount;
}

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");

function openCart() {
  renderCart();
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
}

document.getElementById("cartBtn")?.addEventListener("click", openCart);
document.getElementById("cartCloseBtn")?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);

document.getElementById("cartItems")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".cart-item-remove");
  if (btn) removeFromCart(btn.dataset.id);
});

document.getElementById("wishlistBtn")?.addEventListener("click", () => {
  alert(wishlistCount > 0 ? `Sevimlilarda ${wishlistCount} ta mahsulot bor.` : "Sevimlilar ro'yxati hozircha bo'sh.");
});

document.getElementById("loginBtn")?.addEventListener("click", () => {
  const tg = SETTINGS.telegram || "@Muhammadjon_202";
  alert(`Kirish tizimi tez orada ishga tushadi. Savollar uchun: ${tg}`);
});

// Add-to-cart clicks on product cards (event delegation, works for dynamically rendered cards)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-btn");
  if (btn) addToCart(btn.dataset.id);
});

// Send order to Telegram via Bot API
async function sendOrderToTelegram() {
  if (!cart.length) {
    alert("Savatchangiz bo'sh.");
    return;
  }
  const token = SETTINGS.telegram_bot_token;
  const chatId = SETTINGS.telegram_chat_id;

  if (!token || !chatId) {
    alert("Telegram bot hali sozlanmagan. Admin panelda bot tokeni va chat ID kiritilishi kerak.");
    return;
  }

  const lines = cart.map((i) => `• ${i.name} — ${i.qty} x ${formatSom(i.price)}`).join("\n");
  const text = `🛒 Yangi buyurtma (FIBRONIX)\n\n${lines}\n\nJami: ${formatSom(cartTotal())}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const data = await res.json();
    if (data.ok) {
      alert("Buyurtmangiz qabul qilindi! Tez orada siz bilan bog'lanamiz.");
      cart = [];
      saveCart();
      renderCart();
      closeCart();
    } else {
      alert("Buyurtmani yuborishda xatolik yuz berdi. Iltimos, telefon orqali bog'laning: " + (SETTINGS.phone || ""));
    }
  } catch (err) {
    console.error(err);
    alert("Internet aloqasida muammo. Iltimos, telefon orqali bog'laning: " + (SETTINGS.phone || ""));
  }
}

document.getElementById("checkoutBtn")?.addEventListener("click", sendOrderToTelegram);

updateBadges();

// ============================================
// Settings: company info + rotating banner
// ============================================
async function loadSettings() {
  try {
    const res = await fetch("settings.json", { cache: "no-store" });
    SETTINGS = await res.json();

    if (SETTINGS.phone) {
      document.getElementById("topBarPhone").textContent = SETTINGS.phone;
      const fp = document.getElementById("footerPhone");
      if (fp) {
        fp.textContent = SETTINGS.phone;
        fp.href = "tel:" + SETTINGS.phone.replace(/\s/g, "");
      }
    }
    if (SETTINGS.top_bar_message) {
      document.getElementById("topBarMessage").innerHTML = SETTINGS.top_bar_message;
    }
    if (SETTINGS.director_name) {
      document.getElementById("footerDirector").textContent =
        (SETTINGS.director_title || "Asoschisi") + ": " + SETTINGS.director_name;
    }
    if (SETTINGS.founded_date) {
      document.getElementById("footerFounded").textContent = "Tashkil topgan: " + SETTINGS.founded_date;
    }
    if (SETTINGS.telegram) {
      const handle = SETTINGS.telegram.replace("@", "");
      const ft = document.getElementById("footerTelegram");
      if (ft) {
        ft.textContent = "Telegram: " + SETTINGS.telegram;
        ft.href = "https://t.me/" + handle;
      }
    }

    if (Array.isArray(SETTINGS.banner_slides) && SETTINGS.banner_slides.length) {
      startBannerRotation(SETTINGS.banner_slides);
    }
  } catch (err) {
    console.error("Sozlamalarni yuklashda xatolik:", err);
  }
}

function startBannerRotation(slides) {
  const eyebrowEl = document.getElementById("bannerEyebrow");
  const titleEl = document.getElementById("bannerTitle");
  const subtitleEl = document.getElementById("bannerSubtitle");
  const ctaEl = document.getElementById("bannerCta");
  const dotsEl = document.getElementById("bannerDots");
  const bannerMainEl = document.getElementById("bannerMain");

  dotsEl.innerHTML = slides.map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`).join("");

  let current = 0;

  function render(i) {
    const s = slides[i];
    eyebrowEl.textContent = s.eyebrow || "";
    titleEl.textContent = s.title || "";
    subtitleEl.textContent = s.subtitle || "";
    ctaEl.textContent = (s.cta_text || "Ko'rish") + " →";
    bannerMainEl.style.backgroundImage = s.image
      ? `linear-gradient(120deg, rgba(255,255,255,0.9), rgba(255,255,255,0.55)), url('${s.image}')`
      : "";
    bannerMainEl.style.backgroundSize = "cover";
    bannerMainEl.style.backgroundPosition = "center";
    [...dotsEl.children].forEach((dot, idx) => dot.classList.toggle("active", idx === i));
  }

  render(0);

  if (slides.length > 1) {
    setInterval(() => {
      current = (current + 1) % slides.length;
      render(current);
    }, 5000);
  }
}

// ============================================
// Init
// ============================================
loadProducts();
loadSettings();
