// Type declarations for Node.js 22+ built-in sqlite module
// Remove when @types/node >= 22 is available
declare module "node:sqlite" {
  class DatabaseSync {
    constructor(path: string, options?: { open?: boolean; readonly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }

  class StatementSync {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown | undefined;
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  }

  export { DatabaseSync, StatementSync };
}
