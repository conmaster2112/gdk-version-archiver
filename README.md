# GDK Version Archiver

**NOTICE: THIS TOOL DOES NOT HELP YOU TO PIRATE THE GAME. YOU MUST OWN A LEGITIMATE COPY OF MINECRAFT TO USE THIS TOOL.**

A CLI tool for archiving and managing Minecraft GDK installations on Windows. It captures current installations as mirrors and manages them using tags for easy version switching.

- **Archive Versions**: Capture installed Appx packages to local mirrors.
- **Tagging**: Use tags like `current` or `beta` to manage different versions. Default is `current` tag and is also hardcoded to always be used.
- **Protected File Handling**: Automatically copies encrypted files via internal instructions.
- **Concurrent Copying**: Fast archiving using a task concurrency channel.

## Setup and Usage
**Prerequisites**: Windows OS, [Bun](https://bun.sh/) runtime, and Powershell.

```bash
pnpm add gdk-version-archiver
npm run build
```

CLI name: `gdkva`

- **Archive**: `gdkva archive [package-pattern]`
   - `--tag <name>`: Target tag (default: `current`).
   - `--force`: Overwrite existing mirrors.
   - `--concurrency <n>`: Parallel file copy limit. Default is `10`, recommended is to follow default value.
- **List**: `gdkva list` - Show stored mirrors and tags.
- **Run**: `gdkva run --tag <name>` - Launch a tagged version. Default is `current` tag.

Global flags: `--verbose`, `--tag <name>`.

## Storage and Mechanics

Data is stored in `%APPDATA%\ConMaster.BedrockArchiver\clients\`.

- `mirrors/`: Full version file structures.
- `tags/`: Junctions pointing to specific mirrors.

The tool bypasses GDK file protections by invoking a copy instruction within the package context. It then uses symlink junctions to allow external tools to reference a static path while the underlying version is updated.

### Is it slow?
This tool performs have to call powershell.exe under the hood to get access to the windows package manager to obtain package information, after wards its only matter of your hard-drive write throughput, by default this tool performs 10 copy operations concurrently.

### Why it feels slow?
We only logging directories thats are currently being traversed, not all files, so if you think its being stuck its probably coping hundreds of files. 