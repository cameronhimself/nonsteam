export const ENV_OPTION_INPUT_KEY = "NONSTEAM_OPTION_INPUT";
export const ENV_OPTION_OVERWRITE_KEY = "NONSTEAM_OPTION_OVERWRITE";

export const TRUE_STRINGS: Array<string> = ["true", "yes", "1"];
export const FALSE_STRINGS: Array<string> = ["false", "no", "0"];
export const TRUE_RE: RegExp = new RegExp(`^(?:${TRUE_STRINGS.join("|")})$`)
export const FALSE_RE: RegExp = new RegExp(`^(?:${FALSE_STRINGS.join("|")})$`)
