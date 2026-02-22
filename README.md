# GDK Version Archiver

[![NPM Package](https://img.shields.io/npm/v/gdk-version-archiver)](https://www.npmjs.com/package/gdk-version-archiver) 

> **NOTICE: THIS TOOL DOES NOT HELP YOU PIRATE THE GAME. YOU MUST OWN A LEGITIMATE COPY OF MINECRAFT TO USE THIS TOOL.**

**GDK Version Archiver** is a CLI tool designed to help you archive and manage Minecraft GDK installations on Windows. It captures your current installations as "mirrors" and lets you manage them using simple tags, making version switching fast and effortless.

### Features
- **Tagging System:** Use tags like `current` or `beta` to manage and switch between different game versions.
- **Protected File Handling:** Automatically handles and copies encrypted files via pwsh decryption commands.
- **Concurrent Copying:** Used to copy multiple files at once

---

## Prerequisites

- **Windows OS** (10 or later)
- **PowerShell** (Pre-installed on Windows)
- **[Bun Runtime](https://bun.sh/)** (Recommended)

*Note: While you can install this package using any preferred package manager (like `npm`, `yarn`, or `pnpm`), **Bun is recommended** for the best performance and compatibility. Also bun is already required to run this tool it self, See the [Why Bun?](#why-bun) section below.*

---

##  Installation

### 1. Install Bun
If you don't have Bun installed, download and install it from [bun.sh/docs/installation](https://bun.sh/docs/installation).

### 2. Install the Package Globally
Open PowerShell or your command prompt and run:

```powershell
bun install -g gdk-version-archiver
```

### Important: PATH Environment Variable

If you install the package globally, Bun needs to be in your system's `PATH` to run the commands directly.

1. To verify Bun is accessible, run: `bun --version`
2. If your terminal cannot find the `gdkva` command after installation, you may need to add Bun's global bin directory to your Windows PATH.

---

## Usage

Once installed, you can interact with the tool using the `gdkva` command.

*(If you are having PATH issues, you can alternatively invoke the package directly using Bun by typing `bunx gdkva <command>` instead of `gdkva <command>`)*.

### Archive your current version

Capture your current Minecraft GDK installation. By default, this saves as `current`.

```powershell
gdkva archive
```

**Options:**

* `--tag <name>`: Save the archive with a custom tag.
* `--concurrency <n>`: Number of simultaneous file copies (default is `10`).
* `--force`: Overwrite the tag if it already exists.

**Example:**

```powershell
gdkva archive --tag *windowsbeta* --concurrency 15
```

### List archived versions

See all of your stored versions and their assigned tags:

```powershell
gdkva list
```

### Run a specific version

Launch an archived version by referencing its tag:

```powershell
gdkva run --tag beta
```

---

## Where Your Data Is Stored

By default, all archives and tags are safely stored in your AppData folder:
`%APPDATA%\ConMaster.BedrockArchiver\clients\`

* `mirrors/` — Contains the full copies of your GDK installations.
* `tags/` — Contains shortcuts pointing to your specific mirrors.

---

## Performance Notes

* **Why does archiving take a while?** The tool must query Windows for package information via PowerShell. The actual copy speed depends entirely on your hard drive's write speed, *(It's lot of files!!!)*
* **The tool looks stuck:** Don't panic! To keep the terminal clean, the tool only shows directory names as it works, not individual file names. If a directory contains hundreds of files, it might temporarily look frozen while copying. This is totally normal.

---

## Why Bun?

I rely heavily on Bun's simplified process APIs to handle the archiving and execution logic under the hood. Since this tool was originally built for my own personal workflow, I chose the runtime that allowed for the most efficient development.

I don't currently have the resources to fully support the standard Node.js runtime, but **contributions and PRs are open** if anyone in the community wants to help expand compatibility!