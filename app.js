/* =========================================================
 * PowerUps - 杭工事管理システム
 * 静的SPA / localStorage永続化
 * ======================================================= */

/* ---------- Constants ---------- */
const PILE_TYPES = [
  "PHC杭", "鋼管杭", "場所打ちコンクリート杭", "SC杭",
  "鋼管ソイルセメント杭", "節杭", "既製コンクリート杭",
];
const PILE_METHODS = [
  "セメントミルク工法（プレボーリング）",
  "中堀り工法",
  "打撃工法",
  "アースドリル工法",
  "リバース工法",
  "オールケーシング工法",
  "鋼管ソイルセメント工法",
];
const STATUS_LABEL = {
  pending: "未着手",
  in_progress: "施工中",
  completed: "完了",
};
const STORAGE_KEY = "powerups.v1";
const STATE_KEY = "powerups.state";

/* 杭芯許容ズレ (mm) — 一般値 */
const DEVIATION_TOLERANCE = 100;

/* ---------- Store ---------- */
const Store = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { projects: [], piles: [], records: [] };
      return JSON.parse(raw);
    } catch (e) {
      console.error("Store load failed", e);
      return { projects: [], piles: [], records: [] };
    }
  },
  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  reset() { localStorage.removeItem(STORAGE_KEY); },
  uiState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); }
    catch { return {}; }
  },
  saveUi(s) { localStorage.setItem(STATE_KEY, JSON.stringify(s)); },
};

let DB = Store.load();
let UI = Store.uiState();

function persist() { Store.save(DB); }
function persistUi() { Store.saveUi(UI); }

/* ---------- Utils ---------- */
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
const fmt = (n, d = 1) =>
  n == null || n === "" || isNaN(n) ? "—" : Number(n).toFixed(d);
const today = () => new Date().toISOString().slice(0, 10);

function toast(msg, ms = 2000) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), ms);
}

function confirmAction(msg) { return window.confirm(msg); }

/* ---------- Selectors ---------- */
const getProject = (id) => DB.projects.find((p) => p.id === id);
const getPile = (id) => DB.piles.find((p) => p.id === id);
const getRecord = (id) => DB.records.find((r) => r.id === id);
const pilesOf = (pid) => DB.piles.filter((p) => p.projectId === pid);
const recordsOf = (pileId) => DB.records.filter((r) => r.pileId === pileId);

function pileStatus(pile) {
  const recs = recordsOf(pile.id);
  if (recs.length === 0) return "pending";
  if (recs.some((r) => r.completed)) return "completed";
  return "in_progress";
}

function pileLatestDeviation(pile) {
  const recs = recordsOf(pile.id);
  if (!recs.length) return null;
  const r = recs[recs.length - 1];
  if (r.deviationX == null || r.deviationY == null) return null;
  const d = Math.sqrt(Number(r.deviationX) ** 2 + Number(r.deviationY) ** 2);
  return { dx: r.deviationX, dy: r.deviationY, d };
}

/* ---------- Seed ---------- */
function seed() {
  const p1 = {
    id: uid(),
    name: "東京都港区 ○○ビル新築工事",
    address: "東京都港区芝浦4-1-1",
    client: "○○不動産株式会社",
    contractor: "大手ゼネコン株式会社",
    startDate: "2025-04-01",
    endDate: "2027-03-31",
    pileMethod: PILE_METHODS[0],
    foreman: "田中 一郎",
    note: "地下3階・地上18階建。支持層はN値50以上の砂礫層（GL-28m前後）。",
    createdAt: new Date().toISOString(),
  };
  const p2 = {
    id: uid(),
    name: "横浜市西区 物流センター基礎工事",
    address: "横浜市西区みなとみらい6-2",
    client: "△△物流株式会社",
    contractor: "中堅建設株式会社",
    startDate: "2025-09-15",
    endDate: "2026-08-31",
    pileMethod: PILE_METHODS[1],
    foreman: "佐藤 健",
    note: "鋼管杭φ800、L=32m、本数120本。",
    createdAt: new Date().toISOString(),
  };
  DB.projects.push(p1, p2);

  /* p1 に 5x4=20本 PHC杭を格子配置 */
  const piles1 = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      piles1.push({
        id: uid(),
        projectId: p1.id,
        no: `A-${String(r * 5 + c + 1).padStart(3, "0")}`,
        x: 5000 + c * 6000,
        y: 5000 + r * 5000,
        type: "PHC杭",
        diameter: 600,
        length: 28,
        bearingDepth: 28.5,
        designLevel: -2.5,
        createdAt: new Date().toISOString(),
      });
    }
  }
  DB.piles.push(...piles1);

  /* p2 にも 3x4 鋼管杭 */
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      DB.piles.push({
        id: uid(),
        projectId: p2.id,
        no: `S-${String(r * 4 + c + 1).padStart(3, "0")}`,
        x: 4000 + c * 7000,
        y: 4000 + r * 6000,
        type: "鋼管杭",
        diameter: 800,
        length: 32,
        bearingDepth: 32.0,
        designLevel: -3.0,
        createdAt: new Date().toISOString(),
      });
    }
  }

  /* 最初の6本に施工記録を入れる（うち1本は許容超え） */
  piles1.slice(0, 6).forEach((pile, i) => {
    const completed = i < 5;
    const dx = i === 5 ? 80 : Math.round((Math.random() - 0.5) * 60);
    const dy = i === 5 ? 70 : Math.round((Math.random() - 0.5) * 60);
    DB.records.push({
      id: uid(),
      pileId: pile.id,
      date: `2025-04-${String(10 + i).padStart(2, "0")}`,
      startTime: "08:30",
      endTime: "11:45",
      weather: i % 2 ? "晴" : "曇",
      temperature: 18 + i,
      drillDepth: pile.bearingDepth + 0.5,
      gravelDepth: pile.bearingDepth + 1.0,
      deviationX: dx,
      deviationY: dy,
      verticality: 1 / (200 + Math.floor(Math.random() * 100)),
      current: 120 + i * 2,
      integratedCurrent: 18000 + i * 200,
      cementMilkAmount: 850,
      cementMilkRatio: 60,
      pileHeadLevel: pile.designLevel + (Math.random() - 0.5) * 0.05,
      operator: "山本 太郎",
      machineOperator: "鈴木 次郎",
      witness: "監理者 高橋",
      note: i === 5 ? "杭芯位置のズレが大きい。要再測量・是正検討。" : "良好。",
      completed,
      createdAt: new Date().toISOString(),
    });
  });

  persist();
}

/* ---------- Router ---------- */
const routes = [];
function route(pattern, render) {
  const keys = [];
  const re = new RegExp(
    "^" + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }) + "$"
  );
  routes.push({ re, keys, render });
}

