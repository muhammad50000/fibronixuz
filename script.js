// ============================================
// Mobile menu
// ============================================
const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");
const mobileNav = document.getElementById("mobileNav");

if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => mobileNav.classList.add("open"));
}
if (menuClose && mobileNav) {
  menuClose.addEventListener("click", () => mobileNav.classList.remove("open"));
}
mobileNav?.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => mobileNav.classList.remove("open"))
);

// ============================================
// Product rendering (data comes from Decap CMS -> products.json)
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
        <div class="product-price-row">${priceBlock}</div>
      </div>
    </article>
  `;
}

async function loadProducts() {
  try {
    const res = await fetch("products.json", { cache: "no-store" });
    const data = await res.json();
    const products = data.products || [];

    const bestEl = document.getElementById("bestProducts");
    const newEl = document.getElementById("newProducts");

    const best = products.filter((p) => p.section === "best");
    const fresh = products.filter((p) => p.section === "new");

    if (bestEl) bestEl.innerHTML = best.map(productCard).join("");
    if (newEl) newEl.innerHTML = fresh.map(productCard).join("");
  } catch (err) {
    console.error("Mahsulotlarni yuklashda xatolik:", err);
  }
}

loadProducts();
