export type StringMatcher = (token: string) => boolean;

export interface StringFilters {
  exclude?: (RegExp | StringMatcher)[];
  include?: (RegExp | StringMatcher)[];
  onlyAllLowerCase?: boolean;
  skipAllUpperCase?: boolean;
  minLength?: number;
  maxLength?: number;
}

export interface UserDefinedOptions {
  fontFace?: boolean;
  keyframes?: boolean;
  output?: string;
  rejected?: boolean;
  stdin?: boolean;
  stdout?: boolean;
  variables?: boolean;
  verbose?: boolean;
  whitelist?: string[];
  whitelistPatterns?: RegExp[];
  whitelistPatternsChildren?: RegExp[];
  stringFilters?: StringFilters;
  debug?: boolean;
}

export type PurgedStats = {
  [index: string]: string[];
};

export interface PurgeAsset {
  asset: {
    source: () => string;
  };
  name: string;
}
