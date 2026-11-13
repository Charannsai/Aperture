param([string]$Source = "$PSScriptRoot\..\vscode")
$ErrorActionPreference = 'Stop'
if (-not $IsWindows -or [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -ne 'X64') { throw 'Run on Windows x64 using PowerShell 7.' }
$Overlay = (Resolve-Path "$PSScriptRoot\..").Path
$Commit = 'e608ca420ca76f4bfc2cfbff02538d66242e8174'
function Run([scriptblock]$Command) { & $Command; if ($LASTEXITCODE -ne 0) { throw "Command failed ($LASTEXITCODE)" } }
if (Test-Path $Source) { throw 'Source destination already exists. Choose an empty path; existing work will not be deleted.' }
Run { git init $Source }
Push-Location $Source
try {
  Run { git config core.longpaths true }
  Run { git remote add upstream https://github.com/microsoft/vscode.git }
  Run { git fetch --depth 1 upstream $Commit }
  Run { git checkout --detach FETCH_HEAD }
  if ((git rev-parse HEAD).Trim() -ne $Commit) { throw 'Upstream pin mismatch' }
  Run { node "$Overlay\scripts\prepare.mjs" $Source $Overlay }
  $env:BUILD_SOURCEVERSION = $Commit
  $env:VSCODE_ARCH = 'x64'
  $env:VSCODE_SEQUENTIAL_NATIVE_INSTALLS = '1'
  $env:NODE_OPTIONS = '--max-old-space-size=6144'
  Run { npm install --global pnpm@12.16.0 }
  Run { pnpm install --frozen-lockfile }
  Run { node build/npm/electronTypes.ts }
  Run { pnpm exec tsc -p extensions/aperture-ai/tsconfig.json --noEmit }
  Run { node "$Overlay\scripts\bundle-extension.mjs" $Source }
  Run { node "$Overlay\scripts\test-provider.cjs" }
  Run { pnpm run gulp vscode-win32-x64 }
  Run { pnpm run gulp vscode-win32-x64-inno-updater }
  Run { pnpm run gulp vscode-win32-x64-user-setup }
  $Setup = Join-Path $Source '.build\win32-x64\user-setup\VSCodeSetup.exe'
  if (-not (Test-Path $Setup)) { throw 'Windows setup output missing' }
  $Artifacts = Join-Path $Overlay 'artifacts'
  New-Item -ItemType Directory -Force $Artifacts | Out-Null
  Copy-Item $Setup "$Artifacts\Aperture-Preview-Windows-x64-Setup.exe"
  (Get-FileHash "$Artifacts\Aperture-Preview-Windows-x64-Setup.exe" -Algorithm SHA256).Hash | Set-Content "$Artifacts\SHA256.txt"
  Write-Host 'Unsigned installer built. Windows smoke/install/uninstall validation is still required.'
} finally { Pop-Location }
