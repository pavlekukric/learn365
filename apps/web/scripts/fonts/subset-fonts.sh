#!/usr/bin/env bash
# Rebuilds apps/web/lib/fonts/files/*.woff2 — one Serbian-Latin subset per
# face (review 2026-10-01, P1 item 3). Run by hand only when a face, a weight
# or the character set changes; the output is committed.
#
# Needs: python3 with `pip install fonttools brotli`, network access.
# Sources: the google/fonts repo, the same versions Google Fonts serves
# (Spectral 2.005, Inter 4.001, JetBrains Mono 2.211 — checked 2026-10-02).
#
# Keep UNICODES in sync with SERBIAN_LATIN_RANGE in lib/fonts/fonts.ts; the
# test lib/fonts/fonts.test.ts fails when a lesson uses a character outside it.
set -euo pipefail

UNICODES='U+0020-007E,U+00A0-00FF,U+0102-0103,U+0106-0107,U+010C-010D,U+0110-0111,U+011E-011F,U+0130-0131,U+0152-0153,U+015E-0161,U+017D-017E,U+0218-021B,U+02BB-02BC,U+02BF,U+02C6,U+02DA,U+02DC,U+0300-0308,U+030C,U+2010-2027,U+202F-203A,U+20AC,U+2122,U+2190-2193,U+2212,U+2248,U+2260,U+2264-2265,U+FEFF,U+FFFD'
# Google's own subsets keep these GSUB features and ship unhinted; match them.
FEATURES='ccmp,locl,liga,calt,kern,mark,mkmk,tnum,pnum,frac,numr,dnom'

out="$(cd "$(dirname "$0")/../../lib/fonts/files" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
base=https://raw.githubusercontent.com/google/fonts/main/ofl

fetch() { curl -sSfL -o "$work/$2" "$base/$1"; }

subset() { # <source> <output name>
  pyftsubset "$1" --unicodes="$UNICODES" --layout-features="$FEATURES" --no-hinting \
    --flavor=woff2 --output-file="$out/$2.woff2"
}

fetch spectral/Spectral-Light.ttf spectral-300.ttf
fetch spectral/Spectral-Regular.ttf spectral-400.ttf
fetch spectral/Spectral-Medium.ttf spectral-500.ttf
fetch spectral/Spectral-Italic.ttf spectral-italic-400.ttf
fetch spectral/Spectral-MediumItalic.ttf spectral-italic-500.ttf
fetch 'inter/Inter%5Bopsz,wght%5D.ttf' inter-full.ttf
fetch 'jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf' mono-full.ttf

for face in 300 400 500; do subset "$work/spectral-$face.ttf" "spectral-normal-$face"; done
for face in 400 500; do subset "$work/spectral-italic-$face.ttf" "spectral-italic-$face"; done

# Variable fonts: pin Inter's optical size to 14 (what Google serves) and cut
# both weight axes to the 400–500 the app uses.
fonttools varLib.instancer "$work/inter-full.ttf" opsz=14 wght=400:500 -o "$work/inter.ttf"
fonttools varLib.instancer "$work/mono-full.ttf" wght=400:500 -o "$work/mono.ttf"
subset "$work/inter.ttf" inter
subset "$work/mono.ttf" jetbrains-mono
