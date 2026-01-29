import {readFile, copyFile, mkdir} from 'node:fs/promises';
import {CLI, Command} from './cli';
import {PowershellHelper} from './pwsh-helper';
import {existsSync, realpathSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {Glob} from 'bun';
import {ENSURE_FOLDERS, MIRRORS_FOLDER_PATH} from './constants';
import {ERROR} from './logger';

export async function main(): Promise<void> {
   await ENSURE_FOLDERS();
   const packages = await PowershellHelper.GetAppxPackage('Microsoft.Minecraft*UWP*');
   if (!packages) return void console.error('Failed to invoke');
   if (!packages[0]) return void console.error('Installation not found');

   let {PackageFamilyName, InstallationPath, Version} = packages[0];
   if (!PackageFamilyName.toLowerCase().includes('minecraft'))
      return void ERROR(
         `Minecraft Package Not Found: Looking for preview? Run with *minecraftwindowsbeta*`
      );
   InstallationPath = realpathSync(InstallationPath);
   const PACKAGE_NAME = PackageFamilyName.substring(
      PackageFamilyName.indexOf('.') + 1,
      PackageFamilyName.lastIndexOf('_')
   );
   const FOLDER_NAME = join(MIRRORS_FOLDER_PATH, `${PACKAGE_NAME}-${Version}`.toLowerCase());
   if (existsSync(FOLDER_NAME)) {
      console.log('This version is already archived at: ' + FOLDER_NAME);
      return;
   }
   await mkdir(FOLDER_NAME).catch((_) => null);
   const applicationId = await getPackageApplicationId(InstallationPath);
   if (!applicationId) return;

   let tasks = new Set<Promise<void>>();
   const filterRegex = /.exe/;
   let i = 0,
      time = performance.now();
   for await (const path of new Glob('**/*').scan({
      onlyFiles: true,
      cwd: InstallationPath,
      absolute: false
   })) {
      if (filterRegex.test(path)) {
         console.log('Filtered: ' + path);
         continue;
      }
      i++;

      const destination = join(FOLDER_NAME, path);
      const d = dirname(destination);
      if (!existsSync(d)) {
         console.log('\x1b[34mCoping Folder: ' + d.substring(FOLDER_NAME.length));
         await mkdir(d, {recursive: true});
      }

      const task = copyFile(join(InstallationPath, path), join(FOLDER_NAME, path)).then(
         (_) => void tasks.delete(task)
      );
      tasks.add(task);
      if (tasks.size > 50) await task;
   }
   await Promise.all(tasks);

   console.log(`\x1b[32mCopied ${i} files in ${Math.ceil((performance.now() - time) / 100) / 10}s`);
   console.log(`\x1b[32mArchived in: file:///${FOLDER_NAME.replaceAll('\\', '/')}/`);
   console.log(`\x1b[0m`);

   await PowershellHelper.InvokeCommandInDesktopPackage(
      PackageFamilyName,
      applicationId,
      Bun.argv[0]!,
      [
         Bun.argv[1]!,
         CLI.createCommand(Command.Copy, {
            source: join(InstallationPath, 'Minecraft.Windows.exe'),
            destination: resolve(FOLDER_NAME, 'Minecraft.Windows.exe')
         })
      ]
   );
}

async function getPackageApplicationId(installationPath: string): Promise<string | null> {
   return await readFile(join(installationPath, 'AppxManifest.xml'))
      .then(
         (_) =>
            _.toString().match(/<Application(?:\s+[^>]*)??\s+Id\s*=\s*["']([^"']+)["']/is)?.[1] ??
            null
      )
      .catch((_) => null);
}
