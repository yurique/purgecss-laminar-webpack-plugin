import { green, yellow, red } from 'chalk';
import { pluginName } from './common';

export function log(message?: any, ...optionalParams: any[]): void {
  // tslint:disable-next-line:no-console
  console.log(
    yellow(`[${pluginName}]`),
    message,
    ...optionalParams
  );
}

export function infoLog(message?: any, ...optionalParams: any[]): void {
  // tslint:disable-next-line:no-console
  console.log(
    yellow(`[${pluginName}]`),
    green(`${message}`),
    ...optionalParams
  );
}

export function errorLog(message?: any, ...optionalParams: any[]): void {
  // tslint:disable-next-line:no-console
  console.log(
    yellow(`[${pluginName}]`),
    red(`${message}`),
    ...optionalParams
  );
}
