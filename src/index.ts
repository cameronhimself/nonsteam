export * from "./classes";
export * from "./constants";
export * from "./utils";

import { NonSteam } from "./classes";

export const load = async (path?: string): Promise<NonSteam> =>
  NonSteam.load(path);
