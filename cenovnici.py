#!/usr/bin/env python3
"""Preuzimanje, validacija i analiza javnih cenovnika trgovaca sa data.gov.rs.

Upotreba:
    python3 -I cenovnici.py                 # otkrij, preuzmi (keš), parsiraj, izveštaj
    python3 -I cenovnici.py --refresh       # ponovo preuzmi sve CSV-ove
    python3 -I cenovnici.py --offline       # koristi samo ./data/raw + ./data/meta.json

Izlaz: ./data/raw/<trgovac>.csv, ./data/parquet/<trgovac>.parquet,
       ./report.md, ./report.json, sažetak na konzoli.
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import time
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path

import pandas as pd
import requests

API = "https://data.gov.rs/api/1"
PERMALINK = "https://data.gov.rs/sr/datasets/r/{rid}"
TAG = "cenovnik"
TITLE_PREFIX = "ценовници производа"

# Kanonske kolone po Pravilniku 76/2026, ovim redom.
COLUMNS = [
    "KATEGORIJA", "NAZIV KATEGORIJE", "Naziv proizvoda", "Robna marka",
    "Barkod proizvoda", "Jedinica mere", "Naziv trgovca - formata",
    "Datum cenovnika", "Redovna cena", "Cena po jedinici mere", "Snižena cena",
    "Datum početka sniženja", "Datum kraja sniženja", "Stopa PDV", "VRSTA_CENOVNIKA",
]
KEYS = [
    "kategorija", "naziv_kategorije", "naziv", "marka", "barkod", "jm", "format",
    "datum", "redovna", "po_jm", "snizena", "snizenje_od", "snizenje_do", "pdv", "vrsta",
]
PRICE_KEYS = ["redovna", "po_jm", "snizena"]
DATE_KEYS = ["datum", "snizenje_od", "snizenje_do"]
VRSTE = {"MESECNI_PRESEK": "MESEČNI_PRESEK", "VAZECI_CENOVNIK": "VAŽEĆI_CENOVNIK"}

CYR = dict(zip(
    "абвгдђежзијклљмнњопрстћуфхцчџшАБВГДЂЕЖЗИЈКЛЉМНЊОПРСТЋУФХЦЧЏШ",
    ["a", "b", "v", "g", "d", "đ", "e", "ž", "z", "i", "j", "k", "l", "lj", "m", "n",
     "nj", "o", "p", "r", "s", "t", "ć", "u", "f", "h", "c", "č", "dž", "š",
     "A", "B", "V", "G", "D", "Đ", "E", "Ž", "Z", "I", "J", "K", "L", "Lj", "M", "N",
     "Nj", "O", "P", "R", "S", "T", "Ć", "U", "F", "H", "C", "Č", "Dž", "Š"],
))


# ----------------------------------------------------------------- pomoćne

def translit(s: str) -> str:
    return "".join(CYR.get(ch, ch) for ch in s)


def fold(s: str) -> str:
    """Latinica, bez dijakritika, mala slova, samo [a-z0-9 ]."""
    s = translit(s).replace("đ", "dj").replace("Đ", "Dj")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch)).lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def slugify(s: str) -> str:
    return fold(s).replace(" ", "_") or "nepoznat"


def human_size(n: int | None) -> str:
    if n is None:
        return "?"
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return str(n)


def get(session: requests.Session, url: str, **kw) -> requests.Response:
    for attempt in range(5):
        try:
            r = session.get(url, timeout=120, **kw)
            if r.status_code >= 500:
                raise requests.HTTPError(f"{r.status_code} za {url}")
            r.raise_for_status()
            return r
        except (requests.ConnectionError, requests.Timeout, requests.HTTPError):
            if attempt == 4:
                raise
            time.sleep(2 ** (attempt + 1))
    raise RuntimeError("unreachable")


# ------------------------------------------------------- otkrivanje i preuzimanje

def pick_resource(ds: dict) -> tuple[dict | None, list[str]]:
    notes = []
    res = ds.get("resources") or []
    csvs = [r for r in res
            if (r.get("format") or "").lower() == "csv"
            or (r.get("url") or "").lower().split("?")[0].endswith(".csv")]
    if not csvs:
        return None, [f"dataset nema CSV resurs ({len(res)} resursa ukupno)"]
    if len(csvs) > 1:
        notes.append(f"dataset ima {len(csvs)} CSV resursa; uzet najskorije izmenjen")
        csvs.sort(key=lambda r: (r.get("last_modified") or r.get("created_at") or ""), reverse=True)
    return csvs[0], notes


def discover(session: requests.Session) -> list[dict]:
    url = f"{API}/datasets/?tag={TAG}&page_size=100"
    datasets, seen = [], set()
    while url:
        page = get(session, url).json()
        for ds in page.get("data", []):
            if ds["id"] not in seen:
                seen.add(ds["id"])
                datasets.append(ds)
        url = page.get("next_page")
    out = []
    for ds in datasets:
        title = (ds.get("title") or "").strip()
        if not title.lower().startswith(TITLE_PREFIX):
            continue
        merchant = title.rsplit(" - ", 1)[-1].strip() if " - " in title else title
        res, notes = pick_resource(ds)
        out.append({
            "merchant": merchant,
            "slug": slugify(merchant),
            "dataset_id": ds["id"],
            "dataset_title": title,
            "organization": (ds.get("organization") or {}).get("name"),
            "resource_id": res["id"] if res else None,
            "resource_title": res.get("title") if res else None,
            "last_modified": (res.get("last_modified") or res.get("created_at")) if res else None,
            "api_filesize": res.get("filesize") if res else None,
            "discovery_notes": notes,
        })
    # isti trgovac dvaput -> jedinstven slug
    counts = Counter(m["slug"] for m in out)
    for m in out:
        if counts[m["slug"]] > 1:
            m["slug"] = f"{m['slug']}_{m['dataset_id'][:6]}"
            m["discovery_notes"].append("više dataseta sa istim nazivom trgovca")
    return sorted(out, key=lambda m: fold(m["merchant"]))


def download(session: requests.Session, m: dict, raw_dir: Path, refresh: bool) -> None:
    path = raw_dir / f"{m['slug']}.csv"
    m["raw_path"] = str(path)
    if not m["resource_id"]:
        m["download_error"] = "nema CSV resursa"
        return
    if path.exists() and path.stat().st_size > 0 and not refresh:
        m["file_size"] = path.stat().st_size
        m["download_cached"] = True
        return
    try:
        r = get(session, PERMALINK.format(rid=m["resource_id"]), allow_redirects=True)
        path.write_bytes(r.content)
        m["final_url"] = r.url
        m["file_size"] = len(r.content)
        m["content_type"] = r.headers.get("Content-Type")
        m["download_cached"] = False
    except Exception as e:  # noqa: BLE001 - beležimo i nastavljamo
        m["download_error"] = f"{type(e).__name__}: {e}"


# ----------------------------------------------------------------- parsiranje

def decode(raw: bytes, dev: list[str]) -> str:
    if raw.startswith(b"\xef\xbb\xbf"):
        dev.append("UTF-8 BOM na početku fajla")
        return raw[3:].decode("utf-8", errors="replace")
    if raw[:2] in (b"\xff\xfe", b"\xfe\xff"):
        dev.append("kodiranje UTF-16 (umesto UTF-8)")
        return raw.decode("utf-16")
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        pass
    for enc in ("cp1250", "cp1251", "latin-1"):
        try:
            text = raw.decode(enc)
            dev.append(f"nije validan UTF-8; dekodirano kao {enc}")
            return text
        except UnicodeDecodeError:
            continue
    dev.append("nije validan UTF-8; nevalidni bajtovi zamenjeni")
    return raw.decode("utf-8", errors="replace")


def sniff_delimiter(text: str, dev: list[str]) -> str:
    lines = [ln for ln in text.splitlines()[:50] if ln.strip()]
    best, best_score = ";", -1
    for d in (";", ",", "\t", "|"):
        counts = [len(next(csv.reader([ln], delimiter=d))) for ln in lines]
        if not counts:
            continue
        mode, freq = Counter(counts).most_common(1)[0]
        score = freq * 100 + min(mode, 15) if mode > 1 else 0
        if score > best_score:
            best, best_score = d, score
    if best != ";":
        dev.append(f"separator {best!r} umesto ';'")
    return best


ALIASES = {k: [fold(c)] for k, c in zip(KEYS, COLUMNS)}
ALIASES["barkod"] += ["barkod", "bar kod", "ean", "gtin", "barcode", "barkod proizvoda ean"]
ALIASES["format"] += ["naziv trgovca", "naziv trgovca formata", "trgovac format", "format"]
ALIASES["vrsta"] += ["vrsta cenovnika", "tip cenovnika"]
ALIASES["pdv"] += ["pdv", "stopa pdv a", "pdv stopa"]
ALIASES["po_jm"] += ["cena po jm", "jedinicna cena", "cena po jedinici"]
ALIASES["snizenje_od"] += ["pocetak snizenja", "datum pocetka snizenja"]
ALIASES["snizenje_do"] += ["kraj snizenja", "datum kraja snizenja"]
ALIASES["kategorija"] += ["kategorija", "sifra kategorije", "id kategorije"]
ALIASES["naziv"] += ["naziv", "proizvod", "naziv artikla"]
ALIASES["marka"] += ["brend", "marka", "brand"]
ALIASES["jm"] += ["jm", "jedinica mere"]


def map_header(header: list[str], dev: list[str]) -> dict[int, str] | None:
    folded = [fold(h) for h in header]
    mapping: dict[int, str] = {}
    used: set[str] = set()
    inexact = []
    # 1) tačna podudaranja (posle normalizacije), 2) fuzzy
    for i, f in enumerate(folded):
        for k, al in ALIASES.items():
            if k not in used and f in al:
                mapping[i] = k
                used.add(k)
                if header[i].strip() != COLUMNS[KEYS.index(k)]:
                    inexact.append(f"'{header[i].strip()}'→'{COLUMNS[KEYS.index(k)]}'")
                break
    for i, f in enumerate(folded):
        if i in mapping or not f:
            continue
        best_k, best_r = None, 0.0
        for k, al in ALIASES.items():
            if k in used:
                continue
            r = max(SequenceMatcher(None, f, a).ratio() for a in al)
            if r > best_r:
                best_k, best_r = k, r
        if best_k and best_r >= 0.8:
            mapping[i] = best_k
            used.add(best_k)
            inexact.append(f"'{header[i].strip()}'≈'{COLUMNS[KEYS.index(best_k)]}'")
    if len(mapping) < 5:
        return None
    if inexact:
        dev.append("nazivi kolona odstupaju: " + ", ".join(inexact[:15])
                   + (f" (+{len(inexact) - 15})" if len(inexact) > 15 else ""))
    missing = [COLUMNS[KEYS.index(k)] for k in KEYS if k not in used]
    if missing:
        dev.append("nedostaju kolone: " + ", ".join(missing))
    extra = [header[i].strip() or f"#{i + 1}" for i in range(len(header)) if i not in mapping]
    if extra:
        dev.append("dodatne/neprepoznate kolone: " + ", ".join(extra))
    order = [mapping[i] for i in sorted(mapping)]
    if order != [k for k in KEYS if k in used]:
        dev.append("redosled kolona ne odgovara Pravilniku")
    if len(header) != 15:
        dev.append(f"broj kolona {len(header)} (očekivano 15)")
    return mapping


DIGITS = re.compile(r"^\d+$")
SCI = re.compile(r"^\d+(?:[.,]\d+)?[eE]\+?\d+$")


def norm_barcode(s: pd.Series) -> tuple[pd.Series, Counter]:
    issues: Counter = Counter()
    out = []
    for v in s:
        v0 = v.strip().strip('"').strip("'").lstrip("=").strip('"')
        if v0 != v:
            issues["barkod sa razmacima/navodnicima/'=' prefiksom"] += 1
        v = re.sub(r"\s+", "", v0)
        if v == "":
            out.append("")
            continue
        if SCI.match(v):
            issues["barkod u naučnoj notaciji (npr. 8.6E+12) – cifre izgubljene"] += 1
            out.append("")  # ne može se pouzdano rekonstruisati
            continue
        if re.match(r"^\d+[.,]0+$", v):
            issues["barkod kao decimalni broj ('...0' sufiks)"] += 1
            v = re.split(r"[.,]", v)[0]
        if not DIGITS.match(v):
            issues["barkod sadrži ne-cifre"] += 1
        out.append(v)
    return pd.Series(out, index=s.index, dtype="string"), issues


def ean13_ok(code: str) -> bool:
    d = [int(c) for c in code]
    return (10 - (sum(d[:12:2]) + 3 * sum(d[1:12:2])) % 10) % 10 == d[12]


STD_PRICE = re.compile(r"^\d+\.\d{2}$")


def parse_price(v: str, iss: Counter, col: str) -> float | None:
    s = v.strip()
    if s == "":
        return None
    if STD_PRICE.match(s):
        return float(s)
    t = re.sub(r"(?i)\s*(rsd|din\.?|дин\.?)\s*", "", s).replace("\u00a0", "").replace(" ", "")
    if t != s.replace(" ", ""):
        iss[f"{col}: valuta u ćeliji"] += 1
    if re.match(r"^\d{1,3}(\.\d{3})+,\d+$", t):
        iss[f"{col}: format 1.234,56"] += 1
        t = t.replace(".", "").replace(",", ".")
    elif re.match(r"^\d{1,3}(,\d{3})+\.\d+$", t):
        iss[f"{col}: format 1,234.56"] += 1
        t = t.replace(",", "")
    elif re.match(r"^-?\d+,\d+$", t):
        iss[f"{col}: decimalni zarez"] += 1
        t = t.replace(",", ".")
    try:
        f = float(t)
    except ValueError:
        iss[f"{col}: neparsirana vrednost"] += 1
        return float("nan")
    if not re.match(r"^\d+\.\d{2}$", t):
        iss[f"{col}: nije tačno 2 decimale"] += 1
    if f < 0:
        iss[f"{col}: negativna cena"] += 1
    return f


DATE_FORMATS = [
    ("%d-%m-%Y", None),
    ("%d.%m.%Y", "DD.MM.YYYY"), ("%d.%m.%Y.", "DD.MM.YYYY."), ("%Y-%m-%d", "YYYY-MM-DD"),
    ("%d/%m/%Y", "DD/MM/YYYY"), ("%Y-%m-%dT%H:%M:%S", "ISO datum-vreme"),
    ("%Y-%m-%d %H:%M:%S", "datum-vreme"), ("%d-%m-%Y %H:%M:%S", "DD-MM-YYYY sa vremenom"),
    ("%d.%m.%Y %H:%M:%S", "DD.MM.YYYY sa vremenom"), ("%d-%m-%y", "DD-MM-YY"),
]


def parse_dates(s: pd.Series, iss: Counter, col: str) -> pd.Series:
    cache: dict[str, object] = {}
    out = []
    for v in s:
        v = v.strip()
        if v not in cache:
            val = pd.NaT
            if v:
                for fmt, label in DATE_FORMATS:
                    try:
                        val = pd.Timestamp(datetime.strptime(v, fmt))
                        cache[v] = (val, label)
                        break
                    except ValueError:
                        continue
                else:
                    cache[v] = (pd.NaT, "neparsiran")
            else:
                cache[v] = (pd.NaT, None)
        val, label = cache[v]
        if label:
            iss[f"{col}: format {label}" if label != "neparsiran" else f"{col}: neparsiran datum"] += 1
        out.append(val)
    return pd.Series(out, index=s.index, dtype="datetime64[ns]")


def parse_file(m: dict, parquet_dir: Path) -> pd.DataFrame | None:
    dev: list[str] = []
    m["deviations"] = dev
    raw = Path(m["raw_path"]).read_bytes()
    head = raw[:512].lstrip().lower()
    if head.startswith((b"<!doctype", b"<html")):
        dev.append("preuzet HTML umesto CSV-a")
        return None
    if head.startswith(b"pk\x03\x04"):
        dev.append("preuzet ZIP/XLSX umesto CSV-a")
        return None
    text = decode(raw, dev)
    if "\r\n" in text[:10000]:
        pass  # CRLF je dozvoljen
    delim = sniff_delimiter(text, dev)

    bad_lines: list[list[str]] = []
    df = pd.read_csv(io.StringIO(text), sep=delim, dtype=str, keep_default_na=False,
                     header=None, engine="python", quoting=csv.QUOTE_MINIMAL,
                     on_bad_lines=lambda r: bad_lines.append(r) or None, skip_blank_lines=True)
    if df.empty:
        dev.append("prazan fajl")
        return None
    header = [str(x) for x in df.iloc[0].tolist()]
    mapping = map_header(header, dev)
    if mapping is None:
        # nema zaglavlja: ako ima 15 kolona, pretpostavi standardni redosled
        if df.shape[1] == 15:
            dev.append("nema reda zaglavlja; pretpostavljen standardni redosled")
            mapping = dict(enumerate(KEYS))
        else:
            dev.append(f"zaglavlje nije prepoznato ({df.shape[1]} kolona): {header[:6]}")
            return None
    else:
        df = df.iloc[1:]
    if bad_lines:
        dev.append(f"{len(bad_lines)} redova sa pogrešnim brojem polja (preskočeno)")

    df = df.rename(columns=mapping)[[k for k in KEYS if k in mapping.values()]]
    for k in KEYS:
        if k not in df.columns:
            df[k] = ""
    df = df[KEYS].reset_index(drop=True)
    # ponovljena zaglavlja (spojeni fajlovi)
    rep = df["naziv"].map(fold) == fold(COLUMNS[2])
    if rep.any():
        dev.append(f"{int(rep.sum())} ponovljenih redova zaglavlja u sredini fajla")
        df = df[~rep].reset_index(drop=True)
    allblank = (df.apply(lambda c: c.str.strip()) == "").all(axis=1)
    if allblank.any():
        dev.append(f"{int(allblank.sum())} potpuno praznih redova")
        df = df[~allblank].reset_index(drop=True)

    iss: Counter = Counter()

    # barkod
    df["barkod_norm"], biss = norm_barcode(df["barkod"])
    iss.update(biss)
    blen = df["barkod_norm"].str.len()
    df["barkod_valid13"] = df["barkod_norm"].str.fullmatch(r"\d{13}").fillna(False).astype(bool)
    n12 = int(((blen < 13) & (blen > 0) & df["barkod_norm"].str.fullmatch(r"\d+").fillna(False)).sum())
    if n12:
        iss["barkod kraći od 13 cifara (moguće izgubljene vodeće nule ili EAN-8/interni kod)"] += n12
    n14 = int((blen > 13).sum())
    if n14:
        iss["barkod duži od 13 znakova"] += n14
    valid = df.loc[df["barkod_valid13"], "barkod_norm"]
    df["barkod_ean_ok"] = False
    df.loc[valid.index, "barkod_ean_ok"] = [ean13_ok(c) for c in valid]
    bad_chk = int(df["barkod_valid13"].sum() - df["barkod_ean_ok"].sum())
    if bad_chk:
        iss["13-cifreni barkod sa pogrešnom EAN-13 kontrolnom cifrom"] += bad_chk

    # cene
    for k in PRICE_KEYS:
        col = COLUMNS[KEYS.index(k)]
        df[f"{k}_num"] = [parse_price(v, iss, col) for v in df[k]]
        df[f"{k}_num"] = df[f"{k}_num"].astype("float64")

    # datumi
    for k in DATE_KEYS:
        df[f"{k}_dt"] = parse_dates(df[k], iss, COLUMNS[KEYS.index(k)])

    # vrsta cenovnika
    vf = df["vrsta"].map(lambda v: re.sub(r"[^A-Z]+", "_", fold(v).upper()).strip("_"))
    df["vrsta_norm"] = vf.map(VRSTE).fillna("")
    nonstd = (df["vrsta"].str.strip() != df["vrsta_norm"]) & (df["vrsta_norm"] != "")
    if nonstd.any():
        vals = df.loc[nonstd, "vrsta"].str.strip().value_counts().head(3).index.tolist()
        iss[f"VRSTA_CENOVNIKA nestandardno zapisana (npr. {vals})"] += int(nonstd.sum())
    unk = df["vrsta_norm"] == ""
    if unk.any():
        vals = df.loc[unk, "vrsta"].str.strip().value_counts().head(3).index.tolist()
        iss[f"VRSTA_CENOVNIKA nepoznata/prazna (npr. {vals})"] += int(unk.sum())

    # kategorija
    kat = pd.to_numeric(df["kategorija"].str.strip().str.replace(r"\.0$", "", regex=True), errors="coerce")
    df["kategorija_num"] = kat.where(kat.between(1, 25) & (kat == kat.round())).astype("Int64")
    nk = int(df["kategorija_num"].isna().sum())
    if nk:
        vals = df.loc[df["kategorija_num"].isna(), "kategorija"].str.strip().value_counts().head(3).index.tolist()
        iss[f"KATEGORIJA van 1–25 ili prazna (npr. {vals})"] += nk

    # PDV
    pv = df["pdv"].str.strip()
    std_pdv = pv.str.fullmatch(r"\d+(\.\d+)?")
    if (~std_pdv & (pv != "")).any():
        vals = pv[~std_pdv & (pv != "")].value_counts().head(3).index.tolist()
        iss[f"Stopa PDV nestandardna (npr. {vals})"] += int((~std_pdv & (pv != "")).sum())

    # obavezna polja
    for k in ("naziv", "format", "datum"):
        n = int((df[k].str.strip() == "").sum())
        if n:
            iss[f"prazno polje '{COLUMNS[KEYS.index(k)]}'"] += n

    # sniženje bez datuma / sniženje veće od redovne
    has_sn = df["snizena_num"].notna() & (df["snizena_num"] > 0)
    n = int((has_sn & (df["snizena_num"] > df["redovna_num"])).sum())
    if n:
        iss["Snižena cena veća od redovne"] += n
    n = int((has_sn & (df["snizenje_od_dt"].isna() | df["snizenje_do_dt"].isna())).sum())
    if n:
        iss["Snižena cena bez datuma početka/kraja sniženja"] += n

    total = len(df)
    for k, v in sorted(iss.items(), key=lambda kv: -kv[1]):
        dev.append(f"{k}: {v} redova ({v / total:.1%})" if total else f"{k}: {v}")

    df.insert(0, "trgovac", m["merchant"])
    out = parquet_dir / f"{m['slug']}.parquet"
    df.to_parquet(out, index=False)
    m["parquet_path"] = str(out)
    m["delimiter"] = delim
    return df


# ------------------------------------------------------------------- metrike

def merchant_stats(m: dict, df: pd.DataFrame) -> None:
    n = len(df)
    vaz = df["vrsta_norm"] == "VAŽEĆI_CENOVNIK"
    mes = df["vrsta_norm"] == "MESEČNI_PRESEK"
    bad_price = df["redovna_num"].isna() | df["redovna_num"].map(lambda x: x != x)
    fmts = df["format"].str.strip()
    fmts = sorted(v for v in fmts.unique() if v)
    cat = df.loc[vaz if vaz.any() else slice(None), "kategorija_num"].value_counts()
    m["stats"] = {
        "rows": n,
        "rows_vazeci": int(vaz.sum()),
        "rows_mesecni": int(mes.sum()),
        "mesecni_preseci": int(df.loc[mes, "datum_dt"].dropna().nunique()),
        "mesecni_datumi": sorted(d.strftime("%d-%m-%Y") for d in df.loc[mes, "datum_dt"].dropna().unique()),
        "vazeci_datumi": sorted(d.strftime("%d-%m-%Y") for d in df.loc[vaz, "datum_dt"].dropna().unique())[:10],
        "pct_barkod13": round(100 * df["barkod_valid13"].mean(), 2) if n else 0.0,
        "pct_barkod_ean_ok": round(100 * df["barkod_ean_ok"].mean(), 2) if n else 0.0,
        "barkod_prazan": int((df["barkod_norm"] == "").sum()),
        "pct_bez_redovne_cene": round(100 * bad_price.mean(), 2) if n else 0.0,
        "formati_n": len(fmts),
        "formati": fmts,
        "kategorije_scope": "VAŽEĆI_CENOVNIK" if vaz.any() else "svi redovi",
        "po_kategoriji": {str(k): int(cat.get(k, 0)) for k in range(1, 26)},
    }


def intersection(frames: list[pd.DataFrame]) -> dict:
    all_df = pd.concat(frames, ignore_index=True)
    v = all_df[(all_df["vrsta_norm"] == "VAŽEĆI_CENOVNIK") & all_df["barkod_valid13"]
               & all_df["redovna_num"].notna() & (all_df["redovna_num"] > 0)]
    v = v[["trgovac", "barkod_norm", "naziv", "marka", "format", "redovna_num"]]
    # po trgovcu jedan red: minimalna redovna cena preko formata
    idx = v.groupby(["trgovac", "barkod_norm"])["redovna_num"].idxmin()
    per = v.loc[idx].reset_index(drop=True)
    nm = per.groupby("barkod_norm")["trgovac"].nunique()
    hist = nm.value_counts().sort_index()

    multi = per[per["barkod_norm"].isin(nm[nm >= 2].index)].copy()
    multi["naziv_fold"] = multi["naziv"].map(fold)
    names = multi.groupby("barkod_norm")["naziv_fold"].nunique()
    diff = names[names > 1]
    sample = []
    for bc in diff.sort_values(ascending=False).index[:20]:
        g = multi[multi["barkod_norm"] == bc].sort_values("trgovac")
        sample.append({"barkod": bc, "nazivi": [
            {"trgovac": r.trgovac, "naziv": r.naziv.strip()} for r in g.itertuples()]})

    top_rows = []
    for bc in nm.sort_values(ascending=False, kind="stable").index[:30] if len(nm) else []:
        g = per[per["barkod_norm"] == bc].sort_values("redovna_num")
        name = g["naziv"].str.strip().mode().iloc[0]
        brand_mode = g["marka"].str.strip()
        brand_mode = brand_mode[brand_mode != ""].mode()
        lo, hi = g["redovna_num"].min(), g["redovna_num"].max()
        top_rows.append({
            "barkod": bc, "trgovaca": int(nm[bc]), "naziv": name,
            "marka": brand_mode.iloc[0] if len(brand_mode) else "",
            "min": float(lo), "max": float(hi), "raspon": round(float(hi / lo), 3) if lo else None,
            "cene": [{"trgovac": r.trgovac, "cena": float(r.redovna_num)} for r in g.itertuples()],
        })
    # deterministički: među jednakim brojem trgovaca prvo najveći raspon cene nije kriterijum;
    # sortiramo po broju trgovaca pa po barkodu
    top_rows.sort(key=lambda r: (-r["trgovaca"], r["barkod"]))
    return {
        "redova_ulaz": int(len(v)),
        "parova_trgovac_barkod": int(len(per)),
        "trgovaca_u_preseku": int(per["trgovac"].nunique()),
        "barkodova_ukupno": int(len(nm)),
        "u_2plus": int((nm >= 2).sum()), "u_3plus": int((nm >= 3).sum()),
        "u_5plus": int((nm >= 5).sum()), "u_10plus": int((nm >= 10).sum()),
        "histogram": {int(k): int(c) for k, c in hist.items()},
        "barkodova_u_2plus_sa_razlicitim_nazivom": int(len(diff)),
        "pct_razlicit_naziv": round(100 * len(diff) / max(1, (nm >= 2).sum()), 2),
        "uzorak_razlicitih_naziva": sample,
        "top30": top_rows,
    }


# -------------------------------------------------------------------- izveštaj

def md_escape(s: str) -> str:
    return str(s).replace("|", "\\|").replace("\n", " ")


def fmt_price(x: float) -> str:
    return f"{x:,.2f}".replace(",", " ")


def write_report(merchants: list[dict], inter: dict | None, base: Path, generated: str) -> None:
    ok = [m for m in merchants if "stats" in m]
    failed = [m for m in merchants if "stats" not in m]
    L = []
    L.append("# Cenovnici trgovaca na malo — kvalitet podataka i presek asortimana\n")
    L.append(f"Generisano: {generated} · izvor: data.gov.rs (tag `{TAG}`) · "
             f"datasetova: {len(merchants)} · uspešno parsirano: {len(ok)} · neuspešno: {len(failed)}\n")
    L.append("> **Napomena o cenama:** prema Pravilniku, ako se cene razlikuju po prodajnim objektima, "
             "trgovac na portalu objavljuje **najvišu važeću cenu**. Cene u ovom izveštaju su dakle "
             "gornja granica po trgovcu, a ne cene u konkretnoj prodavnici.\n")

    L.append("## 1. Pregled po trgovcu\n")
    L.append("| Trgovac | resource_id | Poslednja izmena | Veličina | Redova | VAŽEĆI | MESEČNI redova | Mes. preseka | % barkod 13 | % EAN ok | Prazan barkod | % bez/neparsirana redovna | Formata |")
    L.append("|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
    for m in merchants:
        s = m.get("stats")
        lm = (m.get("last_modified") or "")[:10]
        if s:
            L.append(f"| {md_escape(m['merchant'])} | `{m['resource_id']}` | {lm} | {human_size(m.get('file_size'))} | "
                     f"{s['rows']:,} | {s['rows_vazeci']:,} | {s['rows_mesecni']:,} | {s['mesecni_preseci']} | "
                     f"{s['pct_barkod13']:.1f} | {s['pct_barkod_ean_ok']:.1f} | {s['barkod_prazan']:,} | "
                     f"{s['pct_bez_redovne_cene']:.2f} | {s['formati_n']} |")
        else:
            L.append(f"| {md_escape(m['merchant'])} | `{m.get('resource_id')}` | {lm} | {human_size(m.get('file_size'))} | "
                     f"**NIJE PARSIRANO** | | | | | | | | |")

    L.append("\n### Formati (\"Naziv trgovca - formata\")\n")
    L.append("| Trgovac | Broj | Vrednosti |")
    L.append("|---|---:|---|")
    for m in ok:
        s = m["stats"]
        vals = ", ".join(md_escape(v) for v in s["formati"][:20]) + (" …" if s["formati_n"] > 20 else "")
        L.append(f"| {md_escape(m['merchant'])} | {s['formati_n']} | {vals} |")

    L.append("\n### Broj proizvoda po kategoriji (1–25)\n")
    L.append("Broji redove VAŽEĆI_CENOVNIK (ako trgovac nema takve redove — sve redove).\n")
    L.append("| Trgovac | " + " | ".join(str(k) for k in range(1, 26)) + " |")
    L.append("|---|" + "---:|" * 25)
    for m in ok:
        pk = m["stats"]["po_kategoriji"]
        L.append(f"| {md_escape(m['merchant'])} | " + " | ".join(str(pk[str(k)]) for k in range(1, 26)) + " |")

    L.append("\n### Odstupanja od standarda\n")
    for m in merchants:
        devs = m.get("discovery_notes", []) + ([m["download_error"]] if m.get("download_error") else []) \
            + m.get("deviations", [])
        L.append(f"**{md_escape(m['merchant'])}**" + ("" if devs else " — bez odstupanja"))
        for d in devs:
            L.append(f"- {md_escape(d)}")
        L.append("")

    if inter:
        L.append("## 2. Presek asortimana\n")
        L.append("Ulaz: samo `VAŽEĆI_CENOVNIK`, samo validni 13-cifreni barkodovi, samo redovi sa parsiranom "
                 "redovnom cenom > 0; po trgovcu jedan red po barkodu (minimalna redovna cena preko formata).\n")
        L.append("| Metrika | Vrednost |")
        L.append("|---|---:|")
        for label, key in [("Trgovaca sa podacima u preseku", "trgovaca_u_preseku"),
                           ("Parova trgovac×barkod", "parova_trgovac_barkod"),
                           ("Različitih barkodova ukupno", "barkodova_ukupno"),
                           ("Barkodova u 2+ trgovaca", "u_2plus"), ("Barkodova u 3+ trgovaca", "u_3plus"),
                           ("Barkodova u 5+ trgovaca", "u_5plus"), ("Barkodova u 10+ trgovaca", "u_10plus"),
                           ("Barkodova (2+) sa različitim nazivom među trgovcima", "barkodova_u_2plus_sa_razlicitim_nazivom")]:
            L.append(f"| {label} | {inter[key]:,} |")
        L.append(f"| … udeo među barkodovima u 2+ | {inter['pct_razlicit_naziv']:.1f}% |")

        L.append("\n### Histogram: broj trgovaca po barkodu\n")
        L.append("| Trgovaca | Barkodova | |")
        L.append("|---:|---:|---|")
        mx = max(inter["histogram"].values()) if inter["histogram"] else 1
        for k, c in inter["histogram"].items():
            L.append(f"| {k} | {c:,} | {'█' * max(1, round(40 * c / mx))} |")

        L.append("\n### Isti barkod, različit naziv (uzorak 20)\n")
        L.append("Nazivi se porede posle normalizacije (latinica, bez dijakritika, mala slova, bez interpunkcije).\n")
        L.append("| Barkod | Nazivi po trgovcima |")
        L.append("|---|---|")
        for e in inter["uzorak_razlicitih_naziva"]:
            L.append(f"| `{e['barkod']}` | " + "<br>".join(
                f"{md_escape(x['trgovac'])}: {md_escape(x['naziv'])}" for x in e["nazivi"]) + " |")

        L.append("\n## 3. Top 30 barkodova po broju trgovaca\n")
        L.append("Cene su redovne cene (RSD), od najniže ka najvišoj; raspon = max/min.\n")
        L.append("| # | Barkod | Naziv | Marka | Trg. | Min | Max | Raspon | Cene po trgovcu |")
        L.append("|---:|---|---|---|---:|---:|---:|---:|---|")
        for i, r in enumerate(inter["top30"], 1):
            prices = "<br>".join(f"{md_escape(c['trgovac'])} {fmt_price(c['cena'])}" for c in r["cene"])
            L.append(f"| {i} | `{r['barkod']}` | {md_escape(r['naziv'])} | {md_escape(r['marka'])} | {r['trgovaca']} | "
                     f"{fmt_price(r['min'])} | {fmt_price(r['max'])} | {r['raspon']:.2f}× | {prices} |")

    (base / "report.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    payload = {
        "generated": generated, "source": API, "tag": TAG,
        "napomena": "Po trgovcu je objavljena najviša važeća cena ako se cene razlikuju po objektima.",
        "merchants": [{k: v for k, v in m.items() if k not in ("raw_path", "parquet_path")} for m in merchants],
        "intersection": inter,
    }
    (base / "report.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2, default=str), encoding="utf-8")


def print_summary(merchants: list[dict], inter: dict | None) -> None:
    ok = [m for m in merchants if "stats" in m]
    print(f"\nDatasetova: {len(merchants)} | parsirano: {len(ok)} | neuspešno: {len(merchants) - len(ok)}")
    print(f"{'Trgovac':<32}{'redova':>10}{'važeći':>10}{'%bc13':>8}{'%bez cene':>10}{'odstup.':>9}")
    for m in merchants:
        s = m.get("stats")
        if s:
            print(f"{m['merchant'][:31]:<32}{s['rows']:>10,}{s['rows_vazeci']:>10,}{s['pct_barkod13']:>8.1f}"
                  f"{s['pct_bez_redovne_cene']:>10.2f}{len(m.get('deviations', [])):>9}")
        else:
            why = m.get("download_error") or "; ".join(m.get("deviations", [])[-1:]) or "?"
            print(f"{m['merchant'][:31]:<32}  NEUSPEŠNO: {why[:80]}")
    if inter:
        print(f"\nPresek: {inter['barkodova_ukupno']:,} barkodova | 2+: {inter['u_2plus']:,} | "
              f"3+: {inter['u_3plus']:,} | 5+: {inter['u_5plus']:,} | 10+: {inter['u_10plus']:,}")
        print(f"Isti barkod, različit naziv: {inter['barkodova_u_2plus_sa_razlicitim_nazivom']:,} "
              f"({inter['pct_razlicit_naziv']:.1f}% barkodova u 2+)")
    print("Izveštaj: report.md, report.json")


# ------------------------------------------------------------------------ main

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base", default=".", help="osnovni direktorijum za data/ i report.*")
    ap.add_argument("--refresh", action="store_true", help="ponovo preuzmi CSV-ove")
    ap.add_argument("--offline", action="store_true", help="bez mreže: data/meta.json + data/raw")
    args = ap.parse_args()

    base = Path(args.base).resolve()
    raw_dir, pq_dir = base / "data" / "raw", base / "data" / "parquet"
    raw_dir.mkdir(parents=True, exist_ok=True)
    pq_dir.mkdir(parents=True, exist_ok=True)
    meta_path = base / "data" / "meta.json"

    if args.offline:
        merchants = json.loads(meta_path.read_text(encoding="utf-8"))
        for m in merchants:
            for k in ("stats", "deviations", "download_error"):
                m.pop(k, None)
            p = raw_dir / f"{m['slug']}.csv"
            m["raw_path"] = str(p)
            if p.exists():
                m["file_size"] = p.stat().st_size
            else:
                m["download_error"] = "nema keširanog fajla"
    else:
        session = requests.Session()
        session.headers["User-Agent"] = "cenovnici-analiza/1.0 (+python-requests)"
        print("Otkrivanje datasetova…", file=sys.stderr)
        merchants = discover(session)
        print(f"Nađeno {len(merchants)} datasetova sa cenovnicima.", file=sys.stderr)
        for i, m in enumerate(merchants, 1):
            print(f"[{i}/{len(merchants)}] {m['merchant']}", file=sys.stderr)
            download(session, m, raw_dir, args.refresh)
        meta_path.write_text(json.dumps(merchants, ensure_ascii=False, indent=2), encoding="utf-8")

    frames = []
    for m in merchants:
        if m.get("download_error"):
            continue
        try:
            df = parse_file(m, pq_dir)
        except Exception as e:  # noqa: BLE001
            m.setdefault("deviations", []).append(f"greška pri parsiranju: {type(e).__name__}: {e}")
            df = None
        if df is not None and len(df):
            merchant_stats(m, df)
            frames.append(df)
        elif df is not None:
            m["deviations"].append("nema redova sa podacima")

    inter = intersection(frames) if frames else None
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    write_report(merchants, inter, base, generated)
    print_summary(merchants, inter)
    return 0


if __name__ == "__main__":
    sys.exit(main())
