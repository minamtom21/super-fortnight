import {
  ACTIVE_STORE,
  ARCHIVE_STORE,
  deleteCorrection,
  getAllCorrections,
  moveToArchive,
  openDatabase,
  restoreFromArchive,
  saveActiveCorrection,
} from "./db.js";
import { filenameToDescription, formatBytes, preparePhoto } from "./images.js";
import { ZipArchive, csvCell, safePathPart } from "./zip.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const refs = {
  activeView: $("#active-view"),
  archiveView: $("#archive-view"),
  activeList: $("#active-list"),
  archiveList: $("#archive-list"),
  activeEmpty: $("#active-empty"),
  archiveEmpty: $("#archive-empty"),
  itemDialog: $("#item-dialog"),
  itemForm: $("#item-form"),
  bulkDialog: $("#bulk-dialog"),
  bulkForm: $("#bulk-form"),
  detailDialog: $("#detail-dialog"),
  detailContent: $("#detail-content"),
  reportDialog: $("#report-dialog"),
  storageDialog: $("#storage-dialog"),
  confirmDialog: $("#confirm-dialog"),
  toastRegion: $("#toast-region"),
};

const state = {
  active: [],
  archive: [],
  view: "active",
  selectedArchive: new Set(),
  reportSource: "active",
  reportSelection: new Set(),
  detail: null,
  newBeforeFiles: [],
  existingBeforePhotos: [],
  installPrompt: null,
};

const urlScopes = new Map();
let confirmResolver = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clearUrls(scope) {
  (urlScopes.get(scope) || []).forEach((url) => URL.revokeObjectURL(url));
  urlScopes.set(scope, []);
}

function objectUrl(blob, scope) {
  if (!blob) return "";
  const url = URL.createObjectURL(blob);
  const urls = urlScopes.get(scope) || [];
  urls.push(url);
  urlScopes.set(scope, urls);
  return url;
}

