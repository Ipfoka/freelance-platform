param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile
)

if (-not $env:DATABASE_URL) {
  Write-Error 'DATABASE_URL is required.'
  exit 1
}

if (-not (Test-Path $BackupFile)) {
  Write-Error "Backup file not found: $BackupFile"
  exit 1
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  Write-Error 'psql is not available in PATH.'
  exit 1
}

Write-Host "Restoring backup from: $BackupFile"
& psql "$env:DATABASE_URL" -f "$BackupFile"

if ($LASTEXITCODE -ne 0) {
  Write-Error 'Restore failed.'
  exit $LASTEXITCODE
}

Write-Host 'Restore completed successfully.'
