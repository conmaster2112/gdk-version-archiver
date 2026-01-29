import {existsSync} from 'node:fs';
import {CLI, Command} from './cli';
import {stat} from 'node:fs/promises';
import {dirname} from 'node:path';
import {mkdir} from 'node:fs/promises';
import {readFile, writeFile} from 'node:fs/promises';
import {main} from './archive';

if (Bun.argv[2] === 'archive') await main();

if (CLI.isCLI(Bun.argv[2])) {
   const {command, data} = CLI.parseCommand(Bun.argv[2]);
   switch (command) {
      case Command.Copy: {
         const info = await stat(data.source).catch((_) => null);
         if (!info || !info.isFile()) break;

         const destDir = dirname(data.destination);
         console.log(destDir);
         if (!existsSync(destDir)) await mkdir(destDir, {recursive: true});

         await writeFile(data.destination, await readFile(data.source));
         console.log('Written to ' + data.destination);
      }
   }
}
