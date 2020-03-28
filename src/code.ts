import _ from 'lodash';
import { tokenize, Token } from 'esprima';
import { errorLog } from './console';
import { writeDebugFile } from './debug';

export function processCode(
  code: string,
  file: string,
  level: number,
  occ: number,
  debug: boolean
): string[] {
  writeDebugFile(
    `${file.replace('/', '-')}-${level}-${occ}-0-code.js`,
    () => code,
    debug
  );
  let tokens: Token[];
  try {
    tokens = tokenize(code);
  } catch (error) {
    errorLog(
      'Parsing error:',
      `${file} (${level} ${occ})`, error.message, ' - any css classes used here might be purged'
    );
    return [];
  }
  writeDebugFile(
    `${file.replace('/', '-')}-${level}-${occ}.1.tokens.json`,
    () => JSON.stringify(tokens, null, 4),
    debug
  );

  const strings = _.keys(_.pickBy(tokens, { type: 'String' })).map(i =>
    Number(i)
  );

  const stringTokens: string[] = [];
  const allSubStringTokens: string[] = [];
  strings.forEach((i, occurance) => {
    const thirdOfMore = i >= 3;
    let isEval = false;
    if (thirdOfMore) {
      const beforeIsParen =
        tokens[i - 1].type === 'Punctuator' && tokens[i - 1].value === '(';
      const beforeBeforeIsEval =
        tokens[i - 2].type === 'Identifier' && tokens[i - 2].value === 'eval';
      const afterIsClosingParen =
        tokens[i + 1].type === 'Punctuator' && tokens[i + 1].value === ')';
      isEval = beforeIsParen && beforeBeforeIsEval && afterIsClosingParen;
    }
    if (isEval) {
      const subStringTokens = processCode(
        eval(tokens[i].value), // tslint:disable-line:no-eval
        file,
        level + 1,
        occurance,
        debug
      );
      allSubStringTokens.push(...subStringTokens);
    } else {
      stringTokens.push(
        eval(tokens[i].value) // tslint:disable-line:no-eval
      );
    }
  });
  writeDebugFile(
    `${file.replace('/', '-')}-${level}-${occ}.2.strings.json`,
    () => JSON.stringify(stringTokens),
    debug
  );

  const allStringTokens = [...allSubStringTokens, ...stringTokens];
  return allStringTokens;
}

