import path from 'path';
import { PurgeAsset } from './types';

/**
 * Get the filename without ?hash
 * @param fileName file name
 */
export function getFormattedFilename(fileName: string): string {
  if (fileName.includes('?')) {
    return fileName
      .split('?')
      .slice(0, -1)
      .join('');
  }
  return fileName;
}

/**
 * Returns true if the filename is of types of one of the specified extensions
 * @param filename file name
 * @param extensions extensions
 */
export function isFileOfTypes(filename: string, extensions: string[]) {
  const extension = path.extname(getFormattedFilename(filename));
  return extensions.includes(extension);
}

interface Assets {
  [key: string]: {
    source: () => string;
  };
}
/**
 * Get the assets that are of one of the specified extensions
 * @param assets assets
 * @param extensions extensions
 */
export function getAssets(
  assets: Assets = {},
  extensions: string[]
): PurgeAsset[] {
  const purgeAssets: PurgeAsset[] = [];
  for (const [name, asset] of Object.entries(assets)) {
    if (isFileOfTypes(name, extensions)) {
      purgeAssets.push({
        asset,
        name
      });
    }
  }

  return purgeAssets;
}

// export function files(
//   chunk: any,
//   extensions: string[],
//   getter: Function = (a: any) => a.resource,
//   webpackVersion: number
// ) {
//   const mods = [];
//   for (const module of Array.from(chunk.modulesIterable || [])) {
//     const file = getter(module);
//     if (file && extensions.includes(path.extname(file))) mods.push(file);
//   }
//   return mods;
// }
