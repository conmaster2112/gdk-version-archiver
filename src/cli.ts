export enum Command {
   Copy = 'Copy'
}
export interface CommandData {
   [Command.Copy]: {source: string; destination: string};
}
interface CommandContextInfo<T extends keyof CommandData> {
   command: T;
   data: CommandData[T];
}
export class CLI {
   public static readonly prefix = 'base64_';
   public static createCommand<T extends keyof CommandData>(
      command: T,
      data: CommandData[T]
   ): string {
      return this.prefix + btoa(JSON.stringify({command, data} satisfies CommandContextInfo<T>));
   }
   public static parseCommand<T extends keyof CommandData = keyof CommandData>(
      source: string
   ): CommandContextInfo<T> {
      if (!source.startsWith(this.prefix))
         throw new SyntaxError('Command always have to start with valid prefix.');

      return JSON.parse(atob(source.substring(this.prefix.length)));
   }
   public static isCLI(source: unknown): source is string {
      if (typeof source === 'string') return source.startsWith(this.prefix);

      return false;
   }
}
