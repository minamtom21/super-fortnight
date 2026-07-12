const MAX_IMAGE_EDGE = 1920;
const THUMBNAIL_EDGE = 520;
const JPEG_QUALITY = 0.84;
const THUMBNAIL_QUALITY = 0.76;

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("写真の変換に失敗しました。"));
    }, type, quality);
  });
}

async function loadBitmap(blob) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      // Safari等ではフォールバックで読み込む。
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("この写真形式を読み込めませんでした。JPGまたはPNGへ変換してください。"));
      image.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function scaledSize(width, height, maxEdge) {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function drawCompressed(source, width, height, maxEdge, quality) {
  const size = scaledSize(width, height, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size.width, size.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, size.width, size.height);
  const blob = await canvasToBlob(canvas, "image/jpeg", quality);
  return { blob, ...size };
}

export async function preparePhoto(file) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error(`${file?.name || "選択ファイル"}は画像ではありません。`);
  }

  const source = await loadBitmap(file);
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  if (!width || !height) throw new Error(`${file.name}の画像サイズを確認できませんでした。`);

  try {
    const main = await drawCompressed(source, width, height, MAX_IMAGE_EDGE, JPEG_QUALITY);
    const thumbnail = await drawCompressed(source, width, height, THUMBNAIL_EDGE, THUMBNAIL_QUALITY);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return {
      id: crypto.randomUUID(),
      name: `${baseName}.jpg`,
      originalName: file.name,
      type: "image/jpeg",
      size: main.blob.size,
      originalSize: file.size,
      width: main.width,
      height: main.height,
      blob: main.blob,
      thumbnail: thumbnail.blob,
      createdAt: new Date().toISOString(),
    };
  } finally {
    if (typeof source.close === "function") source.close();
  }
}

export async function preparePhotos(files, onProgress = () => {}) {
  const list = Array.from(files || []);
  const prepared = [];
  for (let index = 0; index < list.length; index += 1) {
    prepared.push(await preparePhoto(list[index]));
    onProgress({ current: index + 1, total: list.length, file: list[index] });
  }
  return prepared;
}

export function photoUrl(photo, preferThumbnail = true) {
  const blob = preferThumbnail && photo?.thumbnail ? photo.thumbnail : photo?.blob;
  return blob ? URL.createObjectURL(blob) : "";
}

export function filenameToDescription(filename) {
  return String(filename || "指摘内容を入力してください")
    .replace(/\.[^.]+$/, "")
    .replace(/^\d+[\s_\-.]*/, "")
    .replace(/[_-]+/g, " ")
    .trim() || "指摘内容を入力してください";
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** index);
  const digits = index <= 1 ? 0 : value >= 100 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[index]}`;
}
