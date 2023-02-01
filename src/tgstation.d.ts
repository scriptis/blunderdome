/**!
 * Bindings to tgstation's Auxlua.
 *
 * See https://github.com/tgstation/tgstation.
 */

declare type DMDatum = {
  get_var(name: string): unknown;
  set_var<T>(name: string, value: T): unknown;
  call_proc(procName: string, ...args: unknown[]): unknown;
  is_null(): boolean;
  vars: Record<string, unknown>;
};

declare type DMList = {
  len: number;
  get(index: number): unknown;
  set<T>(index: number, value: T): void;
  add<T>(value: T): void;
  remove<T>(value: T): void;
  to_table(): unknown[];
  of_type(typePath: string): unknown[];
  entries: Record<string | number, unknown>;
};

declare type DMTable = {
  state_id: string;
  global_proc(this: void, procName: string, ...args: unknown[]): unknown;
  world: DMDatum;
  global_vars: DMDatum;
  usr: DMDatum;
};

declare const dm: DMTable;

declare type SS13Table = {
  state: DMDatum;
  global_proc(this: void, procName: string, ...args: unknown[]): unknown;
  istype(this: void, thing: DMDatum, path: string): boolean;
  "new"(this: void, path: string, ...args: unknown[]): DMDatum;
  await(this: void, ...args: unknown[]): unknown;
  wait(this: void, time: number, timer: unknown): void;
  register_signal(
    this: void,
    datum: DMDatum,
    signal: string,
    func: (source: DMDatum, ...args: unknown[]) => void,
    makeEasyClearFunction?: boolean
  ): DMDatum;
  unregister_signal(
    this: void,
    datum: DMDatum,
    signal: string,
    callback?: DMDatum
  ): void;
  set_timeout(this: void, timeout: number, callback: () => void): void;
};

declare function sleep(this: void, time?: number): void;
