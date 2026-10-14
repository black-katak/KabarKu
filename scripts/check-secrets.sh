#!/usr/bin/env bash
# Menolak push jika ada berkas atau isi yang berbahaya di repo.
# Kunci publishable Supabase (sb_publishable_ atau anon JWT) sengaja publik, tetapi tetap tidak dimasukkan ke repo.
set -u
cd "$(git rev-parse --show-toplevel)"
bad=0

# 1. Berkas terlarang yang terlacak
tracked=$(git ls-files | grep -E '(^|/)\.env($|\.)|\.pem$|\.key$|service-account.*\.json$|(^|/)\.netlify/' | grep -v '^\.env\.example$')
if [ -n "$tracked" ]; then echo "BERKAS TERLARANG terlacak:"; echo "$tracked"; bad=1; fi

# 2. Pola rahasia di isi berkas terlacak
pat='sb_secret_|service_role|SUPABASE_SERVICE|eyJhbGci[A-Za-z0-9_-]{20,}|sb_publishable_[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9]{20,}|github_pat_|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|nfp_[A-Za-z0-9]{20,}|password[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"']{4,}'
hits=$(git grep -nIE "$pat" -- . ':!package-lock.json' ':!scripts/check-secrets.sh' ':!README.md' || true)
if [ -n "$hits" ]; then echo "POLA RAHASIA ditemukan:"; echo "$hits"; bad=1; fi

if [ "$bad" -ne 0 ]; then echo; echo "Push dibatalkan. Hapus isi di atas dari repo dulu."; exit 1; fi
echo "Aman: tidak ada rahasia di berkas terlacak."
