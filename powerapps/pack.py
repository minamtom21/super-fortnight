#!/usr/bin/env python3
"""
PowerUps - Power Apps source -> .msapp packer

Microsoft の .msapp 形式は ZIP コンテナ内に CanvasManifest.json /
Properties.json / Header.json / 画面定義などを格納する独自フォーマットです。
このスクリプトは src/ 配下のソースをそのまま .msapp として ZIP 化します。

正規ビルドには Microsoft Power Platform CLI を使用してください:
    pac canvas pack --sources ./src --msapp ./build/PowerUps.msapp

依存: 標準ライブラリのみ (zipfile)
"""

from pathlib import Path
import zipfile
import sys

ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "build" / "PowerUps.msapp"


def pack() -> Path:
    if not SRC.exists():
        sys.exit(f"source directory not found: {SRC}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists():
        OUT.unlink()

    files = [p for p in SRC.rglob("*") if p.is_file()]
    files.sort()

    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            arcname = f.relative_to(SRC).as_posix()
            zf.write(f, arcname)
            print(f"  + {arcname}")

    print(f"\nwrote {OUT}  ({OUT.stat().st_size:,} bytes, {len(files)} files)")
    return OUT


if __name__ == "__main__":
    pack()