function navigate() {
  const hash = location.hash.replace(/^#/, "") || "/";
  for (const r of routes) {
    const m = hash.match(r.re);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      r.render(params);
      highlightNav(hash);
      window.scrollTo(0, 0);
      return;
    }
  }
  document.getElementById("app").innerHTML = view404();
}

function highlightNav(hash) {
  const map = [
    ["dashboard", /^\/$/],
    ["projects", /^\/projects/],
    ["piles", /^\/piles/],
    ["records", /^\/records/],
    ["layout", /^\/layout/],
    ["reports", /^\/reports/],
    ["settings", /^\/settings/],
  ];
  let active = null;
  for (const [name, re] of map) if (re.test(hash)) { active = name; break; }
  document.querySelectorAll(".sidenav a").forEach((a) => {
    a.classList.toggle("is-active", a.dataset.nav === active);
  });
  const lbl = document.getElementById("currentProjectLabel");
  if (UI.currentProjectId) {
    const p = getProject(UI.currentProjectId);
    lbl.textContent = p ? `現場: ${p.name}` : "";
  } else lbl.textContent = "";
}

function go(path) { location.hash = "#" + path; }

/* ---------- Common helpers ---------- */
function statusBadge(s) {
  return `<span class="badge ${s}">${STATUS_LABEL[s] || s}</span>`;
}

function deviationBadge(d) {
  if (!d) return `<span class="badge pending">未測定</span>`;
  const over = d.d > DEVIATION_TOLERANCE;
  return over
    ? `<span class="badge alert">許容超過 ${fmt(d.d, 0)}mm</span>`
    : `<span class="badge completed">良 ${fmt(d.d, 0)}mm</span>`;
}

