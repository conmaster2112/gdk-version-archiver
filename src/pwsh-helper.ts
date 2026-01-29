import {lstat, realpath} from 'node:fs/promises';
import {LOG} from './logger';

export interface PackageInformation {
   PackageFamilyName: string;
   Version: string;
   InstallationPath: string;
}
export class PowershellHelper {
   public static readonly POWERSHELL_EXECUTABLE = 'powershell';
   public static async GetAppxPackage(
      packageNameLike: string
   ): Promise<PackageInformation[] | null> {
      LOG(`Requesting Packages\n`);
      let {output, exitCode} = await PowershellHelper.runRawCommand(
         `((Get-AppxPackage -Name ${packageNameLike}) | ForEach-Object { "$($_.PackageFamilyName);$($_.Version);$($_.InstallLocation)" })`
      );

      if (exitCode != 0) return null;

      LOG(`Parsing and Resoling Installation Paths\n`);
      return (
         output
            ?.trim()
            .split('\n')
            .map((e) => {
               const [PackageFamilyName, Version, InstallationPath] = e.trim().split(';') as [
                  string,
                  string,
                  string
               ];
               return {PackageFamilyName, Version, InstallationPath};
            })
            .filter((e) => e?.PackageFamilyName) ?? null
      );
   }
   public static async runRawCommand(
      command: string
   ): Promise<{output: string | null; exitCode: number}> {
      LOG(`Spawning PWSH command\n`);
      // 4. Execute using Bun.spawn
      const process = Bun.spawn({
         cmd: [this.POWERSHELL_EXECUTABLE, '-NoProfile', '-NonInteractive', '-Command', command],
         stdout: 'pipe',
         stderr: 'pipe',
         stdin: 'ignore'
      });
      LOG(`Waiting for exit\n`);
      // Wait for the process to complete and capture output
      const stdout = await new Response(process.stdout).text();
      const stderr = await new Response(process.stderr).text();

      // Equivalent to C# WaitForExit
      const code = await process.exited;
      LOG(`PWSH Process exited with code: ${code}\n`);
      return {exitCode: code, output: code === 0 ? stdout : stderr.length > 0 ? stderr : null};
   }
   public static async InvokeCommandInDesktopPackage(
      packageFamilyName: string,
      appId: string,
      executable: string,
      args: string[]
   ): Promise<void> {
      let cmd = `Invoke-CommandInDesktopPackage -PackageFamilyName ${packageFamilyName} -AppId ${appId} -Command ${JSON.stringify(executable)}`;
      if (args.length > 0) cmd += ` -Args '${args.map((_) => `"${_}"`).join(' ')}'`;

      await this.runRawCommand(cmd);
   }
}
