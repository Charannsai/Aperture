param([string]$Source = "$env:RUNNER_TEMP\aperture-vscode")
$ErrorActionPreference = 'Stop'
$Overlay = (Resolve-Path "$PSScriptRoot\..").Path
$Install = Join-Path $env:RUNNER_TEMP 'aperture-install-smoke'
if (Test-Path $Install) { throw 'Disposable install path already exists; refusing to overwrite.' }
$Setup = Join-Path $Overlay 'artifacts\Aperture-Preview-Windows-x64-Setup.exe'
$p = Start-Process -FilePath $Setup -ArgumentList @('/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART',"/DIR=$Install","/LOG=$Overlay\artifacts\install.log",'/MERGETASKS=!runcode,!addtopath,!associatewithfiles,!addcontextmenufiles,!addcontextmenufolders') -Wait -PassThru
if ($p.ExitCode -ne 0) { throw "Installer failed: $($p.ExitCode)" }
$Exe = Join-Path $Install 'Aperture Preview.exe'
if (-not (Test-Path $Exe)) { throw 'Installed executable missing' }
& node "$PSScriptRoot\smoke-installed.cjs" $Exe $Source "$Overlay\artifacts"
if ($LASTEXITCODE -ne 0) { throw 'Installed app smoke test failed' }
$Uninstaller = Get-ChildItem $Install -Filter 'unins*.exe' | Select-Object -First 1
if (-not $Uninstaller) { throw 'Uninstaller missing' }
$p = Start-Process -FilePath $Uninstaller.FullName -ArgumentList @('/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART',"/LOG=$Overlay\artifacts\uninstall.log") -Wait -PassThru
if ($p.ExitCode -ne 0) { throw "Uninstaller failed: $($p.ExitCode)" }
if (Test-Path $Exe) { throw 'Uninstall left the executable installed' }
Write-Host 'Install, smoke and uninstall checks passed in disposable Windows runner.'
