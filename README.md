# Charan IDE - Silk Preview

A desktop IDE based on a pinned current Code-OSS source snapshot, with an integrated assistant and warm Graphite/Porcelain themes. "Silk" is a working product name. Early development, not a stable release or a promise of feature parity with commercial AI editors.

`1-source-overlay.zip` contains the complete readable source additions and build/test scripts with their directory structure. The root workflow expands this archive before building. It contains no dependencies, credentials or private project data.

## Windows release work

Target: Windows x64. The manual Actions workflow builds the full upstream desktop application plus our extension and creates an unsigned per-user Windows setup candidate. It never publishes a GitHub Release automatically. Build success alone is not acceptance: installation, launch, file editing, terminal, language tools, AI diff/apply, restart and uninstall need Windows validation before delivery as a tested release.

The source checkout is pinned to `e608ca420ca76f4bfc2cfbff02538d66242e8174` of microsoft/vscode. This repository contains our readable extension source, themes and reproducible build recipe rather than a duplicate copy of that large repository. The build fetches the exact public upstream revision and retains its license/third-party notices. No Microsoft Marketplace entitlement is implied. No Microsoft branding or service keys are supplied.

Extract `1-source-overlay.zip` first. Run from Windows x64 with PowerShell 7, Git, Node 24.22.1, Python 3.11 and the Visual Studio C++ build tools required by the pinned upstream source. `scripts/build-windows.ps1` installs the pinned pnpm tool, downloads dependencies, compiles native components and runs the upstream Windows desktop/installer tasks. It refuses to overwrite an existing source folder. This pipeline is under validation; build failures are not hidden or converted into a demo package.

Installer identity and data folders are isolated from stock Code-OSS/VS Code. Updater is disabled until a trusted update route exists. Builds are unsigned; no certificate purchase or SmartScreen bypass is included. Model downloads are not bundled.

## Assistant

- Ask, Edit and Plan with streaming Ollama or OpenAI-compatible endpoints.
- Explicit selection/current-file context, capped at 32,000 characters; sensitive-path guard.
- Local filename-only workspace overview, without uploading file contents.
- Native diff preview, stale-file protection, user confirmation and unsaved edits.
- User-only provider settings; secrets in editor SecretStorage and bound to their configured endpoint.
- Optional inline completion is off by default.
- Light/dark theme toggle, subtle blur-to-sharp UI reveals, reduced-motion support.

No autonomous terminal execution or whole-machine monitoring. A local model is separate from any existing assistant conversation. No external chat-room integration is configured.

## Validation so far

The Linux development app has been launched and visually inspected. Custom endpoint/streaming/cancellation tests passed; stale-file and reduced-motion checks passed. A small real local Qwen2.5-Coder test streamed a correction for an arithmetic function, showed its diff, required confirmation, and changed disk only after explicit Save. This is not a general AI correctness guarantee. Windows setup and native runtime validation are pending.

## Licensing

Our additions: MIT, see LICENSE. Upstream Code-OSS: MIT, see UPSTREAM-LICENSE.txt. Keep all upstream notices in packaged builds. Provider use follows its own terms and may cost money when using an external API.
