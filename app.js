(function () {
  "use strict";

  // ---- Data ---------------------------------------------------------------

  const MENU = [
    // Pizzas
    {
      id: "margherita",
      name: "マルゲリータ",
      emoji: "🍕",
      category: "pizza",
      desc: "トマトソース、モッツァレラ、フレッシュバジル。定番の王道。",
      prices: { S: 1280, M: 1780, L: 2280 },
      tag: "定番",
    },
    {
      id: "marinara",
      name: "マリナーラ",
      emoji: "🍅",
      category: "pizza",
      desc: "ナポリ伝統。トマト、ガーリック、オレガノ、EXVオリーブオイル。",
      prices: { S: 1180, M: 1680, L: 2180 },
      tag: "ヴィーガン可",
    },
    {
      id: "quattro",
      name: "クアトロフォルマッジ",
      emoji: "🧀",
      category: "pizza",
      desc: "4種のチーズと蜂蜜。濃厚な味わい。",
      prices: { S: 1580, M: 2180, L: 2780 },
    },
    {
      id: "diavola",
      name: "ディアボラ",
      emoji: "🌶️",
      category: "pizza",
      desc: "スパイシーサラミと唐辛子で大人の辛さ。",
      prices: { S: 1480, M: 1980, L: 2580 },
      tag: "ピリ辛",
    },
    {
      id: "prosciutto",
      name: "プロシュート・ルッコラ",
      emoji: "🥬",
      category: "pizza",
      desc: "生ハムとルッコラ、パルミジャーノを贅沢に。",
      prices: { S: 1680, M: 2280, L: 2880 },
    },
    {
      id: "seafood",
      name: "横浜シーフード",
      emoji: "🦐",
      category: "pizza",
      desc: "海老・帆立・イカと自家製トマトソース。横浜港から直送。",
      prices: { S: 1780, M: 2380, L: 2980 },
      tag: "人気",
    },
    {
      id: "bianca",
      name: "ビアンカ",
      emoji: "🤍",
      category: "pizza",
      desc: "リコッタ、モッツァレラ、ローズマリー。白いピッツァ。",
      prices: { S: 1380, M: 1880, L: 2380 },
    },
    {
      id: "minato",
      name: "みなとみらい特製",
      emoji: "🌊",
      category: "pizza",
      desc: "ベイブリッジに浮かぶ夕焼けをイメージしたシェフのおまかせ。",
      prices: { S: 1880, M: 2480, L: 3080 },
      tag: "限定",
    },

    // Sides
    { id: "garlic-bread", name: "ガーリックブレッド", emoji: "🥖", category: "side", desc: "自家製パンに香ばしいガーリックバター。", price: 580 },
    { id: "caesar-salad", name: "シーザーサラダ", emoji: "🥗", category: "side", desc: "ロメインレタス、クルトン、パルミジャーノ。", price: 780 },
    { id: "fries", name: "ローズマリーポテト", emoji: "🍟", category: "side", desc: "ローズマリーと岩塩で味付けしたフライドポテト。", price: 580 },
    { id: "wings", name: "スパイシーチキンウィング", emoji: "🍗", category: "side", desc: "ピリ辛味付けの骨付きチキン6本。", price: 880 },

    // Drinks
    { id: "cola", name: "コカ・コーラ", emoji: "🥤", category: "drink", desc: "500mlペットボトル。", price: 280 },
    { id: "ginger", name: "ジンジャーエール", emoji: "🍹", category: "drink", desc: "辛口ジンジャー。", price: 320 },
    { id: "beer", name: "ハートランドビール", emoji: "🍺", category: "drink", desc: "330ml瓶。20歳以上限定。", price: 580 },
    { id: "wine", name: "ハウスワイン（赤）", emoji: "🍷", category: "drink", desc: "グラス150ml。20歳以上限定。", price: 680 },
    { id: "lemonade", name: "湘南レモネード", emoji: "🍋", category: "drink", desc: "ノンアルコール、無添加レモネード。", price: 420 },

    // Desserts
    { id: "tiramisu", name: "ティラミス", emoji: "🍰", category: "dessert", desc: "本格マスカルポーネ使用。", price: 680 },
    { id: "panna-cotta", name: "パンナコッタ", emoji: "🍮", category: "dessert", desc: "ベリーソース添え。", price: 580 },
    { id: "gelato", name: "ジェラート（バニラ）", emoji: "🍨", category: "dessert", desc: "イタリア産バニラビーンズ使用。", price: 480 },
  ];

  const SIZE_LABEL = { S: "S (20cm)", M: "M (25cm)", L: "L (30cm)" };

  const CRUSTS = [
    { id: "regular", name: "通常生地", extra: 0 },
    { id: "thin", name: "薄生地クリスピー", extra: 0 },
    { id: "thick", name: "厚生地パン", extra: 200 },
    { id: "gluten-free", name: "グルテンフリー", extra: 300 },
  ];

  const TOPPINGS = [
    { id: "mozzarella", name: "モッツァレラ追加", extra: 200 },
    { id: "basil", name: "バジル", extra: 100 },
    { id: "mushroom", name: "マッシュルーム", extra: 150 },
    { id: "olive", name: "ブラックオリーブ", extra: 150 },
    { id: "anchovy", name: "アンチョビ", extra: 250 },
    { id: "jalapeno", name: "ハラペーニョ", extra: 150 },
    { id: "pineapple", name: "パイナップル", extra: 150 },
    { id: "corn", name: "スイートコーン", extra: 100 },
  ];

  const PAYMENT_LABEL = {
    cash: "現金（代引き）",
    card: "クレジットカード",
    paypay: "PayPay",
  };

  const COUPONS = {
    MM10:       { type: "percent", value: 10, min: 1500, label: "10% OFF（小計¥1,500以上）" },
    MIRAI20:    { type: "percent", value: 20, min: 3000, label: "20% OFF（小計¥3,000以上）" },
    LANDMARK:   { type: "flat",    value: 500, min: 2000, label: "¥500 OFF（小計¥2,000以上）" },
    YOKOHAMA:   { type: "flat",    value: 300, min: 1500, label: "¥300 OFF（小計¥1,500以上）" },
  };

  const STORES = [
    { id: "mm-honten",        name: "みなとみらい本店",    emoji: "🌊", address: "横浜市西区みなとみらい2-3-1 クイーンズタワーA 1F",  phone: "045-100-1001", hours: "11:00-23:00", areas: [1, 2, 3, 4], isOpen: true },
    { id: "mm-landmark",      name: "ランドマーク店",      emoji: "🗼", address: "横浜市西区みなとみらい2-2-1 ランドマークプラザ B1F", phone: "045-100-1002", hours: "10:30-22:30", areas: [1, 2, 4],   isOpen: true },
    { id: "mm-pacifico",      name: "パシフィコ店",        emoji: "🏢", address: "横浜市西区みなとみらい1-1-1 パシフィコ横浜 1F",     phone: "045-100-1003", hours: "11:00-22:00", areas: [2, 3],      isOpen: true },
    { id: "mm-akarenga",      name: "赤レンガ店",          emoji: "🧱", address: "横浜市中区新港1-1-2 赤レンガ倉庫1号館 1F",         phone: "045-100-1004", hours: "11:30-23:00", areas: [5, 6, 7],   isOpen: true },
    { id: "mm-bashamichi",    name: "馬車道店",            emoji: "🐴", address: "横浜市中区南仲通4-43 馬車道アネックス 1F",         phone: "045-100-1005", hours: "11:00-22:00", areas: [6, 7],      isOpen: true },
    { id: "mm-shintakashima", name: "新高島店",            emoji: "🏙", address: "横浜市西区高島1-2-3 ベイクォーター 2F",            phone: "045-100-1006", hours: "10:00-22:00", areas: [7, 8],      isOpen: true },
    { id: "mm-sakuragicho",   name: "桜木町店",            emoji: "🚉", address: "横浜市中区桜木町1-1 CIAL桜木町 1F",                phone: "045-100-1007", hours: "10:30-22:30", areas: [1, 7],      isOpen: true },
    { id: "mm-cosmo",         name: "コスモワールド店",    emoji: "🎡", address: "横浜市中区新港2-8-1 ワールドポーターズ 1F",        phone: "045-100-1008", hours: "11:00-23:30", areas: [4, 5, 6],   isOpen: true },
  ];

  const STORAGE_KEY = "mm-pizza-cart-v2";
  const HISTORY_KEY = "mm-pizza-history-v1";
  const THEME_KEY = "mm-pizza-theme";
  const COUPON_KEY = "mm-pizza-coupon";
  const STORE_KEY = "mm-pizza-store";

  // ---- State --------------------------------------------------------------

  /**
   * @typedef {Object} CartItem
   * @property {string} key       Unique line key.
   * @property {string} id        Menu id.
   * @property {'S'|'M'|'L'=} size  Pizza size.
   * @property {string=} crust    Pizza crust id.
   * @property {string[]=} toppings Topping ids.
   * @property {number} qty
   */

  /** @type {CartItem[]} */
  let cart = loadCart();
  let activeCategory = "all";
  let searchTerm = "";
  let appliedCoupon = loadCoupon();
  /** @type {{ menuId: string, size: 'S'|'M'|'L', crust: string, toppings: Set<string>, qty: number }} */
  let customizeState = null;
  let progressTimers = [];
  /** @type {string} */
  let selectedStoreId = loadStore();

  // ---- Init ---------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", () => {
    applyInitialTheme();
    renderStores();
    renderMenu();
    renderHistory();
    bindUI();
    updateCart();
    applyStoreGating();
  });

  // ---- Storage ------------------------------------------------------------

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }
  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {}
  }
  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }
  function saveHistory(orders) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(orders.slice(0, 10))); } catch {}
  }
  function loadCoupon() {
    try { return localStorage.getItem(COUPON_KEY) || ""; } catch { return ""; }
  }
  function saveCoupon(code) {
    try {
      if (code) localStorage.setItem(COUPON_KEY, code);
      else localStorage.removeItem(COUPON_KEY);
    } catch {}
  }
  function loadStore() {
    try { return localStorage.getItem(STORE_KEY) || ""; } catch { return ""; }
  }
  function saveStore(id) {
    try {
      if (id) localStorage.setItem(STORE_KEY, id);
      else localStorage.removeItem(STORE_KEY);
    } catch {}
  }

  // ---- Store selection ----------------------------------------------------

  function findStore(id) { return STORES.find((s) => s.id === id); }

  function renderStores() {
    const grid = document.getElementById("store-grid");
    if (!grid) return;
    grid.innerHTML = "";
    for (const s of STORES) {
      const isSelected = s.id === selectedStoreId;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "store-card" + (isSelected ? " selected" : "") + (s.isOpen ? "" : " closed");
      card.disabled = !s.isOpen;
      card.dataset.storeId = s.id;
      card.innerHTML = `
        <div class="store-emoji" aria-hidden="true">${s.emoji}</div>
        <h3 class="store-name">${s.name}${isSelected ? '<span class="store-selected-tag">選択中</span>' : ""}</h3>
        <p class="store-address">${s.address}</p>
        <dl class="store-meta">
          <dt>営業</dt><dd>${s.hours}</dd>
          <dt>電話</dt><dd>${s.phone}</dd>
        </dl>
        <span class="store-cta">${isSelected ? "この店舗で続ける" : "この店舗を選ぶ →"}</span>
      `;
      card.addEventListener("click", () => selectStore(s.id));
      grid.appendChild(card);
    }
  }

  function selectStore(id) {
    const s = findStore(id);
    if (!s || !s.isOpen) return;
    selectedStoreId = id;
    saveStore(id);
    renderStores();
    applyStoreGating();
    const menu = document.getElementById("menu");
    if (menu) menu.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function changeStore() {
    selectedStoreId = "";
    saveStore("");
    renderStores();
    applyStoreGating();
    const stores = document.getElementById("stores");
    if (stores) stores.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function applyStoreGating() {
    const s = findStore(selectedStoreId);
    const banner = document.getElementById("selected-store-banner");
    const menu = document.getElementById("menu");
    const checkoutStoreLine = document.getElementById("checkout-store-name");
    if (s) {
      if (banner) {
        banner.hidden = false;
        document.getElementById("ssb-emoji").textContent = s.emoji;
        document.getElementById("ssb-name").textContent = s.name;
        document.getElementById("ssb-meta").textContent = `${s.address}（営業 ${s.hours}）`;
      }
      if (menu) menu.hidden = false;
      if (checkoutStoreLine) checkoutStoreLine.textContent = `${s.emoji} ${s.name}`;
    } else {
      if (banner) banner.hidden = true;
      if (menu) menu.hidden = true;
      if (checkoutStoreLine) checkoutStoreLine.textContent = "—";
    }
    updateCheckoutButton();
  }

  function updateCheckoutButton() {
    const btn = document.getElementById("checkout-button");
    if (!btn) return;
    const hasStore = !!findStore(selectedStoreId);
    const hasItems = cart.length > 0;
    btn.disabled = !(hasStore && hasItems);
    btn.textContent = !hasStore ? "店舗を選んでください" : !hasItems ? "カートが空です" : "注文に進む";
  }

  function requireStore() {
    if (findStore(selectedStoreId)) return true;
    const stores = document.getElementById("stores");
    if (stores) stores.scrollIntoView({ behavior: "smooth", block: "start" });
    alert("先にご注文先の店舗をお選びください。");
    return false;
  }

  // ---- Helpers ------------------------------------------------------------

  function findMenu(id) { return MENU.find((m) => m.id === id); }
  function findCrust(id) { return CRUSTS.find((c) => c.id === id) || CRUSTS[0]; }
  function findTopping(id) { return TOPPINGS.find((t) => t.id === id); }
  function yen(n) { return "¥" + Math.round(n).toLocaleString("ja-JP"); }
  function newKey() { return Math.random().toString(36).slice(2, 10); }

  function unitPrice(item) {
    const m = findMenu(item.id);
    if (!m) return 0;
    if (m.category === "pizza") {
      const base = m.prices[item.size || "M"];
      const crustExtra = findCrust(item.crust).extra;
      const toppingExtra = (item.toppings || []).reduce(
        (sum, t) => sum + (findTopping(t)?.extra || 0),
        0
      );
      return base + crustExtra + toppingExtra;
    }
    return m.price || 0;
  }

  function lineTotal(item) { return unitPrice(item) * item.qty; }
  function cartSubtotal() { return cart.reduce((s, it) => s + lineTotal(it), 0); }
  function cartCount() { return cart.reduce((s, it) => s + it.qty, 0); }

  function discountFor(subtotal) {
    if (!appliedCoupon) return 0;
    const c = COUPONS[appliedCoupon];
    if (!c) return 0;
    if (subtotal < c.min) return 0;
    if (c.type === "percent") return Math.floor((subtotal * c.value) / 100);
    if (c.type === "flat") return Math.min(c.value, subtotal);
    return 0;
  }

  function describeItem(item) {
    const m = findMenu(item.id);
    if (!m) return "";
    if (m.category !== "pizza") return "";
    const bits = [SIZE_LABEL[item.size || "M"]];
    const crust = findCrust(item.crust);
    if (crust.id !== "regular") bits.push(crust.name);
    if (item.toppings && item.toppings.length) {
      bits.push("追加: " + item.toppings.map((t) => findTopping(t)?.name || "").join("・"));
    }
    return bits.join(" / ");
  }

  // ---- Menu rendering -----------------------------------------------------

  function renderMenu() {
    const grid = document.getElementById("menu-grid");
    const empty = document.getElementById("menu-empty");
    grid.innerHTML = "";
    const term = searchTerm.trim().toLowerCase();
    const filtered = MENU.filter((m) => {
      if (activeCategory !== "all" && m.category !== activeCategory) return false;
      if (!term) return true;
      return (m.name + " " + m.desc).toLowerCase().includes(term);
    });
    empty.hidden = filtered.length > 0;

    for (const item of filtered) {
      const card = document.createElement("article");
      card.className = "menu-card";
      const priceLabel =
        item.category === "pizza"
          ? `<span class="menu-price-from"><small>S〜</small>${yen(item.prices.S)}</span>`
          : `<span class="menu-price-from">${yen(item.price)}</span>`;
      const tagHtml = item.tag ? `<span class="menu-tag">${item.tag}</span>` : "";
      card.innerHTML = `
        <div class="menu-emoji" aria-hidden="true">${item.emoji}</div>
        <h3 class="menu-name">${item.name}${tagHtml}</h3>
        <p class="menu-desc">${item.desc}</p>
        <div class="menu-row">
          ${priceLabel}
          <button class="add-button" type="button">${item.category === "pizza" ? "カスタマイズ" : "追加"}</button>
        </div>
      `;
      card.querySelector(".add-button").addEventListener("click", () => {
        if (item.category === "pizza") openCustomizeModal(item.id);
        else addSimpleItem(item.id);
      });
      grid.appendChild(card);
    }
  }

  // ---- Customize modal (pizza) -------------------------------------------

  function openCustomizeModal(menuId) {
    if (!requireStore()) return;
    const m = findMenu(menuId);
    if (!m || m.category !== "pizza") return;
    customizeState = {
      menuId,
      size: "M",
      crust: "regular",
      toppings: new Set(),
      qty: 1,
    };
    document.getElementById("customize-title").textContent = `${m.emoji} ${m.name}`;
    renderCustomizeBody();
    document.getElementById("customize-modal").hidden = false;
  }

  function renderCustomizeBody() {
    const m = findMenu(customizeState.menuId);
    const body = document.getElementById("customize-body");
    const sizeChips = ["S", "M", "L"]
      .map(
        (s) => `
        <button type="button" class="option-chip ${customizeState.size === s ? "selected" : ""}" data-size="${s}">
          ${SIZE_LABEL[s]}<span class="extra-price">${yen(m.prices[s])}</span>
        </button>`
      )
      .join("");
    const crustChips = CRUSTS.map(
      (c) => `
        <button type="button" class="option-chip ${customizeState.crust === c.id ? "selected" : ""}" data-crust="${c.id}">
          ${c.name}${c.extra ? `<span class="extra-price">+${yen(c.extra)}</span>` : ""}
        </button>`
    ).join("");
    const toppingChips = TOPPINGS.map(
      (t) => `
        <button type="button" class="option-chip ${customizeState.toppings.has(t.id) ? "selected" : ""}" data-topping="${t.id}">
          ${t.name}<span class="extra-price">+${yen(t.extra)}</span>
        </button>`
    ).join("");

    body.innerHTML = `
      <div class="customize-section">
        <h4>サイズ</h4>
        <div class="option-row" data-group="size">${sizeChips}</div>
      </div>
      <div class="customize-section">
        <h4>生地</h4>
        <div class="option-row" data-group="crust">${crustChips}</div>
      </div>
      <div class="customize-section">
        <h4>追加トッピング（複数選択可）</h4>
        <div class="option-row" data-group="topping">${toppingChips}</div>
      </div>
      <div class="customize-section">
        <h4>数量</h4>
        <div class="qty-stepper">
          <button type="button" data-qty="dec" aria-label="減らす">−</button>
          <span class="qty-value" id="customize-qty">${customizeState.qty}</span>
          <button type="button" data-qty="inc" aria-label="増やす">＋</button>
        </div>
      </div>
    `;

    body.addEventListener("click", onCustomizeBodyClick);
    updateCustomizeTotal();
  }

  function onCustomizeBodyClick(e) {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.size) {
      customizeState.size = /** @type {'S'|'M'|'L'} */ (target.dataset.size);
      refreshGroupSelection("size", target.dataset.size);
    } else if (target.dataset.crust) {
      customizeState.crust = target.dataset.crust;
      refreshGroupSelection("crust", target.dataset.crust);
    } else if (target.dataset.topping) {
      const id = target.dataset.topping;
      if (customizeState.toppings.has(id)) customizeState.toppings.delete(id);
      else customizeState.toppings.add(id);
      target.classList.toggle("selected");
    } else if (target.dataset.qty === "inc") {
      customizeState.qty = Math.min(10, customizeState.qty + 1);
      document.getElementById("customize-qty").textContent = String(customizeState.qty);
    } else if (target.dataset.qty === "dec") {
      customizeState.qty = Math.max(1, customizeState.qty - 1);
      document.getElementById("customize-qty").textContent = String(customizeState.qty);
    } else {
      return;
    }
    updateCustomizeTotal();
  }

  function refreshGroupSelection(group, value) {
    const groupEl = document.querySelector(`[data-group="${group}"]`);
    if (!groupEl) return;
    groupEl.querySelectorAll(".option-chip").forEach((el) => {
      const key = group === "size" ? "size" : group === "crust" ? "crust" : "topping";
      el.classList.toggle("selected", el.dataset[key] === value);
    });
  }

  function updateCustomizeTotal() {
    const tempItem = {
      id: customizeState.menuId,
      size: customizeState.size,
      crust: customizeState.crust,
      toppings: Array.from(customizeState.toppings),
      qty: customizeState.qty,
    };
    document.getElementById("customize-total").textContent = yen(lineTotal(tempItem));
  }

  function closeCustomizeModal() {
    document.getElementById("customize-modal").hidden = true;
    const body = document.getElementById("customize-body");
    body.removeEventListener("click", onCustomizeBodyClick);
    body.innerHTML = "";
    customizeState = null;
  }

  function confirmCustomizeAdd() {
    if (!customizeState) return;
    const item = {
      key: newKey(),
      id: customizeState.menuId,
      size: customizeState.size,
      crust: customizeState.crust,
      toppings: Array.from(customizeState.toppings),
      qty: customizeState.qty,
    };
    cart.push(item);
    saveCart();
    updateCart();
    closeCustomizeModal();
    openCart();
  }

  function addSimpleItem(menuId) {
    if (!requireStore()) return;
    const existing = cart.find((it) => it.id === menuId && !it.size);
    if (existing) {
      existing.qty = Math.min(20, existing.qty + 1);
    } else {
      cart.push({ key: newKey(), id: menuId, qty: 1 });
    }
    saveCart();
    updateCart();
    openCart();
  }

  // ---- Cart drawer --------------------------------------------------------

  function changeQty(key, delta) {
    const it = cart.find((x) => x.key === key);
    if (!it) return;
    it.qty += delta;
    if (it.qty <= 0) cart = cart.filter((x) => x.key !== key);
    else it.qty = Math.min(20, it.qty);
    saveCart();
    updateCart();
  }
  function removeItem(key) {
    cart = cart.filter((x) => x.key !== key);
    saveCart();
    updateCart();
  }

  function updateCart() {
    document.getElementById("cart-badge").textContent = String(cartCount());
    const subtotal = cartSubtotal();
    const discount = discountFor(subtotal);
    const total = Math.max(0, subtotal - discount);

    document.getElementById("cart-subtotal").textContent = yen(subtotal);
    document.getElementById("cart-total").textContent = yen(total);
    const discRow = document.getElementById("cart-discount-row");
    if (discount > 0) {
      discRow.hidden = false;
      document.getElementById("cart-discount").textContent = "-" + yen(discount);
    } else {
      discRow.hidden = true;
    }
    updateCheckoutButton();

    // Restore coupon UI state.
    const couponInput = /** @type {HTMLInputElement} */ (document.getElementById("coupon-input"));
    if (appliedCoupon && couponInput.value !== appliedCoupon) couponInput.value = appliedCoupon;
    refreshCouponMessage();

    const list = document.getElementById("cart-items");
    list.innerHTML = "";
    if (cart.length === 0) {
      const p = document.createElement("p");
      p.className = "cart-empty";
      p.textContent = "カートに商品はありません";
      list.appendChild(p);
      return;
    }
    cart.forEach((it) => {
      const m = findMenu(it.id);
      if (!m) return;
      const row = document.createElement("div");
      row.className = "cart-item";
      const meta = describeItem(it);
      row.innerHTML = `
        <div class="cart-item-emoji" aria-hidden="true">${m.emoji}</div>
        <div>
          <div class="cart-item-name">${m.name}</div>
          ${meta ? `<div class="cart-item-meta">${meta}</div>` : ""}
          <div class="cart-item-actions">
            <button class="qty-btn" data-action="dec" aria-label="減らす">−</button>
            <span>${it.qty}</span>
            <button class="qty-btn" data-action="inc" aria-label="増やす">＋</button>
            <button class="remove-btn" data-action="remove">削除</button>
          </div>
        </div>
        <div class="cart-item-price">${yen(lineTotal(it))}</div>
      `;
      row.addEventListener("click", (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.dataset.action;
        if (action === "inc") changeQty(it.key, 1);
        else if (action === "dec") changeQty(it.key, -1);
        else if (action === "remove") removeItem(it.key);
      });
      list.appendChild(row);
    });
  }

  function refreshCouponMessage() {
    const msg = document.getElementById("coupon-message");
    if (!appliedCoupon) {
      msg.hidden = true;
      return;
    }
    const c = COUPONS[appliedCoupon];
    if (!c) {
      msg.hidden = false;
      msg.textContent = "クーポンコードが無効です。";
      msg.classList.remove("success");
      return;
    }
    const subtotal = cartSubtotal();
    if (subtotal < c.min) {
      msg.hidden = false;
      msg.textContent = `「${appliedCoupon}」は ${yen(c.min)} 以上から利用可能です。`;
      msg.classList.remove("success");
    } else {
      msg.hidden = false;
      msg.textContent = `「${appliedCoupon}」適用中：${c.label}`;
      msg.classList.add("success");
    }
  }

  function applyCoupon() {
    const input = /** @type {HTMLInputElement} */ (document.getElementById("coupon-input"));
    const code = input.value.trim().toUpperCase();
    if (!code) {
      appliedCoupon = "";
      saveCoupon("");
      updateCart();
      return;
    }
    if (!COUPONS[code]) {
      appliedCoupon = "";
      saveCoupon("");
      const msg = document.getElementById("coupon-message");
      msg.hidden = false;
      msg.classList.remove("success");
      msg.textContent = "クーポンコードが見つかりません。";
      updateCart();
      return;
    }
    appliedCoupon = code;
    saveCoupon(code);
    updateCart();
  }

  function openCart() {
    document.getElementById("cart-drawer").classList.add("open");
    document.getElementById("cart-drawer").setAttribute("aria-hidden", "false");
    document.getElementById("overlay").hidden = false;
  }
  function closeCart() {
    document.getElementById("cart-drawer").classList.remove("open");
    document.getElementById("cart-drawer").setAttribute("aria-hidden", "true");
    document.getElementById("overlay").hidden = true;
  }

  // ---- Checkout & confirm -------------------------------------------------

  function openCheckout() {
    if (cart.length === 0) return;
    const subtotal = cartSubtotal();
    const discount = discountFor(subtotal);
    document.getElementById("summary-subtotal").textContent = yen(subtotal);
    document.getElementById("summary-total").textContent = yen(Math.max(0, subtotal - discount));
    const discRow = document.getElementById("summary-discount-row");
    if (discount > 0) {
      discRow.hidden = false;
      document.getElementById("summary-discount").textContent = "-" + yen(discount);
    } else {
      discRow.hidden = true;
    }
    document.getElementById("checkout-modal").hidden = false;
  }
  function closeCheckout() { document.getElementById("checkout-modal").hidden = true; }

  function showConfirmation(order) {
    document.getElementById("order-number").textContent = order.orderNumber;
    const etaText =
      order.time === "asap"
        ? "最短30分ほどでお届けします。"
        : `約${order.time}分後にお届け予定です。`;
    const storeLine = order.storeName
      ? `${order.storeEmoji || ""} ${order.storeName}からのお届けです。 `
      : "";
    document.getElementById("confirm-eta").textContent =
      `${storeLine}${etaText} お支払いは「${PAYMENT_LABEL[order.payment]}」です。`;

    // Reset progress steps and animate.
    const steps = document.querySelectorAll("#progress-steps li");
    steps.forEach((el) => el.classList.remove("active", "done"));
    document.getElementById("confirm-modal").hidden = false;

    progressTimers.forEach((t) => clearTimeout(t));
    progressTimers = [];
    const sequence = [600, 2200, 4200, 6200];
    steps.forEach((el, i) => {
      progressTimers.push(
        setTimeout(() => {
          steps.forEach((s, j) => {
            s.classList.toggle("done", j < i);
            s.classList.toggle("active", j === i);
          });
        }, sequence[i])
      );
    });
  }

  function makeOrderNumber() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `MM-${stamp}-${rand}`;
  }

  function saveOrderToHistory(order) {
    const existing = loadHistory();
    existing.unshift(order);
    saveHistory(existing);
    renderHistory();
  }

  function renderHistory() {
    const list = document.getElementById("history-list");
    list.innerHTML = "";
    const items = loadHistory();
    if (items.length === 0) {
      const p = document.createElement("p");
      p.className = "history-empty";
      p.textContent = "まだご注文はありません。";
      list.appendChild(p);
      return;
    }
    items.forEach((o) => {
      const card = document.createElement("div");
      card.className = "history-card";
      const date = new Date(o.placedAt);
      const dateStr = date.toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" });
      const itemsHtml = (o.items || [])
        .map((it) => {
          const m = findMenu(it.id);
          if (!m) return "";
          const meta = describeItem(it);
          return `<li>${m.emoji} ${m.name}${meta ? ` <small>(${meta})</small>` : ""} × ${it.qty}</li>`;
        })
        .join("");
      const storeLine = o.storeName ? `${o.storeEmoji || ""} ${o.storeName}` : "";
      card.innerHTML = `
        <h4>${o.orderNumber}</h4>
        ${storeLine ? `<div class="history-store">${storeLine}</div>` : ""}
        <div class="history-meta">${dateStr} / ${o.area || "-"} / ${PAYMENT_LABEL[o.payment] || ""}</div>
        <ul class="history-items">${itemsHtml}</ul>
        <div class="history-total">${yen(o.total)}</div>
      `;
      list.appendChild(card);
    });
  }

  // ---- Theme --------------------------------------------------------------

  function applyInitialTheme() {
    let saved = "";
    try { saved = localStorage.getItem(THEME_KEY) || ""; } catch {}
    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    setTheme(theme);
  }
  function setTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      document.getElementById("theme-toggle").textContent = "☀️";
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.getElementById("theme-toggle").textContent = "🌙";
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }
  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  // ---- UI bindings --------------------------------------------------------

  function bindUI() {
    document.getElementById("cart-button").addEventListener("click", openCart);
    document.getElementById("cart-close").addEventListener("click", closeCart);
    document.getElementById("overlay").addEventListener("click", () => {
      closeCart();
    });
    const ssbChange = document.getElementById("ssb-change");
    if (ssbChange) ssbChange.addEventListener("click", changeStore);
    document.getElementById("checkout-button").addEventListener("click", () => {
      if (!requireStore() || cart.length === 0) return;
      closeCart();
      openCheckout();
    });
    document.getElementById("checkout-close").addEventListener("click", closeCheckout);

    document.getElementById("customize-close").addEventListener("click", closeCustomizeModal);
    document.getElementById("customize-add").addEventListener("click", confirmCustomizeAdd);

    document.getElementById("coupon-apply").addEventListener("click", applyCoupon);
    document.getElementById("coupon-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyCoupon();
      }
    });

    document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((t) => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        activeCategory = tab.dataset.category || "all";
        renderMenu();
      });
    });

    document.getElementById("menu-search").addEventListener("input", (e) => {
      searchTerm = /** @type {HTMLInputElement} */ (e.target).value;
      renderMenu();
    });

    document.getElementById("checkout-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const form = /** @type {HTMLFormElement} */ (e.currentTarget);
      const store = findStore(selectedStoreId);
      if (!store) { requireStore(); return; }
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const data = new FormData(form);
      const subtotal = cartSubtotal();
      const discount = discountFor(subtotal);
      const order = {
        orderNumber: makeOrderNumber(),
        storeId: store.id,
        storeName: store.name,
        storeEmoji: store.emoji,
        storePhone: store.phone,
        name: String(data.get("name") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        area: String(data.get("area") || ""),
        address: String(data.get("address") || "").trim(),
        time: String(data.get("time") || "asap"),
        payment: String(data.get("payment") || "cash"),
        note: String(data.get("note") || "").trim(),
        items: cart.slice(),
        coupon: appliedCoupon || null,
        subtotal,
        discount,
        total: Math.max(0, subtotal - discount),
        placedAt: new Date().toISOString(),
      };

      cart = [];
      appliedCoupon = "";
      saveCart();
      saveCoupon("");
      updateCart();
      form.reset();
      closeCheckout();
      saveOrderToHistory(order);
      showConfirmation(order);
    });

    document.getElementById("confirm-close").addEventListener("click", () => {
      document.getElementById("confirm-modal").hidden = true;
      progressTimers.forEach((t) => clearTimeout(t));
      progressTimers = [];
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const cartDrawer = document.getElementById("cart-drawer");
      if (cartDrawer.classList.contains("open")) closeCart();
      const customize = document.getElementById("customize-modal");
      if (!customize.hidden) closeCustomizeModal();
      const checkout = document.getElementById("checkout-modal");
      if (!checkout.hidden) closeCheckout();
      const confirm = document.getElementById("confirm-modal");
      if (!confirm.hidden) confirm.hidden = true;
    });
  }
})();
