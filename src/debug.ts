import * as fs from 'fs';
import path from 'path';

export const writeDebugFile = (
  file: string,
  content: () => string,
  debug: boolean
) => {
  if (debug) {
    const debugFile = `./.purgecss-laminar-debug/${file}`;
    const dir = path.dirname(debugFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    fs.writeFileSync(debugFile, content());
  }
};