function setCurrentProject(id) {
  UI.currentProjectId = id || null;
  persistUi();
  highlightNav(location.hash.replace(/^#/, ""));
}

function render(html) {
  document.getElementById("app").innerHTML = html;
}

function on(selector, event, handler, root = document) {
  root.querySelectorAll(selector).forEach((el) => el.addEventListener(event, handler));
}

function readForm(form) {
  const data = {};
  new FormData(form).forEach((v, k) => {
    data[k] = typeof v === "string" ? v.trim() : v;
  });
  return data;
}

/* ---------- Views ---------- */

/* Dashboard */
function viewDashboard() {
  const totalPiles = DB.piles.length;
  const done = DB.piles.filter((p) => pileStatus(p) === "completed").length;
  const wip = DB.piles.filter((p) => pileStatus(p) === "in_progress").length;
  const pending = totalPiles - done - wip;
  const overTol = DB.piles.filter((p) => {
    const d = pileLatestDeviation(p);
    return d && d.d > DEVIATION_TOLERANCE;
  }).length;

  const recent = [...DB.records]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 8);

  render(`
    <div class="page-head">
      <div>
        <h1>ダッシュボード</h1>
        <div class="sub">${esc(today())} 時点の進捗概況</div>
      </div>
      <div class="page-actions">
        <a class="btn btn-primary" href="#/projects/new">＋ 新規案件</a>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi is-brand">
        <div class="kpi-label">案件数</div>
        <div class="kpi-value">${DB.projects.length}<span class="unit">件</span></div>
      </div>
      <div class="kpi is-accent">
        <div class="kpi-label">登録杭数</div>
        <div class="kpi-value">${totalPiles}<span class="unit">本</span></div>
      </div>
      <div class="kpi is-ok">
        <div class="kpi-label">完了</div>
        <div class="kpi-value">${done}<span class="unit">本</span></div>
        <div class="kpi-foot">進捗 ${totalPiles ? Math.round((done / totalPiles) * 100) : 0}%</div>
      </div>
      <div class="kpi is-warn">
        <div class="kpi-label">施工中</div>
        <div class="kpi-value">${wip}<span class="unit">本</span></div>
        <div class="kpi-foot">未着手 ${pending}本</div>
      </div>
      <div class="kpi" style="border-top:3px solid var(--bad);">
        <div class="kpi-label">許容超過</div>
        <div class="kpi-value" style="color:var(--bad);">${overTol}<span class="unit">本</span></div>
        <div class="kpi-foot">杭芯ズレ &gt; ${DEVIATION_TOLERANCE}mm</div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h2>案件一覧</h2>
        <a href="#/projects" class="btn-ghost">すべて見る →</a>
      </div>
      ${
        DB.projects.length === 0
          ? emptyBlock("案件が登録されていません", "「設定」からサンプルデータを投入するか、新規案件を作成してください。", "#/projects/new", "案件を作成")
          : projectsTable(DB.projects.slice(0, 5))
      }
    </div>

    <div class="card">
      <div class="card-head">
        <h2>直近の施工記録</h2>
        <a href="#/records" class="btn-ghost">すべて見る →</a>
      </div>
      ${recent.length === 0 ? emptyBlock("記録なし", "施工記録はまだ登録されていません。") : recordsTable(recent)}
    </div>
  `);
}

/* Projects list */
function viewProjects() {
  render(`
    <div class="page-head">
      <div>
        <h1>案件管理</h1>
        <div class="sub">登録されている工事案件の一覧です。</div>
      </div>
      <div class="page-actions">
        <a class="btn btn-primary" href="#/projects/new">＋ 新規案件</a>
      </div>
    </div>
    <div class="card">
      ${DB.projects.length === 0
        ? emptyBlock("案件が登録されていません", "「新規案件」から登録を開始してください。", "#/projects/new", "案件を作成")
        : projectsTable(DB.projects)}
    </div>
  `);
}

function projectsTable(list) {
  return `
    <div class="table-wrap">
      <table class="data">
        <thead><tr>
          <th>現場名</th><th>所在地</th><th>元請</th><th>工法</th>
          <th class="num">杭数</th><th class="num">完了率</th>
          <th>工期</th><th class="row-actions">操作</th>
        </tr></thead>
        <tbody>
          ${list.map((p) => {
            const piles = pilesOf(p.id);
            const done = piles.filter((x) => pileStatus(x) === "completed").length;
            const rate = piles.length ? Math.round((done / piles.length) * 100) : 0;
            return `
              <tr>
                <td><a href="#/projects/${p.id}"><strong>${esc(p.name)}</strong></a></td>
                <td>${esc(p.address || "—")}</td>
                <td>${esc(p.contractor || "—")}</td>
                <td>${esc(p.pileMethod || "—")}</td>
                <td class="num">${piles.length}</td>
                <td class="num">${rate}%</td>
                <td>${esc(p.startDate || "")} 〜 ${esc(p.endDate || "")}</td>
                <td class="row-actions">
                  <a class="btn btn-sm" href="#/projects/${p.id}">詳細</a>
                  <a class="btn btn-sm" href="#/projects/${p.id}/edit">編集</a>
                </td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* New / Edit project */
function viewProjectForm(params) {
  const editing = !!params.id;
  const p = editing ? getProject(params.id) : null;
  if (editing && !p) return render(view404());

  render(`
    <div class="crumbs">
      <a href="#/projects">案件管理</a><span class="sep">/</span>
      ${editing ? esc(p.name) + ' <span class="sep">/</span> 編集' : "新規作成"}
    </div>
    <div class="page-head">
      <h1>${editing ? "案件編集" : "新規案件登録"}</h1>
    </div>
    <form id="projectForm" class="card">
      <div class="form-grid">
        <div class="field full">
          <label>現場名 <span class="required">*</span></label>
          <input name="name" required value="${esc(p?.name || "")}" placeholder="例: 東京都港区 ○○ビル新築工事" />
        </div>
        <div class="field full">
          <label>所在地</label>
          <input name="address" value="${esc(p?.address || "")}" />
        </div>
        <div class="field">
          <label>施主</label>
          <input name="client" value="${esc(p?.client || "")}" />
        </div>
        <div class="field">
          <label>元請</label>
          <input name="contractor" value="${esc(p?.contractor || "")}" />
        </div>
        <div class="field">
          <label>工法</label>
          <select name="pileMethod">
            ${PILE_METHODS.map((m) => `<option ${p?.pileMethod === m ? "selected" : ""}>${esc(m)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>現場代理人</label>
          <input name="foreman" value="${esc(p?.foreman || "")}" />
        </div>
        <div class="field">
          <label>着工日</label>
          <input name="startDate" type="date" value="${esc(p?.startDate || "")}" />
        </div>
        <div class="field">
          <label>竣工予定</label>
          <input name="endDate" type="date" value="${esc(p?.endDate || "")}" />
        </div>
        <div class="field full">
          <label>備考</label>
          <textarea name="note">${esc(p?.note || "")}</textarea>
        </div>
      </div>
      <div class="form-actions">
        <a class="btn" href="#/projects">キャンセル</a>
        ${editing ? `<button type="button" class="btn btn-danger" id="deleteBtn">削除</button>` : ""}
        <button type="submit" class="btn btn-primary">${editing ? "更新する" : "登録する"}</button>
      </div>
    </form>
  `);

  document.getElementById("projectForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = readForm(e.target);
    if (!data.name) return toast("現場名は必須です");
    if (editing) {
      Object.assign(p, data);
      toast("案件を更新しました");
    } else {
      const np = { id: uid(), createdAt: new Date().toISOString(), ...data };
      DB.projects.push(np);
      setCurrentProject(np.id);
      toast("案件を登録しました");
      persist();
      return go(`/projects/${np.id}`);
    }
    persist();
    go("/projects");
  });

  if (editing) {
    document.getElementById("deleteBtn").addEventListener("click", () => {
      if (!confirmAction(`案件「${p.name}」と関連する杭・記録をすべて削除します。よろしいですか？`)) return;
      const pileIds = pilesOf(p.id).map((x) => x.id);
      DB.records = DB.records.filter((r) => !pileIds.includes(r.pileId));
      DB.piles = DB.piles.filter((x) => x.projectId !== p.id);
      DB.projects = DB.projects.filter((x) => x.id !== p.id);
      if (UI.currentProjectId === p.id) setCurrentProject(null);
      persist();
      toast("削除しました");
      go("/projects");
    });
  }
}

/* Project detail */
function viewProjectDetail(params) {
  const p = getProject(params.id);
  if (!p) return render(view404());
  setCurrentProject(p.id);

  const piles = pilesOf(p.id);
  const done = piles.filter((x) => pileStatus(x) === "completed").length;
  const wip = piles.filter((x) => pileStatus(x) === "in_progress").length;
  const overTol = piles.filter((x) => {
    const d = pileLatestDeviation(x);
    return d && d.d > DEVIATION_TOLERANCE;
  }).length;

  render(`
    <div class="crumbs">
      <a href="#/projects">案件管理</a><span class="sep">/</span>${esc(p.name)}
    </div>
    <div class="page-head">
      <div>
        <h1>${esc(p.name)}</h1>
        <div class="sub">${esc(p.address || "—")} ／ ${esc(p.pileMethod || "—")}</div>
      </div>
      <div class="page-actions">
        <a class="btn" href="#/projects/${p.id}/edit">案件編集</a>
        <a class="btn btn-accent" href="#/layout">配置図を見る</a>
        <a class="btn btn-primary" href="#/piles/new">＋ 杭を追加</a>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi is-brand">
        <div class="kpi-label">杭数</div>
        <div class="kpi-value">${piles.length}<span class="unit">本</span></div>
      </div>
      <div class="kpi is-ok">
        <div class="kpi-label">完了</div>
        <div class="kpi-value">${done}<span class="unit">本</span></div>
        <div class="kpi-foot">${piles.length ? Math.round((done / piles.length) * 100) : 0}%</div>
      </div>
      <div class="kpi is-warn">
        <div class="kpi-label">施工中</div>
        <div class="kpi-value">${wip}<span class="unit">本</span></div>
      </div>
      <div class="kpi" style="border-top:3px solid var(--bad);">
        <div class="kpi-label">許容超過</div>
        <div class="kpi-value" style="color:var(--bad);">${overTol}<span class="unit">本</span></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h2>案件情報</h2>
      </div>
      <div class="form-grid">
        <div class="stat"><div class="stat-label">施主</div><div class="stat-value">${esc(p.client || "—")}</div></div>
        <div class="stat"><div class="stat-label">元請</div><div class="stat-value">${esc(p.contractor || "—")}</div></div>
        <div class="stat"><div class="stat-label">現場代理人</div><div class="stat-value">${esc(p.foreman || "—")}</div></div>
        <div class="stat"><div class="stat-label">工期</div><div class="stat-value">${esc(p.startDate || "")} 〜 ${esc(p.endDate || "")}</div></div>
      </div>
      ${p.note ? `<p style="margin-top:1rem;color:var(--ink-soft);">${esc(p.note)}</p>` : ""}
    </div>

    <div class="card">
      <div class="card-head">
        <h2>杭一覧</h2>
        <div>
          <a href="#/reports" class="btn btn-sm">CSV出力 →</a>
        </div>
      </div>
      ${piles.length === 0
        ? emptyBlock("杭が登録されていません", "「＋ 杭を追加」から登録できます。", "#/piles/new", "杭を追加")
        : pilesTable(piles)}
    </div>
  `);
}

/* Piles list */
function viewPiles() {
  const pid = UI.currentProjectId;
  const p = pid ? getProject(pid) : null;
  const piles = pid ? pilesOf(pid) : DB.piles;

  render(`
    <div class="page-head">
      <div>
        <h1>杭一覧</h1>
        <div class="sub">${p ? `現場: ${esc(p.name)}` : "全案件の杭"}</div>
      </div>
      <div class="page-actions">
        ${projectSelector(pid)}
        <a class="btn btn-primary" href="#/piles/new">＋ 杭を追加</a>
      </div>
    </div>
    <div class="card">
      ${piles.length === 0
        ? emptyBlock("杭がありません", "杭を追加してください。", "#/piles/new", "杭を追加")
        : pilesTable(piles)}
    </div>
  `);

  document.getElementById("projSelect")?.addEventListener("change", (e) => {
    setCurrentProject(e.target.value || null);
    viewPiles();
  });
}

function projectSelector(currentId) {
  return `
    <select id="projSelect" class="btn" style="padding:0.55rem 0.7rem;">
      <option value="">（全案件）</option>
      ${DB.projects.map((p) =>
        `<option value="${p.id}" ${p.id === currentId ? "selected" : ""}>${esc(p.name)}</option>`
      ).join("")}
    </select>
  `;
}

function pilesTable(list) {
  return `
    <div class="table-wrap">
      <table class="data">
        <thead><tr>
          <th>杭No.</th><th>杭種</th>
          <th class="num">径 (mm)</th><th class="num">長 (m)</th>
          <th class="num">X (mm)</th><th class="num">Y (mm)</th>
          <th>状態</th><th>杭芯ズレ</th>
          <th class="row-actions">操作</th>
        </tr></thead>
        <tbody>
          ${list.map((pile) => {
            const st = pileStatus(pile);
            const dev = pileLatestDeviation(pile);
            return `
              <tr>
                <td><a href="#/piles/${pile.id}"><strong>${esc(pile.no)}</strong></a></td>
                <td>${esc(pile.type || "—")}</td>
                <td class="num">${pile.diameter ?? "—"}</td>
                <td class="num">${pile.length ?? "—"}</td>
                <td class="num">${pile.x ?? "—"}</td>
                <td class="num">${pile.y ?? "—"}</td>
                <td>${statusBadge(st)}</td>
                <td>${deviationBadge(dev)}</td>
                <td class="row-actions">
                  <a class="btn btn-sm" href="#/piles/${pile.id}">詳細</a>
                </td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* New / Edit pile */
function viewPileForm(params) {
  const editing = !!params.id;
  const pile = editing ? getPile(params.id) : null;
  if (editing && !pile) return render(view404());

  if (!editing && !UI.currentProjectId && DB.projects.length === 0) {
    return render(`
      <div class="page-head"><h1>杭の登録</h1></div>
      ${emptyBlock("先に案件を作成してください", "杭は案件に紐づきます。", "#/projects/new", "案件を作成")}
    `);
  }

  const projectId = editing ? pile.projectId : (UI.currentProjectId || DB.projects[0]?.id);

  render(`
    <div class="crumbs">
      <a href="#/piles">杭一覧</a><span class="sep">/</span>${editing ? esc(pile.no) + " 編集" : "新規登録"}
    </div>
    <div class="page-head">
      <h1>${editing ? "杭情報編集" : "杭新規登録"}</h1>
    </div>
    <form id="pileForm" class="card">
      <div class="form-grid">
        <div class="field">
          <label>案件 <span class="required">*</span></label>
          <select name="projectId" required ${editing ? "disabled" : ""}>
            ${DB.projects.map((p) =>
              `<option value="${p.id}" ${p.id === projectId ? "selected" : ""}>${esc(p.name)}</option>`
            ).join("")}
          </select>
        </div>
        <div class="field">
          <label>杭No. <span class="required">*</span></label>
          <input name="no" required value="${esc(pile?.no || "")}" placeholder="例: A-001" />
        </div>
        <div class="field">
          <label>杭種</label>
          <select name="type">
            ${PILE_TYPES.map((t) => `<option ${pile?.type === t ? "selected" : ""}>${esc(t)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>杭径</label>
          <div class="field-row">
            <input name="diameter" type="number" step="1" value="${pile?.diameter ?? ""}" />
            <span class="unit-tag">mm</span>
          </div>
        </div>
        <div class="field">
          <label>杭長</label>
          <div class="field-row">
            <input name="length" type="number" step="0.1" value="${pile?.length ?? ""}" />
            <span class="unit-tag">m</span>
          </div>
        </div>
        <div class="field">
          <label>設計支持層深度</label>
          <div class="field-row">
            <input name="bearingDepth" type="number" step="0.1" value="${pile?.bearingDepth ?? ""}" />
            <span class="unit-tag">m</span>
          </div>
        </div>
        <div class="field">
          <label>設計杭頭レベル</label>
          <div class="field-row">
            <input name="designLevel" type="number" step="0.01" value="${pile?.designLevel ?? ""}" />
            <span class="unit-tag">m (GL基準)</span>
          </div>
        </div>
        <div class="form-section-title" style="grid-column:1/-1;">設計杭芯座標</div>
        <div class="field">
          <label>X座標</label>
          <div class="field-row">
            <input name="x" type="number" step="1" value="${pile?.x ?? ""}" />
            <span class="unit-tag">mm</span>
          </div>
        </div>
        <div class="field">
          <label>Y座標</label>
          <div class="field-row">
            <input name="y" type="number" step="1" value="${pile?.y ?? ""}" />
            <span class="unit-tag">mm</span>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <a class="btn" href="#/piles">キャンセル</a>
        ${editing ? `<button type="button" class="btn btn-danger" id="deleteBtn">削除</button>` : ""}
        <button type="submit" class="btn btn-primary">${editing ? "更新する" : "登録する"}</button>
      </div>
    </form>
  `);

  document.getElementById("pileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = readForm(e.target);
    ["diameter", "length", "bearingDepth", "designLevel", "x", "y"].forEach((k) => {
      data[k] = data[k] === "" || data[k] == null ? null : Number(data[k]);
    });
    if (!data.no) return toast("杭No.は必須です");
    if (editing) {
      Object.assign(pile, data);
      toast("杭情報を更新しました");
    } else {
      data.projectId = data.projectId || projectId;
      DB.piles.push({ id: uid(), createdAt: new Date().toISOString(), ...data });
      toast("杭を登録しました");
    }
    persist();
    go("/piles");
  });

  if (editing) {
    document.getElementById("deleteBtn").addEventListener("click", () => {
      if (!confirmAction(`杭「${pile.no}」と関連する施工記録を削除します。よろしいですか？`)) return;
      DB.records = DB.records.filter((r) => r.pileId !== pile.id);
      DB.piles = DB.piles.filter((x) => x.id !== pile.id);
      persist();
      toast("削除しました");
      go("/piles");
    });
  }
}

/* Pile detail (with records) */
function viewPileDetail(params) {
  const pile = getPile(params.id);
  if (!pile) return render(view404());
  const project = getProject(pile.projectId);
  if (project) setCurrentProject(project.id);
  const recs = recordsOf(pile.id).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const dev = pileLatestDeviation(pile);
  const st = pileStatus(pile);

  render(`
    <div class="crumbs">
      <a href="#/projects">案件管理</a><span class="sep">/</span>
      <a href="#/projects/${project?.id}">${esc(project?.name || "")}</a><span class="sep">/</span>
      杭 ${esc(pile.no)}
    </div>
    <div class="page-head">
      <div>
        <h1>杭 ${esc(pile.no)} <span style="font-size:0.9rem;color:var(--ink-mute);font-weight:400;">${esc(pile.type || "")}</span></h1>
        <div class="sub">${statusBadge(st)} ${deviationBadge(dev)}</div>
      </div>
      <div class="page-actions">
        <a class="btn" href="#/piles/${pile.id}/edit">杭編集</a>
        <a class="btn btn-primary" href="#/piles/${pile.id}/records/new">＋ 施工記録を追加</a>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h2>杭情報</h2></div>
      <div class="stat-row">
        <div class="stat"><div class="stat-label">杭径</div><div class="stat-value">${pile.diameter ?? "—"} mm</div></div>
        <div class="stat"><div class="stat-label">杭長</div><div class="stat-value">${pile.length ?? "—"} m</div></div>
        <div class="stat"><div class="stat-label">支持層深度</div><div class="stat-value">${pile.bearingDepth ?? "—"} m</div></div>
        <div class="stat"><div class="stat-label">設計杭頭レベル</div><div class="stat-value">${pile.designLevel ?? "—"} m</div></div>
        <div class="stat"><div class="stat-label">X座標</div><div class="stat-value">${pile.x ?? "—"} mm</div></div>
        <div class="stat"><div class="stat-label">Y座標</div><div class="stat-value">${pile.y ?? "—"} mm</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h2>施工記録（${recs.length}件）</h2></div>
      ${recs.length === 0
        ? emptyBlock("記録なし", "施工記録を追加してください。", `#/piles/${pile.id}/records/new`, "記録を追加")
        : recordsDetailTable(recs, pile)}
    </div>
  `);
}

function recordsDetailTable(list, pile) {
  return `
    <div class="table-wrap">
      <table class="data">
        <thead><tr>
          <th>施工日</th><th>時間</th><th>天候</th>
          <th class="num">削孔深 (m)</th><th class="num">根固め深 (m)</th>
          <th class="num">ΔX (mm)</th><th class="num">ΔY (mm)</th>
          <th class="num">合成 (mm)</th><th>鉛直度</th>
          <th class="num">電流積算</th><th>完了</th><th>操作</th>
        </tr></thead>
        <tbody>
          ${list.map((r) => {
            const d = (r.deviationX != null && r.deviationY != null)
              ? Math.sqrt(Number(r.deviationX) ** 2 + Number(r.deviationY) ** 2) : null;
            const over = d != null && d > DEVIATION_TOLERANCE;
            return `
              <tr>
                <td>${esc(r.date || "—")}</td>
                <td>${esc(r.startTime || "")}〜${esc(r.endTime || "")}</td>
                <td>${esc(r.weather || "—")}</td>
                <td class="num">${fmt(r.drillDepth, 2)}</td>
                <td class="num">${fmt(r.gravelDepth, 2)}</td>
                <td class="num">${r.deviationX ?? "—"}</td>
                <td class="num">${r.deviationY ?? "—"}</td>
                <td class="num" style="${over ? "color:var(--bad);font-weight:700;" : ""}">${d != null ? fmt(d, 0) : "—"}</td>
                <td>${r.verticality ? "1/" + Math.round(1 / r.verticality) : "—"}</td>
                <td class="num">${r.integratedCurrent ?? "—"}</td>
                <td>${r.completed ? `<span class="badge completed">完了</span>` : `<span class="badge in_progress">進行</span>`}</td>
                <td class="row-actions"><a class="btn btn-sm" href="#/records/${r.id}/edit">編集</a></td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* Record form */
function viewRecordForm(params) {
  const editing = !!params.rid;
  const r = editing ? getRecord(params.rid) : null;
  if (editing && !r) return render(view404());
  const pile = getPile(editing ? r.pileId : params.id);
  if (!pile) return render(view404());
  const project = getProject(pile.projectId);
  if (project) setCurrentProject(project.id);

  render(`
    <div class="crumbs">
      <a href="#/projects/${project.id}">${esc(project.name)}</a><span class="sep">/</span>
      <a href="#/piles/${pile.id}">杭 ${esc(pile.no)}</a><span class="sep">/</span>
      ${editing ? "記録編集" : "記録追加"}
    </div>
    <div class="page-head">
      <h1>施工記録 ${editing ? "編集" : "追加"} - 杭 ${esc(pile.no)}</h1>
    </div>
    <form id="recordForm" class="card">
      <div class="form-section-title">基本情報</div>
      <div class="form-grid">
        <div class="field">
          <label>施工日 <span class="required">*</span></label>
          <input name="date" type="date" required value="${esc(r?.date || today())}" />
        </div>
        <div class="field">
          <label>開始時刻</label>
          <input name="startTime" type="time" value="${esc(r?.startTime || "")}" />
        </div>
        <div class="field">
          <label>終了時刻</label>
          <input name="endTime" type="time" value="${esc(r?.endTime || "")}" />
        </div>
        <div class="field">
          <label>天候</label>
          <select name="weather">
            ${["", "晴", "曇", "雨", "雪"].map((w) =>
              `<option ${r?.weather === w ? "selected" : ""}>${w}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>気温</label>
          <div class="field-row">
            <input name="temperature" type="number" step="0.1" value="${r?.temperature ?? ""}" />
            <span class="unit-tag">℃</span>
          </div>
        </div>
      </div>

      <div class="form-section-title">削孔・根固め</div>
      <div class="form-grid">
        <div class="field">
          <label>削孔深度</label>
          <div class="field-row">
            <input name="drillDepth" type="number" step="0.01" value="${r?.drillDepth ?? ""}" />
            <span class="unit-tag">m</span>
          </div>
          <span class="hint">設計支持層: ${pile.bearingDepth ?? "—"} m</span>
        </div>
        <div class="field">
          <label>根固め深度</label>
          <div class="field-row">
            <input name="gravelDepth" type="number" step="0.01" value="${r?.gravelDepth ?? ""}" />
            <span class="unit-tag">m</span>
          </div>
        </div>
        <div class="field">
          <label>セメントミルク量</label>
          <div class="field-row">
            <input name="cementMilkAmount" type="number" step="1" value="${r?.cementMilkAmount ?? ""}" />
            <span class="unit-tag">L</span>
          </div>
        </div>
        <div class="field">
          <label>W/C比</label>
          <div class="field-row">
            <input name="cementMilkRatio" type="number" step="1" value="${r?.cementMilkRatio ?? ""}" />
            <span class="unit-tag">%</span>
          </div>
        </div>
      </div>

      <div class="form-section-title">杭芯位置・精度</div>
      <div class="form-grid">
        <div class="field">
          <label>杭芯ズレ X方向</label>
          <div class="field-row">
            <input name="deviationX" type="number" step="1" value="${r?.deviationX ?? ""}" />
            <span class="unit-tag">mm</span>
          </div>
          <span class="hint">許容: ±${DEVIATION_TOLERANCE}mm</span>
        </div>
        <div class="field">
          <label>杭芯ズレ Y方向</label>
          <div class="field-row">
            <input name="deviationY" type="number" step="1" value="${r?.deviationY ?? ""}" />
            <span class="unit-tag">mm</span>
          </div>
        </div>
        <div class="field">
          <label>鉛直度 (1/n)</label>
          <div class="field-row">
            <span class="unit-tag">1/</span>
            <input name="verticalityN" type="number" step="1" value="${r?.verticality ? Math.round(1 / r.verticality) : ""}" />
          </div>
          <span class="hint">許容: 1/100 以上</span>
        </div>
        <div class="field">
          <label>杭頭レベル</label>
          <div class="field-row">
            <input name="pileHeadLevel" type="number" step="0.01" value="${r?.pileHeadLevel ?? ""}" />
            <span class="unit-tag">m</span>
          </div>
          <span class="hint">設計: ${pile.designLevel ?? "—"} m</span>
        </div>
      </div>

      <div class="form-section-title">施工管理</div>
      <div class="form-grid">
        <div class="field">
          <label>電流値</label>
          <div class="field-row">
            <input name="current" type="number" step="0.1" value="${r?.current ?? ""}" />
            <span class="unit-tag">A</span>
          </div>
        </div>
        <div class="field">
          <label>積分電流値</label>
          <div class="field-row">
            <input name="integratedCurrent" type="number" step="1" value="${r?.integratedCurrent ?? ""}" />
            <span class="unit-tag">A·s</span>
          </div>
        </div>
        <div class="field">
          <label>担当者</label>
          <input name="operator" value="${esc(r?.operator || "")}" />
        </div>
        <div class="field">
          <label>機長（オペレータ）</label>
          <input name="machineOperator" value="${esc(r?.machineOperator || "")}" />
        </div>
        <div class="field">
          <label>立会者</label>
          <input name="witness" value="${esc(r?.witness || "")}" />
        </div>
        <div class="field full">
          <label>備考</label>
          <textarea name="note">${esc(r?.note || "")}</textarea>
        </div>
        <div class="field full">
          <label><input type="checkbox" name="completed" ${r?.completed ? "checked" : ""} /> この記録で杭施工を完了とする</label>
        </div>
      </div>

      <div class="form-actions">
        <a class="btn" href="#/piles/${pile.id}">キャンセル</a>
        ${editing ? `<button type="button" class="btn btn-danger" id="deleteBtn">削除</button>` : ""}
        <button type="submit" class="btn btn-primary">${editing ? "更新する" : "登録する"}</button>
      </div>
    </form>
  `);

  document.getElementById("recordForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const data = readForm(form);
    [
      "temperature", "drillDepth", "gravelDepth", "cementMilkAmount",
      "cementMilkRatio", "deviationX", "deviationY", "current",
      "integratedCurrent", "pileHeadLevel",
    ].forEach((k) => { data[k] = data[k] === "" ? null : Number(data[k]); });
    if (data.verticalityN) {
      data.verticality = 1 / Number(data.verticalityN);
    } else {
      data.verticality = null;
    }
    delete data.verticalityN;
    data.completed = form.completed.checked;

    if (editing) {
      Object.assign(r, data);
      toast("記録を更新しました");
    } else {
      DB.records.push({
        id: uid(),
        pileId: pile.id,
        createdAt: new Date().toISOString(),
        ...data,
      });
      toast("記録を登録しました");
    }
    persist();
    go(`/piles/${pile.id}`);
  });

  if (editing) {
    document.getElementById("deleteBtn").addEventListener("click", () => {
      if (!confirmAction("この施工記録を削除します。よろしいですか？")) return;
      DB.records = DB.records.filter((x) => x.id !== r.id);
      persist();
      toast("削除しました");
      go(`/piles/${pile.id}`);
    });
  }
}

/* Records list */
function viewRecords() {
  const pid = UI.currentProjectId;
  let list = DB.records.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (pid) {
    const pileIds = pilesOf(pid).map((x) => x.id);
    list = list.filter((r) => pileIds.includes(r.pileId));
  }
  render(`
    <div class="page-head">
      <div><h1>施工記録</h1></div>
      <div class="page-actions">${projectSelector(pid)}</div>
    </div>
    <div class="card">
      ${list.length === 0
        ? emptyBlock("記録なし", "杭詳細から施工記録を追加してください。")
        : recordsTable(list)}
    </div>
  `);
  document.getElementById("projSelect")?.addEventListener("change", (e) => {
    setCurrentProject(e.target.value || null);
    viewRecords();
  });
}

function recordsTable(list) {
  return `
    <div class="table-wrap">
      <table class="data">
        <thead><tr>
          <th>施工日</th><th>杭No.</th><th>現場</th>
          <th class="num">削孔深 (m)</th>
          <th class="num">杭芯ズレ (mm)</th><th>鉛直度</th>
          <th>担当</th><th>状態</th><th class="row-actions">操作</th>
        </tr></thead>
        <tbody>
          ${list.map((r) => {
            const pile = getPile(r.pileId);
            const project = pile ? getProject(pile.projectId) : null;
            const d = (r.deviationX != null && r.deviationY != null)
              ? Math.sqrt(Number(r.deviationX) ** 2 + Number(r.deviationY) ** 2) : null;
            const over = d != null && d > DEVIATION_TOLERANCE;
            return `
              <tr>
                <td>${esc(r.date || "—")}</td>
                <td>${pile ? `<a href="#/piles/${pile.id}">${esc(pile.no)}</a>` : "—"}</td>
                <td>${esc(project?.name || "—")}</td>
                <td class="num">${fmt(r.drillDepth, 2)}</td>
                <td class="num" style="${over ? "color:var(--bad);font-weight:700;" : ""}">${d != null ? fmt(d, 0) : "—"}</td>
                <td>${r.verticality ? "1/" + Math.round(1 / r.verticality) : "—"}</td>
                <td>${esc(r.operator || "—")}</td>
                <td>${r.completed ? `<span class="badge completed">完了</span>` : `<span class="badge in_progress">進行</span>`}</td>
                <td class="row-actions"><a class="btn btn-sm" href="#/records/${r.id}/edit">編集</a></td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* Layout (canvas) */
function viewLayout() {
  const pid = UI.currentProjectId || DB.projects[0]?.id;
  const project = pid ? getProject(pid) : null;
  if (!project) {
    return render(`
      <div class="page-head"><h1>杭芯配置図</h1></div>
      ${emptyBlock("案件を選択してください", "案件を作成後に配置図を表示します。", "#/projects/new", "案件を作成")}
    `);
  }
  setCurrentProject(project.id);
  const piles = pilesOf(project.id);
  render(`
    <div class="page-head">
      <div>
        <h1>杭芯配置図</h1>
        <div class="sub">${esc(project.name)} ／ ${piles.length}本</div>
      </div>
      <div class="page-actions">${projectSelector(project.id)}</div>
    </div>
    <div class="layout-wrap">
      <div class="layout-toolbar">
        <span class="legend"><i class="pending"></i>未着手</span>
        <span class="legend"><i class="in_progress"></i>施工中</span>
        <span class="legend"><i class="completed"></i>完了</span>
        <span class="legend"><i class="alert"></i>許容超過</span>
        <span style="margin-left:auto;">クリックで杭詳細</span>
      </div>
      <canvas id="layoutCanvas"></canvas>
    </div>
  `);
  document.getElementById("projSelect")?.addEventListener("change", (e) => {
    setCurrentProject(e.target.value || null);
    viewLayout();
  });
  drawLayout(piles);
}

function drawLayout(piles) {
  const canvas = document.getElementById("layoutCanvas");
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  if (piles.length === 0) {
    ctx.fillStyle = "#999";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("杭が登録されていません", rect.width / 2, rect.height / 2);
    return;
  }

  const xs = piles.map((p) => p.x ?? 0);
  const ys = piles.map((p) => p.y ?? 0);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const padding = 50;
  const rangeX = Math.max(1, maxX - minX);
  const rangeY = Math.max(1, maxY - minY);
  const scaleX = (rect.width - padding * 2) / rangeX;
  const scaleY = (rect.height - padding * 2) / rangeY;
  const scale = Math.min(scaleX, scaleY);

  const toCanvas = (x, y) => ({
    cx: padding + (x - minX) * scale,
    cy: rect.height - padding - (y - minY) * scale,
  });

  const radius = 14;
  const hitMap = [];

  piles.forEach((pile) => {
    const { cx, cy } = toCanvas(pile.x ?? 0, pile.y ?? 0);
    const st = pileStatus(pile);
    const dev = pileLatestDeviation(pile);
    const over = dev && dev.d > DEVIATION_TOLERANCE;
    let fill = "#fff", stroke = "#5a6878";
    if (over) { fill = "#c0392b"; stroke = "#9c2a1d"; }
    else if (st === "completed") { fill = "#2e8b57"; stroke = "#1f6e3e"; }
    else if (st === "in_progress") { fill = "#d49a18"; stroke = "#a67912"; }
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = (st === "pending") ? "#1c2733" : "#fff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pile.no, cx, cy);

    hitMap.push({ pile, cx, cy, radius });
  });

  /* scale ruler */
  ctx.strokeStyle = "#5a6878";
  ctx.fillStyle = "#5a6878";
  ctx.lineWidth = 1;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  const rulerLen = Math.min(150, rect.width - padding * 2);
  const realLen = rulerLen / scale;
  ctx.beginPath();
  ctx.moveTo(padding, rect.height - 20);
  ctx.lineTo(padding + rulerLen, rect.height - 20);
  ctx.stroke();
  ctx.fillText(`${(realLen / 1000).toFixed(1)} m`, padding, rect.height - 24);

  canvas.onclick = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    for (const h of hitMap) {
      const dx = x - h.cx, dy = y - h.cy;
      if (dx * dx + dy * dy <= h.radius * h.radius) {
        go(`/piles/${h.pile.id}`);
        return;
      }
    }
  };
}

/* Reports */
function viewReports() {
  render(`
    <div class="page-head">
      <div>
        <h1>帳票出力</h1>
        <div class="sub">案件単位で施工記録をCSV出力できます。</div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h2>CSVエクスポート</h2></div>
      ${DB.projects.length === 0
        ? `<p class="empty">案件がありません。</p>`
        : `<table class="data">
            <thead><tr><th>現場名</th><th>杭数</th><th>記録数</th><th class="row-actions">操作</th></tr></thead>
            <tbody>
              ${DB.projects.map((p) => {
                const ps = pilesOf(p.id);
                const rs = ps.flatMap((x) => recordsOf(x.id));
                return `<tr>
                  <td>${esc(p.name)}</td>
                  <td class="num">${ps.length}</td>
                  <td class="num">${rs.length}</td>
                  <td class="row-actions">
                    <button class="btn btn-sm" data-export="${p.id}" data-kind="piles">杭一覧CSV</button>
                    <button class="btn btn-sm btn-accent" data-export="${p.id}" data-kind="records">施工記録CSV</button>
                    <button class="btn btn-sm" data-print="${p.id}">印刷プレビュー</button>
                  </td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>`}
    </div>

    <div class="card" id="printArea" style="display:none;"></div>
  `);

  on("[data-export]", "click", (e) => {
    const pid = e.currentTarget.dataset.export;
    const kind = e.currentTarget.dataset.kind;
    exportCsv(pid, kind);
  });
  on("[data-print]", "click", (e) => {
    const pid = e.currentTarget.dataset.print;
    renderPrint(pid);
  });
}

function exportCsv(projectId, kind) {
  const p = getProject(projectId);
  if (!p) return;
  let rows, filename;
  if (kind === "piles") {
    rows = [
      ["案件", "杭No.", "杭種", "杭径(mm)", "杭長(m)", "X(mm)", "Y(mm)", "支持層深度(m)", "設計杭頭(m)", "状態"],
      ...pilesOf(projectId).map((pile) => [
        p.name, pile.no, pile.type, pile.diameter, pile.length,
        pile.x, pile.y, pile.bearingDepth, pile.designLevel, STATUS_LABEL[pileStatus(pile)],
      ]),
    ];
    filename = `piles_${p.name}.csv`;
  } else {
    rows = [
      ["案件", "杭No.", "施工日", "開始", "終了", "天候", "気温(℃)",
       "削孔深(m)", "根固め深(m)", "ΔX(mm)", "ΔY(mm)", "合成ズレ(mm)",
       "鉛直度", "電流(A)", "積分電流", "ミルク量(L)", "W/C(%)",
       "杭頭レベル(m)", "担当者", "機長", "立会", "完了", "備考"],
      ...pilesOf(projectId).flatMap((pile) =>
        recordsOf(pile.id).map((r) => {
          const d = (r.deviationX != null && r.deviationY != null)
            ? Math.sqrt(Number(r.deviationX) ** 2 + Number(r.deviationY) ** 2) : "";
          return [
            p.name, pile.no, r.date, r.startTime, r.endTime, r.weather, r.temperature,
            r.drillDepth, r.gravelDepth, r.deviationX, r.deviationY,
            d === "" ? "" : Math.round(d),
            r.verticality ? "1/" + Math.round(1 / r.verticality) : "",
            r.current, r.integratedCurrent, r.cementMilkAmount, r.cementMilkRatio,
            r.pileHeadLevel, r.operator, r.machineOperator, r.witness,
            r.completed ? "完了" : "進行中", r.note,
          ];
        })
      ),
    ];
    filename = `records_${p.name}.csv`;
  }
  const csv = "﻿" + rows.map((row) =>
    row.map((v) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    }).join(",")
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("CSVを出力しました");
}

function renderPrint(projectId) {
  const p = getProject(projectId);
  const piles = pilesOf(projectId);
  const area = document.getElementById("printArea");
  area.style.display = "block";
  area.innerHTML = `
    <div class="card-head">
      <h2>杭施工管理表 - ${esc(p.name)}</h2>
      <button class="btn" onclick="window.print()">印刷</button>
    </div>
    <table class="data">
      <thead><tr>
        <th>杭No.</th><th>杭種</th><th>径×長</th><th>X/Y</th>
        <th>施工日</th><th>ΔX/ΔY (mm)</th><th>合成 (mm)</th>
        <th>鉛直度</th><th>状態</th>
      </tr></thead>
      <tbody>
        ${piles.map((pile) => {
          const recs = recordsOf(pile.id);
          const last = recs[recs.length - 1];
          const d = last && last.deviationX != null && last.deviationY != null
            ? Math.sqrt(last.deviationX ** 2 + last.deviationY ** 2) : null;
          return `<tr>
            <td>${esc(pile.no)}</td>
            <td>${esc(pile.type || "—")}</td>
            <td>${pile.diameter ?? "—"}×${pile.length ?? "—"}</td>
            <td>${pile.x ?? "—"} / ${pile.y ?? "—"}</td>
            <td>${last?.date || "—"}</td>
            <td>${last?.deviationX ?? "—"} / ${last?.deviationY ?? "—"}</td>
            <td>${d != null ? fmt(d, 0) : "—"}</td>
            <td>${last?.verticality ? "1/" + Math.round(1 / last.verticality) : "—"}</td>
            <td>${STATUS_LABEL[pileStatus(pile)]}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  `;
  area.scrollIntoView({ behavior: "smooth" });
}

/* Settings */
function viewSettings() {
  const stats = {
    projects: DB.projects.length,
    piles: DB.piles.length,
    records: DB.records.length,
  };
  render(`
    <div class="page-head">
      <div><h1>設定</h1><div class="sub">データの初期化・サンプル投入</div></div>
    </div>
    <div class="card">
      <div class="card-head"><h2>データ状況</h2></div>
      <div class="stat-row">
        <div class="stat"><div class="stat-label">案件</div><div class="stat-value">${stats.projects}</div></div>
        <div class="stat"><div class="stat-label">杭</div><div class="stat-value">${stats.piles}</div></div>
        <div class="stat"><div class="stat-label">施工記録</div><div class="stat-value">${stats.records}</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h2>データ操作</h2></div>
      <p style="color:var(--ink-soft);">サンプルデータを投入したり、全データを初期化できます。データはこのブラウザのlocalStorageに保存されます。</p>
      <div class="form-actions" style="justify-content:flex-start;">
        <button class="btn btn-accent" id="seedBtn">サンプルデータを投入</button>
        <button class="btn" id="exportAllBtn">全データJSONバックアップ</button>
        <button class="btn btn-danger" id="resetBtn">全データを削除</button>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h2>運用について</h2></div>
      <p style="color:var(--ink-soft);margin:0;">
        PowerUpsは社内環境向けの杭工事管理ツールです。<br/>
        運用フローは: <strong>案件登録 → 杭情報登録 → 施工記録入力 → 杭芯ズレ確認 → 帳票出力</strong> の順を想定しています。<br/>
        現バージョンはローカル保存（端末ごと）のため、共有運用にはバックエンド連携が必要です。
      </p>
    </div>
  `);

  document.getElementById("seedBtn").addEventListener("click", () => {
    if (DB.projects.length > 0 && !confirmAction("既存データがあります。続行するとサンプルが追加されます。")) return;
    seed();
    toast("サンプルデータを投入しました");
    navigate();
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirmAction("すべてのデータを削除します。よろしいですか？")) return;
    Store.reset();
    DB = { projects: [], piles: [], records: [] };
    UI = {};
    persistUi();
    toast("初期化しました");
    go("/");
  });
  document.getElementById("exportAllBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `powerups_backup_${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

/* Common helpers */
function emptyBlock(title, desc, link, cta) {
  return `
    <div class="empty">
      <h3>${esc(title)}</h3>
      <p>${esc(desc)}</p>
      ${link ? `<a class="btn btn-primary" href="${link}">${esc(cta)}</a>` : ""}
    </div>
  `;
}

function view404() {
  return `
    <div class="page-head"><h1>404</h1></div>
    <div class="empty">
      <h3>ページが見つかりません</h3>
      <p>URLをご確認ください。</p>
      <a class="btn btn-primary" href="#/">ダッシュボードへ</a>
    </div>
  `;
}

/* ---------- Route table ---------- */
route("/", viewDashboard);
route("/projects", viewProjects);
route("/projects/new", () => viewProjectForm({}));
route("/projects/:id", viewProjectDetail);
route("/projects/:id/edit", viewProjectForm);
route("/piles", viewPiles);
route("/piles/new", () => viewPileForm({}));
route("/piles/:id", viewPileDetail);
route("/piles/:id/edit", viewPileForm);
route("/piles/:id/records/new", viewRecordForm);
route("/records", viewRecords);
route("/records/:rid/edit", (params) => viewRecordForm({ rid: params.rid }));
route("/layout", viewLayout);
route("/reports", viewReports);
route("/settings", viewSettings);

/* ---------- Init ---------- */
window.addEventListener("hashchange", navigate);
window.addEventListener("DOMContentLoaded", () => {
  if (DB.projects.length === 0 && !UI.seededOnce) {
    UI.seededOnce = true;
    persistUi();
  }
  if (!location.hash) location.hash = "#/";
  else navigate();
});