function todayValue() {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const source = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function createNumber() {
  const date = todayValue().replace(/-/g, "");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `N-${date}-${suffix}`;
}

function normalizedText(record) {
  return [record.number, record.projectName, record.area, record.trade, record.category, record.beforeDescription, record.afterDescription]
    .join(" ")
    .normalize("NFKC")
    .toLowerCase();
}

function priorityLabel(priority) {
  return { normal: "通常", high: "優先度：高", urgent: "至急" }[priority] || "通常";
}

function statusLabel(status) {
  return { open: "未是正", review: "確認待ち", done: "完了" }[status] || "未是正";
}

function dueClass(dateValue) {
  if (!dateValue) return "";
  const today = new Date(`${todayValue()}T00:00:00`);
  const due = new Date(`${dateValue}T00:00:00`);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return "due-over";
  if (days <= 3) return "due-soon";
  return "";
}

function dueText(dateValue) {
  if (!dateValue) return "期限なし";
  const today = new Date(`${todayValue()}T00:00:00`);
  const due = new Date(`${dateValue}T00:00:00`);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return `${Math.abs(days)}日超過`;
  if (days === 0) return "本日期限";
  return `期限 ${formatDate(dateValue)}`;
}

function toast(title, message = "", type = "success") {
  const element = document.createElement("div");
  element.className = `toast ${type}`;
  element.innerHTML = `<span aria-hidden="true">${type === "error" ? "!" : "✓"}</span><div><b>${escapeHtml(title)}</b>${message ? `<span>${escapeHtml(message)}</span>` : ""}</div>`;
  refs.toastRegion.append(element);
  window.setTimeout(() => element.remove(), 4200);
}

function setBusy(button, busy, label = "処理中…") {
  if (!button) return;
  if (busy) {
    button.dataset.originalLabel = button.textContent;
    button.textContent = label;
    button.disabled = true;
    document.body.style.cursor = "progress";
  } else {
    button.textContent = button.dataset.originalLabel || button.textContent;
    button.disabled = false;
    document.body.style.cursor = "";
  }
}

async function refreshData() {
  [state.active, state.archive] = await Promise.all([
    getAllCorrections(ACTIVE_STORE),
    getAllCorrections(ARCHIVE_STORE),
  ]);
  const archiveIds = new Set(state.archive.map((record) => record.id));
  state.selectedArchive = new Set([...state.selectedArchive].filter((id) => archiveIds.has(id)));
  renderAll();
}

function populateTradeFilters() {
  const trades = [...new Set([...state.active, ...state.archive].map((record) => record.trade).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
  const filters = [$("#trade-filter"), $("#archive-trade-filter")];
  filters.forEach((select) => {
    const current = select.value;
    const first = select.options[0].outerHTML;
    select.innerHTML = first + trades.map((trade) => `<option value="${escapeHtml(trade)}">${escapeHtml(trade)}</option>`).join("");
    select.value = trades.includes(current) ? current : "all";
  });
}

function renderStats() {
  const open = state.active.filter((record) => record.status === "open").length;
  const review = state.active.filter((record) => record.status === "review").length;
  $("#open-count").textContent = open;
  $("#review-count").textContent = review;
  $("#completed-count").textContent = state.archive.length;
  $("#active-tab-count").textContent = state.active.length;
  $("#archive-tab-count").textContent = state.archive.length;
  updateStorageEstimate();
}

function filteredActive() {
  const query = $("#active-search").value.trim().normalize("NFKC").toLowerCase();
  const status = $("#status-filter").value;
  const trade = $("#trade-filter").value;
  const sort = $("#sort-filter").value;
  const records = state.active.filter((record) => {
    if (query && !normalizedText(record).includes(query)) return false;
    if (status !== "all" && record.status !== status) return false;
    if (trade !== "all" && record.trade !== trade) return false;
    return true;
  });
  records.sort((a, b) => {
    if (sort === "due") {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    }
    const field = sort === "created" ? "createdAt" : "updatedAt";
    return new Date(b[field] || 0) - new Date(a[field] || 0);
  });
  return records;
}

function filteredArchive() {
  const query = $("#archive-search").value.trim().normalize("NFKC").toLowerCase();
  const trade = $("#archive-trade-filter").value;
  return state.archive
    .filter((record) => (!query || normalizedText(record).includes(query)) && (trade === "all" || record.trade === trade))
    .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
}

function cardHtml(record, archived = false) {
  const photo = archived && record.afterPhotos?.length ? record.afterPhotos[0] : record.beforePhotos?.[0];
  const thumbnail = photo?.thumbnail || photo?.blob;
  const photoSrc = thumbnail ? objectUrl(thumbnail, "lists") : "";
  const totalPhotos = (record.beforePhotos?.length || 0) + (record.afterPhotos?.length || 0);
  const selected = state.selectedArchive.has(record.id);
  return `
    <article class="item-card ${archived ? "archived" : ""}" data-card-id="${record.id}">
      ${archived ? `<label class="card-select" title="ZIP保管するデータを選択"><input type="checkbox" data-select-archive value="${record.id}" ${selected ? "checked" : ""}><span class="sr-only">${escapeHtml(record.number)}を選択</span></label>` : ""}
      <button class="card-photo-button" type="button" data-action="detail" data-id="${record.id}" data-store="${archived ? "archive" : "active"}" aria-label="${escapeHtml(record.number)}の詳細を開く">
        <div class="card-photo">
          ${photoSrc ? `<img src="${photoSrc}" alt="${archived ? "是正後" : "是正前"}写真" loading="lazy">` : `<span class="card-photo-placeholder">写真なし</span>`}
          <span class="photo-count">写真 ${totalPhotos}枚</span>
          <span class="card-status ${archived ? "done" : record.status}">${statusLabel(archived ? "done" : record.status)}</span>
        </div>
      </button>
      <div class="card-body">
        <div class="card-kicker"><span class="card-id">${escapeHtml(record.number)}</span>${record.priority && record.priority !== "normal" ? `<span class="priority ${record.priority}">${priorityLabel(record.priority)}</span>` : ""}</div>
        <h3>${escapeHtml(record.beforeDescription)}</h3>
        <p class="card-meta">
          <span>場所 <b>${escapeHtml(record.area || "未設定")}</b></span>
          <span>工種 <b>${escapeHtml(record.trade || "未設定")}</b></span>
          ${archived ? `<span>完了 <b>${formatDate(record.completedAt, true)}</b></span>` : `<span class="${dueClass(record.dueDate)}">${escapeHtml(dueText(record.dueDate))}</span>`}
        </p>
        ${archived ? `<div class="card-archive-date">是正完了・保管済み</div>` : `
          <div class="card-progress">
            <span class="progress-node"><i>✓</i>是正前</span>
            <span class="progress-line ${record.afterPhotos?.length ? "ready" : ""}"></span>
            <span class="progress-node ${record.afterPhotos?.length ? "" : "pending"}"><i>${record.afterPhotos?.length ? "✓" : "2"}</i>是正後</span>
          </div>`}
      </div>
    </article>`;
}

function renderLists() {
  clearUrls("lists");
  const active = filteredActive();
  const archive = filteredArchive();
  refs.activeList.innerHTML = active.map((record) => cardHtml(record, false)).join("");
  refs.archiveList.innerHTML = archive.map((record) => cardHtml(record, true)).join("");
  refs.activeEmpty.hidden = active.length > 0;
  refs.archiveEmpty.hidden = archive.length > 0;
  refs.activeList.hidden = active.length === 0;
  refs.archiveList.hidden = archive.length === 0;
  updateArchiveSelection();
}

function renderAll() {
  populateTradeFilters();
  renderStats();
  renderLists();
  setView(state.view);
}

function setView(view) {
  state.view = view === "archive" ? "archive" : "active";
  refs.activeView.hidden = state.view !== "active";
  refs.archiveView.hidden = state.view !== "archive";
  $$(".view-tab").forEach((tab) => {
    const active = tab.dataset.view === state.view;
    tab.classList.toggle("active", active);
    if (active) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
}

function resetItemForm() {
  refs.itemForm.reset();
  refs.itemForm.elements.id.value = "";
  refs.itemForm.elements.beforeDate.value = todayValue();
  refs.itemForm.elements.category.value = "配筋検査指摘・是正";
  state.newBeforeFiles = [];
  state.existingBeforePhotos = [];
  $("#item-form-error").hidden = true;
  clearUrls("before-preview");
  renderBeforePreview();
  $("#item-dialog .dialog-header h2").textContent = "是正前を登録";
  $("#item-save-button").textContent = "登録する";
}

function openItemDialog(record = null) {
  resetItemForm();
  if (record) {
    const form = refs.itemForm;
    ["id", "projectName", "area", "trade", "category", "beforeDate", "beforeWitness", "dueDate", "priority", "beforeDescription"].forEach((name) => {
      if (form.elements[name]) form.elements[name].value = record[name] || (name === "priority" ? "normal" : "");
    });
    state.existingBeforePhotos = [...(record.beforePhotos || [])];
    $("#item-dialog .dialog-header h2").textContent = "是正内容を編集";
    $("#item-save-button").textContent = "変更を保存";
    renderBeforePreview();
  }
  updateCharCount("beforeDescription", refs.itemForm);
  refs.itemDialog.showModal();
  window.setTimeout(() => refs.itemForm.elements.projectName.focus(), 50);
}

function renderBeforePreview() {
  clearUrls("before-preview");
  const root = $("#before-preview");
  const existing = state.existingBeforePhotos.map((photo, index) => ({
    src: objectUrl(photo.thumbnail || photo.blob, "before-preview"),
    label: photo.name,
    kind: "existing",
    index,
  }));
  const pending = state.newBeforeFiles.map((file, index) => ({
    src: objectUrl(file, "before-preview"),
    label: file.name,
    kind: "pending",
    index,
  }));
  root.innerHTML = [...existing, ...pending].map((photo) => `
    <figure class="preview-photo" title="${escapeHtml(photo.label)}">
      <img src="${photo.src}" alt="選択した是正前写真">
      <button type="button" data-remove-before="${photo.kind}" data-index="${photo.index}" aria-label="写真を外す">×</button>
    </figure>`).join("");
}

function formValues(form) {
  const data = new FormData(form);
  return Object.fromEntries([...data.entries()].filter(([, value]) => typeof value === "string"));
}

async function submitItemForm(event) {
  event.preventDefault();
  const form = refs.itemForm;
  const error = $("#item-form-error");
  error.hidden = true;
  if (!form.reportValidity()) return;
  if (!state.existingBeforePhotos.length && !state.newBeforeFiles.length) {
    error.textContent = "是正前写真を1枚以上選択してください。";
    error.hidden = false;
    return;
  }

  const button = $("#item-save-button");
  setBusy(button, true, state.newBeforeFiles.length ? "写真を圧縮中…" : "保存中…");
  try {
    const values = formValues(form);
    const existing = values.id ? state.active.find((record) => record.id === values.id) : null;
    const newPhotos = [];
    for (const file of state.newBeforeFiles) newPhotos.push(await preparePhoto(file));
    const now = new Date().toISOString();
    const record = {
      ...(existing || {}),
      id: existing?.id || crypto.randomUUID(),
      number: existing?.number || createNumber(),
      projectName: values.projectName.trim(),
      area: values.area.trim(),
      trade: values.trade.trim(),
      category: values.category.trim(),
      beforeDate: values.beforeDate,
      beforeWitness: values.beforeWitness.trim(),
      dueDate: values.dueDate,
      priority: values.priority,
      beforeDescription: values.beforeDescription.trim(),
      beforePhotos: [...state.existingBeforePhotos, ...newPhotos],
      afterDate: existing?.afterDate || "",
      afterWitness: existing?.afterWitness || "",
      afterDescription: existing?.afterDescription || "",
      afterPhotos: existing?.afterPhotos || [],
      status: existing?.afterPhotos?.length ? "review" : "open",
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      completedAt: null,
    };
    await saveActiveCorrection(record);
    refs.itemDialog.close();
    clearUrls("before-preview");
    await refreshData();
    toast(existing ? "変更を保存しました" : "是正前を登録しました", record.number);
  } catch (cause) {
    error.textContent = cause.message || "登録に失敗しました。";
    error.hidden = false;
  } finally {
    setBusy(button, false);
  }
}

function openBulkDialog() {
  refs.bulkForm.reset();
  refs.bulkForm.elements.beforeDate.value = todayValue();
  refs.bulkForm.elements.category.value = "検査指摘・是正";
  $("#bulk-file-label").textContent = "まだ選択されていません";
  $("#bulk-progress").hidden = true;
  $("#bulk-form-error").hidden = true;
  refs.bulkDialog.showModal();
}

async function submitBulkForm(event) {
  event.preventDefault();
  const form = refs.bulkForm;
  const files = [...form.elements.files.files];
  const error = $("#bulk-form-error");
  error.hidden = true;
  if (!form.reportValidity()) return;
  if (!files.length) {
    error.textContent = "写真を1枚以上選択してください。";
    error.hidden = false;
    return;
  }

  const values = formValues(form);
  const button = $("#bulk-save-button");
  const progress = $("#bulk-progress");
  const bar = $("#bulk-progress-bar");
  const label = $("#bulk-progress-label");
  const percent = $("#bulk-progress-percent");
  progress.hidden = false;
  setBusy(button, true, "登録中…");
  let saved = 0;
  const failures = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      label.textContent = `${file.name} を処理中（${index + 1}/${files.length}）`;
      const ratio = Math.round((index / files.length) * 100);
      bar.value = ratio;
      percent.textContent = `${ratio}%`;
      try {
        const photo = await preparePhoto(file);
        const now = new Date().toISOString();
        await saveActiveCorrection({
          id: crypto.randomUUID(),
          number: createNumber(),
          projectName: values.projectName.trim(),
          area: values.area.trim(),
          trade: values.trade.trim(),
          category: values.category.trim(),
          beforeDate: values.beforeDate,
          beforeWitness: values.beforeWitness.trim(),
          dueDate: values.dueDate,
          priority: values.priority,
          beforeDescription: filenameToDescription(file.name),
          beforePhotos: [photo],
          afterDate: "",
          afterWitness: "",
          afterDescription: "",
          afterPhotos: [],
          status: "open",
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        });
        saved += 1;
      } catch (cause) {
        failures.push(`${file.name}: ${cause.message}`);
      }
    }
    bar.value = 100;
    percent.textContent = "100%";
    await refreshData();
    if (saved) {
      refs.bulkDialog.close();
      toast(`${saved}件をまとめて登録しました`, failures.length ? `${failures.length}件は読み込めませんでした` : "写真は端末向けに圧縮済みです");
    }
    if (failures.length && !saved) throw new Error(failures.join(" / "));
  } catch (cause) {
    error.textContent = cause.message || "一括登録に失敗しました。";
    error.hidden = false;
  } finally {
    setBusy(button, false);
  }
}

function findRecord(id, source) {
  return (source === "archive" ? state.archive : state.active).find((record) => record.id === id);
}

function detailPhotoGrid(photos, kind, editable) {
  if (!photos?.length) return `<p class="microcopy">まだ写真がありません。</p>`;
  return `<div class="detail-photos">${photos.map((photo, index) => {
    const src = objectUrl(photo.thumbnail || photo.blob, "detail");
    return `<figure class="detail-photo"><img src="${src}" alt="${kind === "before" ? "是正前" : "是正後"}写真 ${index + 1}">${editable ? `<button type="button" data-remove-photo="${kind}" data-index="${index}" aria-label="写真を削除">×</button>` : ""}</figure>`;
  }).join("")}</div>`;
}

function renderDetail(record, source) {
  clearUrls("detail");
  const archived = source === "archive";
  const heroPhoto = record.beforePhotos?.[0];
  const heroUrl = heroPhoto ? objectUrl(heroPhoto.blob || heroPhoto.thumbnail, "detail") : "";
  const canComplete = !!record.afterPhotos?.length && !!record.afterDescription?.trim();
  refs.detailContent.innerHTML = `
    <div class="detail-hero">
      <button class="icon-button detail-close" type="button" data-close-dialog aria-label="閉じる">×</button>
      <div class="detail-hero-photo">${heroUrl ? `<img src="${heroUrl}" alt="是正前写真">` : ""}</div>
      <div class="detail-hero-copy">
        <span class="detail-number">${escapeHtml(record.number)}</span>
        <h2>${escapeHtml(record.beforeDescription)}</h2>
        <div class="detail-tags"><span class="detail-tag">${escapeHtml(record.area)}</span><span class="detail-tag">${escapeHtml(record.trade)}</span><span class="detail-tag">${statusLabel(archived ? "done" : record.status)}</span></div>
      </div>
    </div>
    <div class="detail-layout">
      <section class="detail-panel">
        <h3>是正前</h3>
        ${detailPhotoGrid(record.beforePhotos, "before", false)}
        <dl class="meta-table">
          <div class="meta-row"><dt>工事名</dt><dd>${escapeHtml(record.projectName || "—")}</dd></div>
          <div class="meta-row"><dt>撮影場所</dt><dd>${escapeHtml(record.area || "—")}</dd></div>
          <div class="meta-row"><dt>撮影日</dt><dd>${formatDate(record.beforeDate)}</dd></div>
          <div class="meta-row"><dt>立会者</dt><dd>${escapeHtml(record.beforeWitness || "—")}</dd></div>
          <div class="meta-row"><dt>工種</dt><dd>${escapeHtml(record.trade || "—")}</dd></div>
          <div class="meta-row"><dt>撮影項目</dt><dd>${escapeHtml(record.category || "—")}</dd></div>
          <div class="meta-row"><dt>是正期限</dt><dd class="${dueClass(record.dueDate)}">${escapeHtml(dueText(record.dueDate))}</dd></div>
        </dl>
      </section>
      <section class="detail-panel">
        <h3>是正後</h3>
        ${detailPhotoGrid(record.afterPhotos, "after", !archived)}
        ${archived ? `
          <dl class="meta-table">
            <div class="meta-row"><dt>撮影日</dt><dd>${formatDate(record.afterDate)}</dd></div>
            <div class="meta-row"><dt>立会者</dt><dd>${escapeHtml(record.afterWitness || "—")}</dd></div>
            <div class="meta-row"><dt>撮影内容</dt><dd>${escapeHtml(record.afterDescription || "—")}</dd></div>
            <div class="meta-row"><dt>完了日時</dt><dd>${formatDate(record.completedAt, true)}</dd></div>
          </dl>` : `
          <form id="after-form" novalidate>
            <div class="after-uploader">
              <input id="after-files" name="files" type="file" accept="image/*" multiple>
              <div><strong>＋ 是正後写真を追加</strong><span>複数枚可／自動で圧縮保存</span></div>
            </div>
            <div class="form-grid two-cols" style="margin-top:14px">
              <label class="field"><span>撮影日</span><input name="afterDate" type="date" value="${escapeHtml(record.afterDate || todayValue())}"></label>
              <label class="field"><span>立会者</span><input name="afterWitness" maxlength="40" value="${escapeHtml(record.afterWitness || "")}" placeholder="氏名または会社名"></label>
            </div>
            <label class="field"><span>是正後の内容</span><textarea name="afterDescription" rows="3" maxlength="300" placeholder="例：幅を調整し、40mm程度とした。">${escapeHtml(record.afterDescription || "")}</textarea></label>
          </form>`}
      </section>
    </div>
    ${archived ? `<p class="complete-banner">${formatDate(record.completedAt, true)} に完了保管庫へ移動しました。対応中の一覧には表示されません。</p>` : ""}
    <div class="detail-actions">
      ${archived ? `
        <button class="button button-danger delete-action" type="button" data-detail-action="delete-archive">完全に削除</button>
        <button class="button button-quiet" type="button" data-detail-action="export-one">ZIP保管</button>
        <button class="button button-secondary" type="button" data-detail-action="restore">対応中へ戻す</button>
        <button class="button button-primary" type="button" data-detail-action="report-one">帳票を開く</button>` : `
        <button class="button button-danger delete-action" type="button" data-detail-action="delete-active">削除</button>
        <button class="button button-quiet" type="button" data-detail-action="edit">基本情報を編集</button>
        <button class="button button-secondary" type="button" data-detail-action="save-after">是正後を保存</button>
        <button class="button button-success" type="button" data-detail-action="complete" ${canComplete ? "" : "disabled"}>完了して保管</button>
        ${canComplete ? "" : `<p class="completion-hint">是正後写真と撮影内容を保存すると完了できます。</p>`}`}
    </div>`;
}

function openDetail(id, source) {
  const record = findRecord(id, source);
  if (!record) return;
  state.detail = { id, source };
  renderDetail(record, source);
  refs.detailDialog.showModal();
}

async function saveAfter(record) {
  const form = $("#after-form");
  const button = $('[data-detail-action="save-after"]', refs.detailContent);
  const files = [...$("#after-files").files];
  setBusy(button, true, files.length ? "写真を圧縮中…" : "保存中…");
  try {
    const values = formValues(form);
    const photos = [...(record.afterPhotos || [])];
    for (const file of files) photos.push(await preparePhoto(file));
    const updated = {
      ...record,
      afterDate: values.afterDate,
      afterWitness: values.afterWitness.trim(),
      afterDescription: values.afterDescription.trim(),
      afterPhotos: photos,
      status: photos.length ? "review" : "open",
      updatedAt: new Date().toISOString(),
    };
    await saveActiveCorrection(updated);
    await refreshData();
    const fresh = findRecord(record.id, "active");
    setBusy(button, false);
    renderDetail(fresh, "active");
    toast("是正後を保存しました", fresh.number);
  } catch (cause) {
    toast("保存できませんでした", cause.message, "error");
    setBusy(button, false);
  }
}

async function removeDetailPhoto(record, kind, index) {
  const field = kind === "before" ? "beforePhotos" : "afterPhotos";
  const photos = [...(record[field] || [])];
  if (kind === "before" && photos.length <= 1) {
    toast("是正前写真は1枚必要です", "基本情報の編集画面から写真を差し替えてください", "error");
    return;
  }
  const accepted = await confirmAction("写真を削除しますか？", "この写真だけを端末の保存領域から削除します。", "写真を削除", "danger");
  if (!accepted) return;
  photos.splice(index, 1);
  const updated = {
    ...record,
    [field]: photos,
    status: kind === "after" && !photos.length ? "open" : record.status,
    updatedAt: new Date().toISOString(),
  };
  await saveActiveCorrection(updated);
  await refreshData();
  renderDetail(findRecord(record.id, "active"), "active");
  toast("写真を削除しました");
}

async function completeRecord(record) {
  const accepted = await confirmAction("是正を完了しますか？", "対応中の一覧から消え、完了保管庫へ移動します。あとから復元もできます。", "完了して保管", "success");
  if (!accepted) return;
  await moveToArchive(record.id);
  refs.detailDialog.close();
  clearUrls("detail");
  state.detail = null;
  await refreshData();
  toast("是正を完了して保管しました", `${record.number} は完了保管庫へ移動しました`);
}

async function deleteActiveRecord(record) {
  const accepted = await confirmAction("この是正を削除しますか？", "是正前・是正後の写真も削除され、元に戻せません。", "完全に削除", "danger");
  if (!accepted) return;
  await deleteCorrection(ACTIVE_STORE, record.id);
  refs.detailDialog.close();
  clearUrls("detail");
  await refreshData();
  toast("是正データを削除しました", record.number);
}

async function deleteArchiveRecord(record) {
  const accepted = await confirmAction("保管データを完全に削除しますか？", "写真も含めて削除されます。先にZIP保管することを推奨します。", "完全に削除", "danger");
  if (!accepted) return;
  await deleteCorrection(ARCHIVE_STORE, record.id);
  refs.detailDialog.close();
  clearUrls("detail");
  await refreshData();
  toast("完了保管データを削除しました", record.number);
}

async function restoreRecord(record) {
  const accepted = await confirmAction("対応中へ戻しますか？", "完了保管庫から消え、確認待ちの一覧へ戻ります。", "対応中へ戻す", "success");
  if (!accepted) return;
  await restoreFromArchive(record.id);
  refs.detailDialog.close();
  clearUrls("detail");
  await refreshData();
  toast("対応中へ戻しました", record.number);
}

function confirmAction(title, message, acceptLabel, kind = "success") {
  $("#confirm-title").textContent = title;
  $("#confirm-message").textContent = message;
  const accept = $("#confirm-accept");
  accept.textContent = acceptLabel;
  accept.className = `button ${kind === "danger" ? "button-danger" : "button-success"}`;
  refs.confirmDialog.showModal();
  return new Promise((resolve) => { confirmResolver = resolve; });
}

function resolveConfirm(value) {
  refs.confirmDialog.close();
  if (confirmResolver) confirmResolver(value);
  confirmResolver = null;
}

function updateArchiveSelection() {
  $("#archive-selection-count").textContent = `${state.selectedArchive.size}件選択`;
  $("#archive-export-button").disabled = state.selectedArchive.size === 0;
  const visible = filteredArchive();
  const allVisibleSelected = visible.length > 0 && visible.every((record) => state.selectedArchive.has(record.id));
  $("#select-all-archive").textContent = allVisibleSelected ? "選択解除" : "すべて選択";
}

function metadataWithoutBlobs(record) {
  const photoMeta = (photos) => (photos || []).map(({ blob, thumbnail, ...metadata }) => metadata);
  return { ...record, beforePhotos: photoMeta(record.beforePhotos), afterPhotos: photoMeta(record.afterPhotos) };
}

async function buildRecordsZip(records) {
  const zip = new ZipArchive();
  const headers = ["管理番号", "工事名", "撮影場所", "工種", "撮影項目", "是正前撮影日", "是正前内容", "是正後撮影日", "是正後内容", "完了日時", "是正前写真数", "是正後写真数"];
  const rows = records.map((record) => [
    record.number, record.projectName, record.area, record.trade, record.category, record.beforeDate,
    record.beforeDescription, record.afterDate, record.afterDescription, record.completedAt,
    record.beforePhotos?.length || 0, record.afterPhotos?.length || 0,
  ]);
  const csv = `\ufeff${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  await zip.add("是正完了一覧.csv", csv);
  await zip.add("README.txt", "NAOSU 是正写真管理から出力した完了保管データです。\r\n各フォルダに管理情報、是正前写真、是正後写真を保存しています。\r\n");

  for (const record of records) {
    const folder = `${safePathPart(record.number)}_${safePathPart(record.area)}`;
    await zip.add(`${folder}/管理情報.json`, JSON.stringify(metadataWithoutBlobs(record), null, 2));
    for (let index = 0; index < (record.beforePhotos || []).length; index += 1) {
      const photo = record.beforePhotos[index];
      await zip.add(`${folder}/01_是正前/${String(index + 1).padStart(2, "0")}_${safePathPart(photo.name, "photo.jpg")}`, photo.blob);
    }
    for (let index = 0; index < (record.afterPhotos || []).length; index += 1) {
      const photo = record.afterPhotos[index];
      await zip.add(`${folder}/02_是正後/${String(index + 1).padStart(2, "0")}_${safePathPart(photo.name, "photo.jpg")}`, photo.blob);
    }
  }
  return zip.toBlob();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function exportArchiveRecords(records) {
  if (!records.length) {
    toast("保管するデータを選択してください", "完了カード左上のチェックを付けます", "error");
    return;
  }
  const button = $("#archive-export-button");
  setBusy(button, true, "ZIP作成中…");
  try {
    const blob = await buildRecordsZip(records);
    downloadBlob(blob, `是正完了保管_${todayValue().replace(/-/g, "")}_${records.length}件.zip`);
    toast("ZIP保管ファイルを作成しました", `${records.length}件・${formatBytes(blob.size)}`);
  } catch (cause) {
    toast("ZIPを作成できませんでした", cause.message, "error");
  } finally {
    setBusy(button, false);
    updateArchiveSelection();
  }
}

function openReportDialog(source, preferredIds = []) {
  state.reportSource = source;
  const records = source === "archive" ? filteredArchive() : filteredActive();
  const candidates = records.filter((record) => record.beforePhotos?.length && record.afterPhotos?.length);
  state.reportSelection = new Set(preferredIds.filter((id) => candidates.some((record) => record.id === id)).slice(0, 2));
  clearUrls("report");
  $("#report-candidates").innerHTML = candidates.length ? candidates.map((record) => {
    const photo = record.afterPhotos[0];
    const src = objectUrl(photo.thumbnail || photo.blob, "report");
    return `<label class="report-choice"><input type="checkbox" value="${record.id}" ${state.reportSelection.has(record.id) ? "checked" : ""}><img src="${src}" alt="是正後写真"><span><strong>${escapeHtml(record.number)}｜${escapeHtml(record.area)}</strong><span>${escapeHtml(record.trade)}｜${escapeHtml(record.beforeDescription)}</span></span></label>`;
  }).join("") : `<div class="empty-state"><h3>帳票にできる案件がありません</h3><p>是正前・是正後の写真が揃った案件が必要です。</p></div>`;
  $("#report-error").hidden = true;
  updateReportSelection();
  refs.reportDialog.showModal();
}

function updateReportSelection() {
  $("#report-selection-count").textContent = `${state.reportSelection.size}/2件選択`;
  $("#report-print-button").disabled = state.reportSelection.size === 0;
}

function reportMetaRows(record, phase) {
  const after = phase === "after";
  const rows = [
    ["撮影場所", record.area],
    ["撮影日付", after ? record.afterDate : record.beforeDate],
    ["立会者", after ? record.afterWitness : record.beforeWitness],
    ["工　種", record.trade],
    ["撮影項目", record.category],
    ["撮影内容", after ? record.afterDescription : record.beforeDescription],
  ];
  return rows.map(([label, value]) => `<div class="meta-label">${escapeHtml(label)}</div><div class="meta-value">${escapeHtml(label === "撮影日付" ? formatDate(value) : value || "")}</div>`).join("");
}

function reportCaseHtml(record, index) {
  if (!record) return `<section class="case blank"><div>2件目未選択</div></section>`;
  const beforeUrl = objectUrl(record.beforePhotos[0].blob, "print");
  const afterUrl = objectUrl(record.afterPhotos[0].blob, "print");
  return `<section class="case">
    <div class="phase-row">
      <div class="phase-label before">是正前</div>
      <div class="phase-photo"><img src="${beforeUrl}" alt="是正前写真"></div>
      <div class="phase-meta">${reportMetaRows(record, "before")}</div>
    </div>
    <div class="arrow">▼</div>
    <div class="phase-row">
      <div class="phase-label after">是正後</div>
      <div class="phase-photo"><img src="${afterUrl}" alt="是正後写真"></div>
      <div class="phase-meta">${reportMetaRows(record, "after")}</div>
    </div>
    <span class="case-number">${index + 1}｜${escapeHtml(record.number)}</span>
  </section>`;
}

function openPrintReport(records) {
  clearUrls("print");
  const popup = window.open("", "_blank");
  if (!popup) {
    toast("帳票画面を開けませんでした", "ポップアップを許可して、もう一度お試しください", "error");
    return;
  }
  const projects = [...new Set(records.map((record) => record.projectName).filter(Boolean))].join(" ／ ");
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>是正写真4枚帳票_${escapeHtml(records[0]?.number || "")}</title><style>
    @page { size: A4 portrait; margin: 8mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111; font-family: "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif; font-size: 9px; }
    .toolbar { position: sticky; z-index: 5; top: 0; display: flex; justify-content: center; gap: 8px; padding: 10px; background: #25282b; }
    .toolbar button { padding: 8px 16px; border: 0; border-radius: 6px; background: #b3261e; color: #fff; font-weight: bold; cursor: pointer; }
    .toolbar button:last-child { background: #fff; color: #222; }
    .sheet { width: 194mm; min-height: 279mm; margin: 8px auto; background: #fff; }
    .title-row { display: grid; grid-template-columns: 23mm 1fr 36mm; min-height: 10mm; border: .3mm solid #111; }
    .title-row > * { display: flex; align-items: center; padding: 2mm; border-right: .3mm solid #111; }
    .title-row > *:last-child { border: 0; }
    .title { justify-content: center; font-size: 14px; font-weight: 900; }
    .case { position: relative; height: 133mm; border: .3mm solid #111; border-top: 0; }
    .phase-row { display: grid; grid-template-columns: 10mm 122mm 1fr; height: 64.5mm; }
    .phase-label { display: flex; align-items: center; justify-content: center; border-right: .3mm solid #111; font-size: 11px; font-weight: 900; writing-mode: vertical-rl; letter-spacing: .15em; }
    .phase-label.before { background: #f6e6e4; color: #8b1f18; }
    .phase-label.after { background: #e1f1e8; color: #0c6339; }
    .phase-photo { padding: 1.5mm; overflow: hidden; border-right: .3mm solid #111; }
    .phase-photo img { width: 100%; height: 100%; object-fit: contain; }
    .phase-meta { display: grid; grid-template-columns: 20mm 1fr; grid-template-rows: repeat(5, 7mm) 1fr; }
    .meta-label, .meta-value { display: flex; align-items: center; padding: 1mm; border-bottom: .25mm solid #333; }
    .meta-label { justify-content: center; border-right: .25mm solid #333; font-weight: 800; }
    .meta-value { overflow-wrap: anywhere; }
    .phase-meta > :nth-last-child(-n+2) { border-bottom: 0; align-items: flex-start; }
    .arrow { height: 4mm; display: flex; align-items: center; justify-content: center; border-top: .3mm solid #111; border-bottom: .3mm solid #111; color: #555; font-size: 9px; line-height: 1; }
    .case-number { position: absolute; right: 1.5mm; top: 1mm; padding: .5mm 1mm; background: rgba(255,255,255,.9); font-size: 7px; }
    .case.blank { display: grid; place-items: center; color: #aaa; }
    @media print { .toolbar { display: none; } .sheet { margin: 0; } }
  </style></head><body><div class="toolbar"><button onclick="window.print()">印刷／PDF保存</button><button onclick="window.close()">閉じる</button></div><main class="sheet"><header class="title-row"><strong>工事名</strong><div class="title">${escapeHtml(projects || "是正写真帳票")}</div><div>作成日：${formatDate(todayValue())}</div></header>${reportCaseHtml(records[0], 0)}${reportCaseHtml(records[1], 1)}</main></body></html>`);
  popup.document.close();
  refs.reportDialog.close();
  window.setTimeout(() => clearUrls("print"), 120000);
}

async function updateStorageEstimate() {
  if (!navigator.storage?.estimate) {
    $("#storage-used").textContent = "端末保存";
    return;
  }
  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    $("#storage-used").textContent = formatBytes(usage);
    $("#storage-detail").textContent = `${formatBytes(usage)} / ${formatBytes(quota)}`;
    $("#storage-progress").value = quota ? Math.min(100, (usage / quota) * 100) : 0;
  } catch {
    $("#storage-used").textContent = "端末保存";
  }
}

async function openStorageDialog() {
  await updateStorageEstimate();
  const persisted = await navigator.storage?.persisted?.();
  $("#persistent-storage-note").textContent = persisted
    ? "このブラウザでは保存領域が保護されています。"
    : "端末の容量整理でデータが消えにくくなるよう、ブラウザに保護を依頼します。";
  $("#persistent-storage-button").disabled = !!persisted || !navigator.storage?.persist;
  $("#persistent-storage-button").textContent = persisted ? "保存領域は保護済み" : "保存領域を保護する";
  refs.storageDialog.showModal();
}

async function requestPersistentStorage() {
  try {
    const granted = await navigator.storage.persist();
    $("#persistent-storage-note").textContent = granted ? "保存領域が保護されました。" : "この端末では自動保護されませんでした。定期的にZIP保管してください。";
    $("#persistent-storage-button").disabled = granted;
    if (granted) $("#persistent-storage-button").textContent = "保存領域は保護済み";
    toast(granted ? "保存領域を保護しました" : "保護は許可されませんでした", granted ? "写真データが自動整理の対象になりにくくなりました" : "ZIP保管を利用してください", granted ? "success" : "error");
  } catch (cause) {
    toast("保存領域を保護できませんでした", cause.message, "error");
  }
}

function updateCharCount(name, form) {
  const input = form.elements[name];
  const output = $(`[data-char-count="${name}"]`, form);
  if (input && output) output.textContent = input.value.length;
}

function closeDialog(dialog) {
  if (!dialog?.open) return;
  dialog.close();
  if (dialog === refs.detailDialog) clearUrls("detail");
  if (dialog === refs.reportDialog) clearUrls("report");
  if (dialog === refs.itemDialog) clearUrls("before-preview");
}

function bindEvents() {
  $$(".view-tab").forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
  $("#new-item-button").addEventListener("click", () => openItemDialog());
  $$('[data-open-new]').forEach((button) => button.addEventListener("click", () => openItemDialog()));
  $("#bulk-button").addEventListener("click", openBulkDialog);
  $("#storage-button").addEventListener("click", openStorageDialog);
  $("#persistent-storage-button").addEventListener("click", requestPersistentStorage);
  refs.itemForm.addEventListener("submit", submitItemForm);
  refs.bulkForm.addEventListener("submit", submitBulkForm);

  $("#before-files").addEventListener("change", (event) => {
    state.newBeforeFiles.push(...event.target.files);
    event.target.value = "";
    renderBeforePreview();
  });
  $("#before-preview").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-before]");
    if (!button) return;
    const list = button.dataset.removeBefore === "existing" ? state.existingBeforePhotos : state.newBeforeFiles;
    list.splice(Number(button.dataset.index), 1);
    renderBeforePreview();
  });
  refs.itemForm.elements.beforeDescription.addEventListener("input", () => updateCharCount("beforeDescription", refs.itemForm));

  $("#bulk-files").addEventListener("change", (event) => {
    const count = event.target.files.length;
    $("#bulk-file-label").textContent = count ? `${count}枚を選択しました` : "まだ選択されていません";
  });

  ["active-search", "status-filter", "trade-filter", "sort-filter", "archive-search", "archive-trade-filter"].forEach((id) => {
    const eventName = id.includes("search") ? "input" : "change";
    $(`#${id}`).addEventListener(eventName, renderLists);
  });

  [refs.activeList, refs.archiveList].forEach((list) => list.addEventListener("click", (event) => {
    const target = event.target.closest('[data-action="detail"]');
    if (target) openDetail(target.dataset.id, target.dataset.store);
  }));
  refs.archiveList.addEventListener("change", (event) => {
    const input = event.target.closest("[data-select-archive]");
    if (!input) return;
    if (input.checked) state.selectedArchive.add(input.value);
    else state.selectedArchive.delete(input.value);
    updateArchiveSelection();
  });
  $("#select-all-archive").addEventListener("click", () => {
    const visible = filteredArchive();
    const allSelected = visible.length && visible.every((record) => state.selectedArchive.has(record.id));
    visible.forEach((record) => allSelected ? state.selectedArchive.delete(record.id) : state.selectedArchive.add(record.id));
    renderLists();
  });
  $("#archive-export-button").addEventListener("click", () => exportArchiveRecords(state.archive.filter((record) => state.selectedArchive.has(record.id))));

  refs.detailContent.addEventListener("click", async (event) => {
    const close = event.target.closest("[data-close-dialog]");
    if (close) return closeDialog(refs.detailDialog);
    const record = state.detail ? findRecord(state.detail.id, state.detail.source) : null;
    if (!record) return;
    const remove = event.target.closest("[data-remove-photo]");
    if (remove) return removeDetailPhoto(record, remove.dataset.removePhoto, Number(remove.dataset.index));
    const action = event.target.closest("[data-detail-action]")?.dataset.detailAction;
    if (!action) return;
    if (action === "save-after") await saveAfter(record);
    if (action === "complete") await completeRecord(record);
    if (action === "delete-active") await deleteActiveRecord(record);
    if (action === "delete-archive") await deleteArchiveRecord(record);
    if (action === "restore") await restoreRecord(record);
    if (action === "edit") { closeDialog(refs.detailDialog); openItemDialog(record); }
    if (action === "export-one") await exportArchiveRecords([record]);
    if (action === "report-one") openReportDialog("archive", [record.id]);
  });

  $("#active-report-button").addEventListener("click", () => openReportDialog("active"));
  $("#archive-report-button").addEventListener("click", () => openReportDialog("archive", [...state.selectedArchive]));
  $("#report-candidates").addEventListener("change", (event) => {
    const input = event.target.closest('input[type="checkbox"]');
    if (!input) return;
    if (input.checked && state.reportSelection.size >= 2) {
      input.checked = false;
      $("#report-error").textContent = "1枚の帳票に選べるのは2件までです。";
      $("#report-error").hidden = false;
      return;
    }
    $("#report-error").hidden = true;
    if (input.checked) state.reportSelection.add(input.value);
    else state.reportSelection.delete(input.value);
    updateReportSelection();
  });
  $("#report-print-button").addEventListener("click", () => {
    const source = state.reportSource === "archive" ? state.archive : state.active;
    const records = [...state.reportSelection].map((id) => source.find((record) => record.id === id)).filter(Boolean);
    openPrintReport(records);
  });

  $("#confirm-cancel").addEventListener("click", () => resolveConfirm(false));
  $("#confirm-accept").addEventListener("click", () => resolveConfirm(true));
  refs.confirmDialog.addEventListener("cancel", (event) => { event.preventDefault(); resolveConfirm(false); });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-close-dialog]");
    if (button) closeDialog(button.closest("dialog"));
  });
  $$('dialog:not(#confirm-dialog)').forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.installPrompt = event;
    $("#install-button").hidden = false;
  });
  $("#install-button").addEventListener("click", async () => {
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    $("#install-button").hidden = true;
  });
  window.addEventListener("appinstalled", () => toast("NAOSUを端末に追加しました"));
  window.addEventListener("beforeunload", () => [...urlScopes.keys()].forEach(clearUrls));
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch {
    // オフライン登録に失敗しても写真管理機能は継続する。
  }
}

async function init() {
  try {
    await openDatabase();
    bindEvents();
    resetItemForm();
    refs.bulkForm.elements.beforeDate.value = todayValue();
    await refreshData();
    registerServiceWorker();
  } catch (cause) {
    document.body.innerHTML = `<main class="main-shell"><div class="empty-state"><h1>保存領域を開けませんでした</h1><p>${escapeHtml(cause.message)}</p><button class="button button-primary" onclick="location.reload()">再読み込み</button></div></main>`;
  }
}

init();
