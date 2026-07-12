const DB_NAME = "naosu-correction-photo-manager";
const DB_VERSION = 1;

export const ACTIVE_STORE = "activeCorrections";
export const ARCHIVE_STORE = "completedCorrections";
const SETTINGS_STORE = "settings";

let databasePromise;

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error || new Error("保存領域の読み込みに失敗しました。")), { once: true });
  });
}

function transactionComplete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error || new Error("保存処理が中断されました。")), { once: true });
    transaction.addEventListener("error", () => reject(transaction.error || new Error("保存処理に失敗しました。")), { once: true });
  });
}

export function openDatabase() {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.addEventListener("upgradeneeded", () => {
      const db = request.result;
      const makeCorrectionStore = (name) => {
        if (db.objectStoreNames.contains(name)) return;
        const store = db.createObjectStore(name, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("trade", "trade", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
        store.createIndex("completedAt", "completedAt", { unique: false });
      };

      makeCorrectionStore(ACTIVE_STORE);
      makeCorrectionStore(ARCHIVE_STORE);
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }
    });

    request.addEventListener("success", () => {
      const db = request.result;
      db.addEventListener("versionchange", () => db.close());
      resolve(db);
    }, { once: true });
    request.addEventListener("error", () => reject(request.error || new Error("アプリの保存領域を開けませんでした。")), { once: true });
    request.addEventListener("blocked", () => reject(new Error("別の画面でアプリが開かれています。すべて閉じてから再度お試しください。")), { once: true });
  });

  return databasePromise;
}

export async function getAllCorrections(storeName) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, "readonly");
  return requestResult(transaction.objectStore(storeName).getAll());
}

export async function getCorrection(storeName, id) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, "readonly");
  return requestResult(transaction.objectStore(storeName).get(id));
}

export async function saveActiveCorrection(correction) {
  const db = await openDatabase();
  const transaction = db.transaction(ACTIVE_STORE, "readwrite");
  transaction.objectStore(ACTIVE_STORE).put(correction);
  await transactionComplete(transaction);
  return correction;
}

export async function saveActiveCorrections(corrections) {
  if (!corrections.length) return;
  const db = await openDatabase();
  const transaction = db.transaction(ACTIVE_STORE, "readwrite");
  const store = transaction.objectStore(ACTIVE_STORE);
  corrections.forEach((correction) => store.put(correction));
  await transactionComplete(transaction);
}

export async function moveToArchive(id) {
  const db = await openDatabase();
  const transaction = db.transaction([ACTIVE_STORE, ARCHIVE_STORE], "readwrite");
  const activeStore = transaction.objectStore(ACTIVE_STORE);
  const archiveStore = transaction.objectStore(ARCHIVE_STORE);
  const correction = await requestResult(activeStore.get(id));
  if (!correction) {
    transaction.abort();
    throw new Error("対象の是正が見つかりませんでした。");
  }

  const archived = {
    ...correction,
    status: "done",
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  archiveStore.put(archived);
  activeStore.delete(id);
  await transactionComplete(transaction);
  return archived;
}

export async function restoreFromArchive(id) {
  const db = await openDatabase();
  const transaction = db.transaction([ACTIVE_STORE, ARCHIVE_STORE], "readwrite");
  const activeStore = transaction.objectStore(ACTIVE_STORE);
  const archiveStore = transaction.objectStore(ARCHIVE_STORE);
  const correction = await requestResult(archiveStore.get(id));
  if (!correction) {
    transaction.abort();
    throw new Error("対象の完了データが見つかりませんでした。");
  }

  const restored = {
    ...correction,
    status: correction.afterPhotos?.length ? "review" : "open",
    completedAt: null,
    updatedAt: new Date().toISOString(),
  };
  activeStore.put(restored);
  archiveStore.delete(id);
  await transactionComplete(transaction);
  return restored;
}

export async function deleteCorrection(storeName, id) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, "readwrite");
  transaction.objectStore(storeName).delete(id);
  await transactionComplete(transaction);
}

export async function saveSetting(key, value) {
  const db = await openDatabase();
  const transaction = db.transaction(SETTINGS_STORE, "readwrite");
  transaction.objectStore(SETTINGS_STORE).put({ key, value });
  await transactionComplete(transaction);
}

export async function getSetting(key, fallback = null) {
  const db = await openDatabase();
  const transaction = db.transaction(SETTINGS_STORE, "readonly");
  const setting = await requestResult(transaction.objectStore(SETTINGS_STORE).get(key));
  return setting?.value ?? fallback;
}

export async function clearAllData() {
  const db = await openDatabase();
  const transaction = db.transaction([ACTIVE_STORE, ARCHIVE_STORE, SETTINGS_STORE], "readwrite");
  transaction.objectStore(ACTIVE_STORE).clear();
  transaction.objectStore(ARCHIVE_STORE).clear();
  transaction.objectStore(SETTINGS_STORE).clear();
  await transactionComplete(transaction);
}
