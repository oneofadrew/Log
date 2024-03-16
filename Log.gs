const LEVELS = ["TRACE","DEBUG","INFO","WARN","ERROR"];
const TRACE = LEVELS.indexOf("TRACE");
const DEBUG = LEVELS.indexOf("DEBUG");
const INFO = LEVELS.indexOf("INFO");
const WARN = LEVELS.indexOf("WARN");
const ERROR = LEVELS.indexOf("ERROR");
const LEVELS_STRING = ["[TRACE]","[DEBUG]","[INFO] ","[WARN] ","[ERROR]"];

class Log {
  constructor(namespace="", level=2){
    this.NAMESPACE = namespace;
    this.LEVEL = level;
  }
  setLevel(level) {this.LEVEL = getLevel_(level);}
  configure(config) {
    let ns = this.NAMESPACE;
    let c = config[ns];
    while (!c && ns !== "Default") {
      let i = ns.lastIndexOf(".");
      ns = i === -1 ? "Default" : ns.slice(0, i);
      c = config[ns];
    }
    c = c ? c : {"level" : "DEBUG"};
    this.setLevel(c["level"]);
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
    let message = `${dString} ${tString}.${mString} - ${LEVELS[level]}::[${this.NAMESPACE}]::${msg}`;
    Logger.log(message, ...substitutes);
  }
}
function getLevel_(level) {
  const l = LEVELS.indexOf(level);
  if (l!==-1) return l;
  throw new Error(`Log level '${level}' is not recognised.`);
}
function newLog(namespace, level) {
  level = level ? getLevel_(level) : level;
  return new Log(namespace, level);
}