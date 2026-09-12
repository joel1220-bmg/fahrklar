# Fahrklar verification gate.
#
#   pwsh ./verify.ps1          types + tests + lint + production build
#   pwsh ./verify.ps1 -Quick   types + tests only (a few seconds)
#
# Run this before calling any change done, and always before committing work
# from more than one agent. Every wave ends on a green tree.

param(
    [switch]$Quick
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$failures = New-Object System.Collections.Generic.List[string]
$started = Get-Date

function Invoke-Step {
    param([string]$Name, [scriptblock]$Body)

    Write-Host ""
    Write-Host "-- $Name" -ForegroundColor Cyan
    $t0 = Get-Date
    try {
        & $Body
        $code = $LASTEXITCODE
    } catch {
        Write-Host $_.Exception.Message
        $code = 1
    }
    $secs = [math]::Round(((Get-Date) - $t0).TotalSeconds, 1)

    if ($code -ne 0) {
        Write-Host "   FAIL ($secs s)" -ForegroundColor Red
        $failures.Add($Name)
    } else {
        Write-Host "   ok ($secs s)" -ForegroundColor Green
    }
}

Invoke-Step "Typen" { npx tsc --noEmit }
Invoke-Step "Tests" { npx vitest run }

if (-not $Quick) {
    Invoke-Step "Lint" { npx eslint . }
    Invoke-Step "Build" { npx next build }
}

$total = [math]::Round(((Get-Date) - $started).TotalSeconds, 1)
Write-Host ""

if ($failures.Count -gt 0) {
    Write-Host "FEHLGESCHLAGEN nach $total s: $($failures -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host "Alles gruen in $total s." -ForegroundColor Green
if ($Quick) {
    Write-Host "(Quick-Lauf - Lint und Build wurden uebersprungen.)" -ForegroundColor DarkGray
}
exit 0
