import { ArgumentLike, Flag, NumberTypeValidator, StringTypeValidator, ValueFlag } from 'con-utils/cli';
import { ENVIRONMENT_INFO, ROOT, TAG } from './root';
import { PowershellHelper } from '../pwsh-helper';
import { ACCENT, ERROR, INFO, LOG, WARN } from '../logger';
import { realpath } from "node:fs/promises";
import { createCommand, InstructionType } from './instruction';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { MIRRORS_FOLDER_PATH, TAGS_FOLDER_PATH } from '../constants';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { TaskConcurrencyChannel } from 'con-utils/general';
import { pathToFileURL } from 'node:url';
import { copyFile } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import { rm } from 'node:fs/promises';
import { symlink } from 'node:fs/promises';
import { rmdir } from 'node:fs/promises';

const RECURSIVE_GLOB = new Bun.Glob("**/*");
const ARCHIVE = ROOT.createAction('archive', 'Archive current version', [
   new ArgumentLike('package-name', {
      defaultValue: "*minecraftuwp*",
      validator: new StringTypeValidator,
      description: 'Minecraft GDK Installation Package Name Pattern (*minecraftuwp*)'
   })
]);

const FORCE_TAG = new Flag("force", { long: "force", description: "Forces to overwrite archive folder if expected version is already archived." });
const CONCURRENCY_TAG = new ValueFlag("concurrency", { short: "c", defaultValue: 10, validator: new NumberTypeValidator(), long: "concurrency", description: "Forces to overwrite archive folder if expected version is already archived." });

ARCHIVE.flags.add(FORCE_TAG, CONCURRENCY_TAG);

