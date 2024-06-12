//---------------------------------------------------------------------------------------
// Log - a library to support loggging with log levels and custom loggers
// Copyright ⓒ 2024 Drew Harding
// All rights reserved.
//
// Script ID: 13RAf81luI1DJwKXIeWvK2daYsTN2Rnl2IE1oY_j156tEnNaVaXdRlg9O
// GitHub Repo: https://github.com/oneofadrew/Log
//---------------------------------------------------------------------------------------

const LEVELS = ["TRACE","DEBUG","INFO","WARN","ERROR"];
const TRACE = LEVELS.indexOf("TRACE");
const DEBUG = LEVELS.indexOf("DEBUG");
const INFO = LEVELS.indexOf("INFO");
const WARN = LEVELS.indexOf("WARN");
const ERROR = LEVELS.indexOf("ERROR");
const LEVEL_STRINGS = LEVELS.map(level => `[${level}]`.padEnd(7));

let loggers = [];
let config;

class Log {
  constructor(namespace){
    this.NAMESPACE = namespace.toLowerCase();
    this.LOGGER = Logger;
    this.LEVEL = INFO;
    if (config) configure_(this);
  }

  trace(msg, ...substitutes) {if (this.LEVEL <= TRACE) this.log_(TRACE, msg, substitutes);}
  debug(msg, ...substitutes) {if (this.LEVEL <= DEBUG) this.log_(DEBUG, msg, substitutes);}
  info(msg, ...substitutes) {if (this.LEVEL <= INFO) this.log_(INFO, msg, substitutes);}
  warn(msg, ...substitutes) {if (this.LEVEL <= WARN) this.log_(WARN, msg, substitutes);}
  error(msg, ...substitutes) {if (this.LEVEL <= ERROR) this.log_(ERROR, msg, substitutes);}

  log_(level, msg, substitutes) {
    let d = new Date();
    let dString = [{year: 'numeric'}, {month: '2-digit'}, {day: '2-digit'}].map(option => new Intl.DateTimeFormat('en', option).format(d)).join("-");
    let tString = new Intl.DateTimeFormat('en', {hour: "numeric", minute: "numeric", second: "numeric", hour12: false}).format(d);
    let mString = d.getMilliseconds().toString().padStart(3, '0');
    let message = `${dString} ${tString}.${mString} ${LEVEL_STRINGS[level]} [${this.NAMESPACE}]::${msg}`;
    this.LOGGER.log(message, ...substitutes);
  }
}

function findNsConfig_(ns) {
  if (!config) return;
  let c = config[ns];
  while (!c && ns !== "Default") {
    let i = ns.lastIndexOf(".");
    ns = i === -1 ? "Default" : ns.slice(0, i);
    c = config[ns];
  };
  return c;
}

function getLevel_(level) {
  const l = LEVELS.indexOf(level);
  if (l!==-1) return l;
  showUsage();
  throw new Error(`Log level '${level}' is not valid.`);
}

function getLoggerType_(logger) {
  switch (logger) {
    case Logger:
      return "Google";
    case console:
      return "console";
    default:
      return logger.type ? logger.type : "custom";
  }
}

function traverseConfig_(nsPart, ns, pos, c) {
  if (config[nsPart]) {
    if (config[nsPart]["level"]) c["level"] = config[nsPart]["level"];
    if (config[nsPart]["logger"]) c["logger"] = config[nsPart]["logger"];
  }
  if (pos < 0) return c;
  const nextPos = ns.indexOf(".", pos+1);
  const nextNsPart = nextPos < 0 ? ns : ns.substring(0, nextPos);
  return traverseConfig_(nextNsPart, ns, nextPos, c);
}

function configure_(log) {
  let ns = log.NAMESPACE;
  const c = traverseConfig_("default", ns, 0, {});
  if (c["level"]) log.LEVEL = getLevel_(c["level"]);
  if (c["logger"]) log.LOGGER = c["logger"];
}

function lowerise_(oldObj, newObj={}) {
  const keys = Object.keys(oldObj);
  for (key of keys) {
    if (key.toLowerCase() === "logger") newObj["logger"] = oldObj[key]; //don't mess with logger objects
    else if (typeof oldObj[key] === "object") newObj[key.toLowerCase()] = lowerise_(oldObj[key], {});
    else newObj[key.toLowerCase()] = oldObj[key];
  }
  return newObj;
}

/**
 * Create a new Log object for the provided namespace
 * @param {string} namespace - the namespace for the logger being created. This will be printed in each log message for traceability
 * @return {Log} A new Log object with the namespace and optional level provided.
 */
function newLog(namespace="") {
  const newLogger = new Log(namespace);
  loggers[loggers.length] = newLogger;
  return newLogger;
}

/**
 * Create a new Log object for the provided namespace
 * @param {object} c - the configuration to use for loggers
 */
function setConfig(c={}) {
  config = lowerise_(c);
  loggers.forEach(log => configure_(log));
}

function dumpConfig(logger=Logger) {
  logger.log(`The logger configuration is ${JSON.stringify(config)}`);
  for (log of loggers) {
    const loggerType = getLoggerType_(log.LOGGER);
    //Print settings used for this logger
    logger.log(`Logger with namespace '${log.NAMESPACE}' is a ${loggerType} logger with level '${LEVELS[log.LEVEL]}'`);
  }
}

/**
 * Prints the usage information to the console.
 */
function showUsage() {
  Logger.log("Loggers can be configured through a simple object that provides logging definition against a namespace or");
  Logger.log("part of a namespace. For example, if a logger has the namespace `my.namespace.value', configuration can be");
  Logger.log("provided against any of:");
  Logger.log(" * my.namespace.value");
  Logger.log(" * my.namespace");
  Logger.log(" * my");
  Logger.log("");
  Logger.log("Namespaces are always lowercase and will be forced to lowercase if they aren't already. The logger will pick");
  Logger.log("up the configuration settings that are most qualified by the namespace. A default configuration for all loggers");
  Logger.log("can be provided against the 'default' namespace. If a valid configuration can't be found following these rules");
  Logger.log("then the INFO and Google Logger will be used. Configuration is a simple object that looks like the following:");
  Logger.log("  {");
  Logger.log("    'default' : {'level' : 'INFO', 'logger': customLogger}");
  Logger.log("    'my' : {'level' : 'DEBUG', 'logger': console}");
  Logger.log("    'my.namespace' : {'level' : 'ERROR'}");
  Logger.log("  }");
  Logger.log("With the above configuration the following levels would be set:");
  Logger.log(" * 'some.other.namespace' logger would have 'INFO' level logging set and use the custom logger.");
  Logger.log(" * 'my.namespace' logger would have 'ERROR' level logging set and use a custom logger.");
  Logger.log(" * 'my.other.namespace' logger would have 'DEBUG' level logging set and use the console logger.");
  Logger.log(" * 'my.namespace.value' logger would have 'ERROR' level logging set and use the console logger.");
  Logger.log("");
  Logger.log("A custom logger is an object that defines a single function with the signature 'log(msg, ...args)'.");
  Logger.log("It can also optionally include a 'type' property that contains a string to describe the type of logger in the");
  Logger.log("`Log.dumpLogger()' function. For example:");
  Logger.log("  const doubleLogger = {");
  Logger.log("    'type' : 'Double',");
  Logger.log("    'log' : (msg, ...args) => {");
  Logger.log("       Logger.log(msg, ...args);");
  Logger.log("       Logger.log(msg, ...args);");
  Logger.log("     }");
  Logger.log("  }");
  Logger.log("");
  Logger.log(`Valid log levels are ${LEVELS}`);
}