export * from "./classes";
export * from "./constants";
export * from "./utils";
export * from "./types";

import { NonSteam } from "./classes";

export const load = async (path?: string): Promise<NonSteam> =>
  NonSteam.load(path);
export { NonSteam };
