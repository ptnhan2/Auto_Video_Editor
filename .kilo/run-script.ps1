# Run script for Agent Manager.
# Runs in the selected worktree (or repo root for local).
# 
# Steps:
# 1. Copy database.sqlite from main worktree if not exists
# 2. Install dependencies if node_modules missing (npm ci for deterministic)
# 3. Start dev server on unique port (avoid 3000 conflict)

$ErrorActionPreference = "Stop"

Write-Output "[kilo] Setting up worktree..."

# ── 1. Copy database from main worktree ────────────────────────────

if (-not (Test-Path "database.sqlite")) {
    $mainDb = Join-Path (Get-Item "..\..\..").FullName "database.sqlite"
    if (Test-Path $mainDb) {
        Copy-Item $mainDb "database.sqlite"
        Write-Output "[kilo] Copied database.sqlite from main worktree"
    } else {
        Write-Output "[kilo] WARNING: No database.sqlite found in main worktree"
    }
} else {
    Write-Output "[kilo] database.sqlite already exists — skipping copy"
}

# ── 2. Install dependencies if needed ──────────────────────────────

if (-not (Test-Path "node_modules")) {
    Write-Output "[kilo] Installing npm dependencies (npm ci)..."
    npm ci
}

# ── 3. Start dev server ────────────────────────────────────────────

npm run dev
