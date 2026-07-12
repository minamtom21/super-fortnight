const encoder = new TextEncoder();

function uint16(value) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function uint32(value) {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ]);
}

function joinBytes(parts) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosTime(date) {
  const hours = Math.max(0, Math.min(23, date.getHours()));
  const minutes = Math.max(0, Math.min(59, date.getMinutes()));
  const seconds = Math.max(0, Math.min(59, date.getSeconds()));
  return (hours << 11) | (minutes << 5) | Math.floor(seconds / 2);
}

function dosDate(date) {
  const year = Math.max(1980, date.getFullYear());
  return ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
}

async function toBytes(value) {
  if (typeof value === "string") return encoder.encode(value);
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (value instanceof Blob) return new Uint8Array(await value.arrayBuffer());
  return encoder.encode(JSON.stringify(value, null, 2));
}

export class ZipArchive {
  constructor() {
    this.entries = [];
  }

  async add(path, value, modifiedAt = new Date()) {
    const cleanPath = String(path)
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\.{2,}/g, ".");
    if (!cleanPath) throw new Error("ZIP内のファイル名が空です。");
    const data = await toBytes(value);
    this.entries.push({ path: cleanPath, name: encoder.encode(cleanPath), data, modifiedAt });
  }

  toBlob() {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    this.entries.forEach((entry) => {
      const checksum = crc32(entry.data);
      const time = dosTime(entry.modifiedAt);
      const date = dosDate(entry.modifiedAt);
      const flags = 0x0800;
      const localHeader = joinBytes([
        uint32(0x04034b50),
        uint16(20),
        uint16(flags),
        uint16(0),
        uint16(time),
        uint16(date),
        uint32(checksum),
        uint32(entry.data.length),
        uint32(entry.data.length),
        uint16(entry.name.length),
        uint16(0),
        entry.name,
      ]);
      localParts.push(localHeader, entry.data);

      const centralHeader = joinBytes([
        uint32(0x02014b50),
        uint16(20),
        uint16(20),
        uint16(flags),
        uint16(0),
        uint16(time),
        uint16(date),
        uint32(checksum),
        uint32(entry.data.length),
        uint32(entry.data.length),
        uint16(entry.name.length),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(0),
        uint32(offset),
        entry.name,
      ]);
      centralParts.push(centralHeader);
      offset += localHeader.length + entry.data.length;
    });

    const centralDirectory = joinBytes(centralParts);
    const end = joinBytes([
      uint32(0x06054b50),
      uint16(0),
      uint16(0),
      uint16(this.entries.length),
      uint16(this.entries.length),
      uint32(centralDirectory.length),
      uint32(offset),
      uint16(0),
    ]);

    return new Blob([...localParts, centralDirectory, end], { type: "application/zip" });
  }
}

export function safePathPart(value, fallback = "未設定") {
  return String(value || fallback)
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || fallback;
}

export function csvCell(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
