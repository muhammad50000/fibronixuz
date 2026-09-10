// ============================================
// State
// ============================================
let ALL_PRODUCTS = [];
let SETTINGS = {};
let cartCount = Number(localStorage.getItem('fibronix_cart') || 0);
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
          <button class="add-btn" aria-label="Savatchaga qo'shish">
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
// Search (simple client-side name/category match)
// ============================================
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

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
  window.scrollTo({ top: 0, behavior: "instant" });
}

searchBtn?.addEventListener("click", runSearch);
searchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});

// ============================================
// Cart / Wishlist / Login (lightweight, persisted)
// ============================================
function updateBadges() {
  const cartBadge = document.getElementById("cartBadge");
  const wishlistBadge = document.getElementById("wishlistBadge");
  if (cartBadge) cartBadge.textContent = cartCount;
  if (wishlistBadge) wishlistBadge.textContent = wishlistCount;
}

document.getElementById("cartBtn")?.addEventListener("click", () => {
  alert(cartCount > 0 ? `Savatingizda ${cartCount} ta mahsulot bor.` : "Savatingiz hozircha bo'sh.");
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
  if (btn) {
    cartCount++;
    localStorage.setItem("fibronix_cart", cartCount);
    updateBadges();
  }
});

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

  dotsEl.innerHTML = slides.map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`).join("");

  let current = 0;

  function render(i) {
    const s = slides[i];
    eyebrowEl.textContent = s.eyebrow || "";
    titleEl.textContent = s.title || "";
    subtitleEl.textContent = s.subtitle || "";
    ctaEl.textContent = (s.cta_text || "Ko'rish") + " →";
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
