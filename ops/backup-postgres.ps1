param(
  [string]$BackupFile = "./backups/backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
)

if (-not $env:DATABASE_URL) {
  Write-Error 'DATABASE_URL is required.'
  exit 1
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
  Write-Error 'pg_dump is not available in PATH.'
  exit 1
}

$directory = Split-Path -Parent $BackupFile
if (-not [string]::IsNullOrWhiteSpace($directory)) {
  New-Item -ItemType Directory -Force -Path $directory | Out-Null
}

Write-Host "Creating backup: $BackupFile"
& pg_dump "$env:DATABASE_URL" --no-owner --format=plain --file="$BackupFile"

if ($LASTEXITCODE -ne 0) {
  Write-Error 'Backup failed.'
  exit $LASTEXITCODE
}

Write-Host 'Backup completed successfully.'
