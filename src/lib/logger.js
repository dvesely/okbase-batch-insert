const MAX_LOGS = 20;

class Logger {
  _logs = [];
  _onChnageHooks = [];

  log(...args) {
    pushMax(this._logs, JSON.stringify(args), MAX_LOGS);

    for (const callback of this._onChnageHooks) {
      callback(this._logs.slice(0));
    }
  }

  onChange(callback) {
    this._onChnageHooks.push(callback);
  }
}

export const logger = new Logger();

function pushMax(arr, value, max) {
  if (arr.length >= max) {
    arr.splice(0, arr.length - max + 1);
  }

  arr.push(value);
  return arr;
}
