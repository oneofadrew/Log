//---------------------------------------------------------------------------------------
// Copyright ⓒ 2024 Drew Harding
// All rights reserved.
//---------------------------------------------------------------------------------------
// Log - a library to support loggging with log levels and custom loggers
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
 * Create a new log object for the provided namespace. The log object will send messages to the configured logger if the configured
 * level of the log object's namespace is equal to or higher than the level of the log function called. For example if MyLog's
 * namespace is configured to a level of INFO:
 *  - MyLog.trace("My message with args %s and %s", arg1, arg2); //would not log the message
 *  - MyLog.debug("My message with args %s and %s", arg1, arg2); //would not log the message
 *  - MyLog.info("My message with args %s and %s", arg1, arg2);  //would log the message
 *  - MyLog.warn("My message with args %s and %s", arg1, arg2);  //would log the message
 *  - MyLog.error("My message with args %s and %s", arg1, arg2); //would log the message
 * The log object has been created to be very efficient if messages should not be logged based on the log level configured for the
 * namespace. Calls to functions that will not log based on the configured level can be considered to take zero milliseconds in execution.
 * @param {string} namespace - the namespace for the log object being created. This will be printed in each log message for traceability
 * @return {Log} A new log object with the namespace provided.
 */
function newLog(namespace="") {
  const newLogger = new Log(namespace);
  loggers[loggers.length] = newLogger;
  return newLogger;
}

/**
 * A convenience function to create a new custom logger for logging messages. It can be used via configuration to send log messages to
 * alternate end points. The returned logger object has the structure:
 * {
 *   "type" : "name of logger type",
 *   "log" : (message, ...args) => {
 *             // custom logging logic
 *           }
 * }
 * @param {function} logFunction - a function wth the signature log(message, ...args) used to log messages from the Log object
 * @param {string} type - [optional] a human readable description of the logger being created. If not provided "custom" will be used
 * @return {object} A new logger object with the provided type and log function
 */
function newLoggerType(logFunction, type) {
  if (!logFunction) throw new Error("the log(message, ...args) function needs to be provided");
  const newLoggerType = {
    "log" : logFunction
  };
  if (type) newLoggerType["type"] = type;
  return newLoggerType;
}

/**
 * Sets the configuration to use for log objects. The configuration will be appled to existing log ojects as well as any log objects
 * created after the configuration has been provided. To see the configuration currently in use and the way it has been applied to
 * the existing log objects, the Log.dumpConfig() library function can be used. A configuration object has the structure:
 * {
 *    "my.log.namespace" : {
 *      "level" : "TRACE|DEBUG|INFO|WARN|ERROR",
 *      "logger" : Logger
 *    }
 * }
 * Namespaces are case-insensitive, and can be partially qualified. Namespaces that are more qualified for a specific namespace will
 * override any provided settings from less qualified namespace settings. A namespace of "default" can be provided that will match every
 * namespace at the lowest possible level. A logger must be an object that conforms to the logger structure. It can be created with the
 * helper Log.newLoggerType(logFunction, type) libary function. When applying a configuration against log objects, if no matching level
 * can be found INFO will be used. If no matching logger can be found the Google Logger object will be used. The Log.showUsage() library
 * function will provide more details on usage and configuration options with worked examples.
 * @param {object} c - the configuration to use for log objects based on namespace
 */
function setConfig(c={}) {
  config = lowerise_(c);
  loggers.forEach(log => configure_(log));
}

/**
 * Dumps the current settings in use by the log objects within the Log library to the logger provided. If no logger is provided the
 * Google Logger will be used.
 * @param {object} logger - [optional] a logger object to dump the config to.
 */
function dumpConfig(logger=Logger) {
  logger.log(`The logger configuration is ${JSON.stringify(config)}`);
  for (log of loggers) {
    const loggerType = getLoggerType_(log.LOGGER);
    //Print settings used for this logger
    logger.log(`Logger with namespace '${log.NAMESPACE}' is a ${loggerType} logger with level '${LEVELS[log.LEVEL]}'`);
  }
}

/**
 * Prints a usage guide for how to use and configure the Log library using the logger provided. If no logger is provided the Google
 * Logger will be used.
 * @param {object} logger - [optional] a logger object to print the usage guide to
 */
function showUsage(logger=Logger) {
  logger.log("Log objects can be used for logging for the provided namespace. The Log object will send messages to the configured ");
  logger.log("logger type if the configured level of the Log object's namespace is equal to or higher than the log level of the");
  logger.log("function called. For example if MyLog's namespace is configured to a level of INFO:");
  logger.log(" * MyLog.trace('My message with args %s and %s', arg1, arg2); //would not log the message");
  logger.log(" * MyLog.debug('My message with args %s and %s', arg1, arg2); //would not log the message");
  logger.log(" * MyLog.info('My message with args %s and %s', arg1, arg2);  //would log the message");
  logger.log(" * MyLog.warn('My message with args %s and %s', arg1, arg2);  //would log the message");
  logger.log(" * MyLog.error('My message with args %s and %s', arg1, arg2); //would log the message");
  logger.log("");
  logger.log("Log objects have been created to be very efficient if log messages should not be logged based on the log level");
  logger.log("configured for the namespace. Calls to functions that will not log based on the configured level can be considered");
  logger.log("to take zero milliseconds in execution.");
  logger.log("");
  logger.log("Log objects can be configured through a simple configuration that provides logging definition against a namespace or");
  logger.log("a partial namespace. For example, if a log object has the namespace `my.namespace.value', configuration can be provided");
  logger.log(" against any of:");
  logger.log(" * my.namespace.value");
  logger.log(" * my.namespace");
  logger.log(" * my");
  logger.log("");
  logger.log("Namespaces will be forced to lowercase if they aren't already. The log object will pick up the configuration settings");
  logger.log("that are most qualified by the namespace. A default configuration for all namespaces can be provided against the");
  logger.log("'default' namespace. If a valid configuration can't be found following these rules then the INFO and Google Logger will");
  logger.log("be used. A configuration object has the following structure:");
  logger.log("  {");
  logger.log("    'default' : {'level' : 'INFO', 'logger': customLoggerType}");
  logger.log("    'my' : {'level' : 'DEBUG', 'logger': console}");
  logger.log("    'my.namespace' : {'level' : 'ERROR'}");
  logger.log("  }");
  logger.log("With the above configuration object the following settings would be used:");
  logger.log(" * 'some.other.namespace' logger would have 'INFO' level logging set and use a custom logger type.");
  logger.log(" * 'my.namespace' logger would have 'ERROR' level logging set and use a custom logger type.");
  logger.log(" * 'my.other.namespace' logger would have 'DEBUG' level logging set and use the console logger.");
  logger.log(" * 'my.namespace.value' logger would have 'ERROR' level logging set and use the console logger.");
  logger.log("");
  logger.log("A custom logger type is an object that defines a single function with the signature 'log(msg, ...args)', and can.");
  logger.log("It can also optionally include a 'type' property that contains a string to describe the type of logger for the");
  logger.log("'Log.dumpConfig()' function. It can be created with the h'Log.newLoggerType(logFunction, type)' library function.")
  logger.log("For example:");
  logger.log("  const doubleLogger = {");
  logger.log("    'type' : 'Double',");
  logger.log("    'log' : (msg, ...args) => {");
  logger.log("       Logger.log(msg, ...args);");
  logger.log("       Logger.log(msg, ...args);");
  logger.log("     }");
  logger.log("  }");
  logger.log("");
  logger.log(`Valid log levels are ${LEVELS}`);
}