ARCHIVE.action = async (_, packageName) => {
   const isForced = _.getValue(FORCE_TAG);
   INFO(`TARGET: ${ACCENT(packageName)}\n`);
   INFO(`----------------------------\n`);
   const data = await PowershellHelper.GetAppxPackage(packageName);
   LOG(`Found ${data?.length ?? 0} matches. . .\n`);
   if (!data || !data.length)
      return void ERROR("Failed to obtain installation\n");

   const packageInfo = data[0];
   if (!packageInfo) {
      ERROR("FAILED TO RESOLVE PACKAGE\n");
      return void ERROR(`Minecraft Package Not Found: Looking for preview? Run with *minecraftwindowsbeta*\n`);
   }

   const { InstallationPath, PackageFamilyName, Version } = packageInfo;
   if (!PackageFamilyName.toLowerCase().includes("minecraft"))
      return void ERROR(`Minecraft Package Not Found: Looking for preview? Run with *minecraftwindowsbeta*\n`);


   LOG(`RESOLVING REAL PATH FOR: ${JSON.stringify(InstallationPath)}\n`);
   LOG(`----------------------------\n`);
   let path = await realpath(InstallationPath).catch(_ => null);
   if (!path) {
      return void ERROR("FAILED TO RESOLVE INSTALLATION PATH\n");
   }

   INFO(`NAME:     ${ACCENT(PackageFamilyName)}\n`);
   INFO(`VERSION:  ${ACCENT(realVersion(Version))}\n`);
   INFO(`PATH:     ${ACCENT(toURL(path))}\n`);

   const REAL_VERSION = realVersion(Version);

   const appId = await getPackageApplicationId(path);
   if (!appId)
      return void ERROR("FAILED TO GET APPLICATION ID");
   INFO(`APPID:     ${ACCENT(appId)}\n`);

   const isPreview = (PackageFamilyName.toLowerCase().match(/beta|preview|candidate/)?.[0]);
   const name = `minecraft${isPreview ? "-" + isPreview : ""}_${REAL_VERSION}`;

   ENVIRONMENT_INFO(_);
   /*const MIRROR_ID = /^([^ .]+)\.([^ _]+)_([^ ]+)/.exec(PackageFamilyName);
   console.log(MIRROR_ID);*/

   const ARCHIVE_FOLDER = join(MIRRORS_FOLDER_PATH, name);
   let OLD_FILES: Set<string>;
   const KNOWN_FOLDERS = new Set<string>();
   const KNOWN_FILES = new Set<string>();
   if (existsSync(ARCHIVE_FOLDER)) {
      if (!isForced)
         return void ERROR("This version is already archived, if you are sure you can use --force tag to rewrite this version.\n");
      else OLD_FILES = new Set(Array.from(RECURSIVE_GLOB.scanSync({ cwd: ARCHIVE_FOLDER, dot: true, absolute: false, onlyFiles: true, followSymlinks: false })).map(e => e.toLowerCase()));
   }
   else {
      LOG(`Creating archive folder for this version, ${name}\n`);
      if (!await mkdir(ARCHIVE_FOLDER, { recursive: true }).then(_ => true, _ => false))
         return void ERROR("Something went wrong when creating folder\n");

      OLD_FILES = new Set();
   }


   INFO(`Invoking external process to decrypt the main executable and move it to archive\n`);
   const EXE_PATH = "Minecraft.Windows.exe";
   const SRC_EXE_PATH = join(path, EXE_PATH);
   const FINAL_EXE_PATH = join(ARCHIVE_FOLDER, EXE_PATH);
   const [runtime, ...args] = createCommand(InstructionType.Copy, SRC_EXE_PATH, FINAL_EXE_PATH);
   await PowershellHelper.InvokeCommandInDesktopPackage(PackageFamilyName, appId, runtime, args);

   const startTime = performance.now();
   await new Promise(res => setTimeout(res, 1000)); //Just waiting for it to start up
   LOG(`ORIGINAL STATS\n`);
   let { size } = await stat(SRC_EXE_PATH);
   while (performance.now() - startTime > 15 * 1000) {
      LOG(`WAITING FOR NEW STATS TO MATCH ORIGINAL\n`);
      await new Promise(res => setTimeout(res, 3_000)); //Just waiting for it to start up
      let data = (await stat(FINAL_EXE_PATH).catch(_ => null));
      if (data?.size === size)
         break;
   }
   INFO(`Successfully copied encrypted file: ${EXE_PATH}\n`);
   KNOWN_FILES.add(EXE_PATH.toLowerCase());

   const concurrency = _.getValue(CONCURRENCY_TAG);
   if (concurrency < 1)
      WARN(`Concurrency can not be less than 1!!!\n`);

   const channel = new TaskConcurrencyChannel(concurrency);
   let failedFiles: string[] = [];

   const FILTER = /(gamelaunchhelper.exe|layout.xml|layout_[^.\\\/]+.xml|minecraft.windows.exe)$/;
   let files = 0;
   for await (const file of RECURSIVE_GLOB.scan({ cwd: path, absolute: false, dot: true, followSymlinks: false, onlyFiles: true })) {
      files++;
      if (FILTER.test(file.toLowerCase()))
         continue;
      let lio = file.lastIndexOf("\\");
      const folder = file.substring(0, lio);
      if (lio > 0 && !KNOWN_FOLDERS.has(folder)) {
         const ABSOLUTE_FOLDER = join(ARCHIVE_FOLDER, folder);
         INFO(`\x1b[36m${folder}\n`);
         const EXISTS = existsSync(ABSOLUTE_FOLDER);
         if (!EXISTS && !await mkdir(join(ARCHIVE_FOLDER, folder), { recursive: true }).then(_ => true, _ => false))
            return void ERROR(`FAILED TO CREATE FOLDER IN ARCHIVE PATHS, MAYBE ITS TOO LONG? ${ARCHIVE_FOLDER.length + folder.length + 1}, ${folder}\n`);
         KNOWN_FOLDERS.add(folder);
      }
      await channel.push((async () => {
         //LOG(`${file}\n`);
         let succeed = await copyFile(join(path, file), join(ARCHIVE_FOLDER, file)).then(_ => true, _ => false);
         if (!succeed)
            failedFiles.push(file);
         else
            KNOWN_FILES.add(file.toLowerCase());
      })());
   }

   await channel.getAwaiter();

   if (failedFiles.length) {
      return void ERROR(`Something went wrong when coping these specific files: \n${failedFiles.join("\n")}\n`)
   }

   if (isForced) WARN(`FILES TO REMOVE: ${OLD_FILES.difference(KNOWN_FILES).size}\n`);
   for (const file of OLD_FILES.difference(KNOWN_FILES)) {
      WARN(`Removing ${ACCENT(file)}\n`);
      await channel.push(rm(join(ARCHIVE_FOLDER, file)));
   }
   await channel.getAwaiter();
   INFO(`TOTAL FILES ARCHIVED: ${ACCENT(String(files))}\n`);

   const tags = [_.getValue(TAG).toLowerCase()];
   if (tags[0] !== TAG.defaultValue) tags.push(TAG.defaultValue?.toLowerCase() ?? "current");
   for (let tag of tags) {
      tag = join(TAGS_FOLDER_PATH, tag);
      LOG(`REMOVING OLD TAG: ${tag}\n`);
      await rmdir(tag).catch(_ => null);
      LOG(`CREATING NEW TAG: ${_.getValue(TAG).toLowerCase()}\n`);
      await symlink(ARCHIVE_FOLDER, tag, "junction").catch(_ => null);
   }

   INFO(`OUTPUT: ${ACCENT(pathToFileURL(join(TAGS_FOLDER_PATH, tags[0]!)).href)}\n`);
};


function realVersion(version: string): string {
   const [MA = 1, MI = 0, B = 0, P = 0] = version.split(".").map(Number);
   return [MA, MI, Math.floor(B / 100), P + B % 100].join(".");
}
function toURL(path: string): string {
   return `file:///${encodeURI(path.replaceAll("\\", "/"))}`;
}


async function getPackageApplicationId(installationPath: string): Promise<string | null> {
   LOG(`Trying to read file: ${"/AppxManifest.xml"}\n`);
   return await readFile(join(installationPath, 'AppxManifest.xml'))
      .then(
         (_) => {
            LOG(`Trying to search for application id\n`);
            const id = _.toString().match(/<Application(?:\s+[^>]*)??\s+Id\s*=\s*["']([^"']+)["']/is)?.[1];
            if (!id) {
               LOG(`FAILED TO SEARCH APPLICATION ID`);
               return null;
            }
            return id;
         }
      )
      .catch((_) => (LOG(`FAILED TO READ FILE OR FAILED TO SEARCH FOR APPLICATION ID`), null));
}