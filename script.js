const spots = [
  {
    name: "西湖",
    pinyin: "Xī Hú / West Lake",
    category: "lake",
    tag: "世界遺産",
    desc: "杭州の象徴。詩人たちが愛してきた湖を取り囲む十景は四季それぞれの表情を見せる。",
    season: "通年",
    duration: "半日〜1日",
  },
  {
    name: "断橋残雪",
    pinyin: "Duànqiáo Cánxuě",
    category: "lake",
    tag: "西湖十景",
    desc: "白居易の詩にも詠まれた橋。雪解けの景観が幻想的で、白蛇伝の舞台としても知られる。",
    season: "冬・春",
    duration: "30分",
  },
  {
    name: "蘇堤春暁",
    pinyin: "Sūdī Chūnxiǎo",
    category: "lake",
    tag: "西湖十景",
    desc: "蘇東坡が築いたといわれる長堤。春には桜と柳が並び、朝霧の風景は格別。",
    season: "春",
    duration: "1〜2時間",
  },
  {
    name: "霊隠寺",
    pinyin: "Língyǐn Sì",
    category: "temple",
    tag: "古刹",
    desc: "東晋時代に建立された杭州最古の禅寺。飛来峰の石窟仏が圧巻。",
    season: "通年",
    duration: "2〜3時間",
  },
  {
    name: "雷峰塔",
    pinyin: "Léifēng Tǎ",
    category: "temple",
    tag: "西湖十景",
    desc: "白蛇伝で知られる古塔。夕陽に染まる「雷峰夕照」は西湖を代表する景観。",
    season: "通年",
    duration: "1〜2時間",
  },
  {
    name: "六和塔",
    pinyin: "Liùhé Tǎ",
    category: "temple",
    tag: "古塔",
    desc: "銭塘江の畔に立つ八角形の楼閣式塔。最上階からの大潮の眺めは雄大。",
    season: "通年（中秋の大潮は必見）",
    duration: "1時間",
  },
  {
    name: "河坊街",
    pinyin: "Héfāng Jiē",
    category: "street",
    tag: "古い街並み",
    desc: "南宋時代の風情を残す石畳の通り。茶館・薬舗・伝統工芸の店が連なる。",
    season: "通年",
    duration: "2〜3時間",
  },
  {
    name: "南宋御街",
    pinyin: "Nánsòng Yùjiē",
    category: "street",
    tag: "歴史",
    desc: "南宋の都・臨安のメインストリートを再現。レトロな建築と老舗が立ち並ぶ。",
    season: "通年",
    duration: "2時間",
  },
  {
    name: "九溪十八澗",
    pinyin: "Jiǔxī Shíbā Jiàn",
    category: "nature",
    tag: "渓谷",
    desc: "茶畑と森を抜ける渓流ハイキング。清流と苔むす石を踏みしめる散策路。",
    season: "春・秋",
    duration: "半日",
  },
  {
    name: "梅家塢茶文化村",
    pinyin: "Méijiāwù",
    category: "nature",
    tag: "茶畑",
    desc: "龍井茶の産地。一面の茶畑を眺めながら、本場の新茶を味わえる。",
    season: "春(清明節前後)",
    duration: "半日",
  },
  {
    name: "京杭大運河",
    pinyin: "Jīng-Háng Dàyùnhé",
    category: "street",
    tag: "世界遺産",
    desc: "北京から続く世界最長の人工運河の終点。拱宸橋周辺の夜景と水運博物館。",
    season: "通年",
    duration: "2〜3時間",
  },
  {
    name: "宋城",
    pinyin: "Sòngchéng",
    category: "street",
    tag: "テーマパーク",
    desc: "南宋の街並みを再現したテーマパーク。「宋城千古情」の歌舞ショーは必見。",
    season: "通年",
    duration: "半日〜1日",
  },
];

const grid = document.getElementById("spotGrid");
const filters = document.querySelectorAll(".filter");

function render(filter = "all") {
  grid.innerHTML = "";
  const list = filter === "all" ? spots : spots.filter((s) => s.category === filter);
  list.forEach((s, idx) => {
    const card = document.createElement("article");
    card.className = "card";
    card.style.animation = `fadeIn .4s ease ${idx * 0.05}s both`;
    card.innerHTML = `
      <span class="card-tag">${s.tag}</span>
      <h3>${s.name}<span class="pin">${s.pinyin}</span></h3>
      <p>${s.desc}</p>
      <div class="card-meta">
        <span>季節: ${s.season}</span>
        <span>所要: ${s.duration}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    filters.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    render(btn.dataset.filter);
  });
});

const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
});

render();
