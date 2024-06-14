//---------------------------------------------------------------------------------------
// Copyright ⓒ 2024 Drew Harding
// All rights reserved.
//---------------------------------------------------------------------------------------
// Unit tests for the Log library. These should be run along with every change to the
// library to verify nothing has broken.
//
// Before deployment this script should be deleted and the Test library removed from the
// dependency list. After deployment it should be reinstated in the app script project
// from version control.
//---------------------------------------------------------------------------------------

let messages = [];
const savingLogger_ = newLoggerType(
  (msg, ...args) => {
    messages[messages.length] = msg;
    Logger.log(msg, ...args);
  },
  "Saving"
);
const noTypeLogger_ = newLoggerType(
  (msg, ...args) => {
    Logger.log(msg, ...args);
  }
);

function setUp_() {
  messages = [];
  loggers = [];
  config = undefined;
}

function runTests() {
  let suite = Test.newTestSuite("All Tests")
    .addSuite(getHelperSuite_())
    .addSuite(getConfigureSuite_())
    .addSuite(getPerformanceSuite_())
  ;
  suite.run();
}

/* -----------------------------------------------------------------------------------
  Helper function tests
 ----------------------------------------------------------------------------------- */

function getHelperSuite_() {
  let suite = Test.newTestSuite("Helper")
    .addSetUp(setUp_)
    .addTest(testIsTraceEnabled_)
    .addTest(testIsDebugEnabled_)
    .addTest(testIsInfoEnabled_)
    .addTest(testIsWarnEnabled_)
    .addTest(testIsErrorEnabled_)
    .addTest(testDefault_)
    .addTest(testGetLevelHappyPath_)
    .addTest(testGetLevelUnhappyPath_)
    .addTest(testGetLoggerType_)
    .addTest(testLowerise_)
  ;
  return suite;
}

function testIsTraceEnabled_() {
  let MyLog = newLog("");
  MyLog.LEVEL = TRACE;
  Test.isTrue(MyLog.isTraceEnabled());
  Test.isTrue(MyLog.isDebugEnabled());
  Test.isTrue(MyLog.isInfoEnabled());
  Test.isTrue(MyLog.isWarnEnabled());
  Test.isTrue(MyLog.isErrorEnabled());
}

function testIsDebugEnabled_() {
  let MyLog = newLog("");
  MyLog.LEVEL = DEBUG;
  Test.isFalse(MyLog.isTraceEnabled());
  Test.isTrue(MyLog.isDebugEnabled());
  Test.isTrue(MyLog.isInfoEnabled());
  Test.isTrue(MyLog.isWarnEnabled());
  Test.isTrue(MyLog.isErrorEnabled());
}

function testIsInfoEnabled_() {
  let MyLog = newLog("");
  MyLog.LEVEL = INFO;
  Test.isFalse(MyLog.isTraceEnabled());
  Test.isFalse(MyLog.isDebugEnabled());
  Test.isTrue(MyLog.isInfoEnabled());
  Test.isTrue(MyLog.isWarnEnabled());
  Test.isTrue(MyLog.isErrorEnabled());
}

function testIsWarnEnabled_() {
  let MyLog = newLog("");
  MyLog.LEVEL = WARN;
  Test.isFalse(MyLog.isTraceEnabled());
  Test.isFalse(MyLog.isDebugEnabled());
  Test.isFalse(MyLog.isInfoEnabled());
  Test.isTrue(MyLog.isWarnEnabled());
  Test.isTrue(MyLog.isErrorEnabled());
}

function testIsErrorEnabled_() {
  let MyLog = newLog("");
  MyLog.LEVEL = ERROR;
  Test.isFalse(MyLog.isTraceEnabled());
  Test.isFalse(MyLog.isDebugEnabled());
  Test.isFalse(MyLog.isInfoEnabled());
  Test.isFalse(MyLog.isWarnEnabled());
  Test.isTrue(MyLog.isErrorEnabled());
}

function testDefault_() {
  let MyLogger = newLog("Test");
  Test.isEqual(MyLogger.LEVEL, INFO);
  Test.isEqual(MyLogger.LOGGER, Logger);
}

function testGetLevelHappyPath_() {
  Test.isEqual(getLevel_("TRACE"), TRACE);
  Test.isEqual(getLevel_("DEBUG"), DEBUG);
  Test.isEqual(getLevel_("INFO"), INFO);
  Test.isEqual(getLevel_("WARN"), WARN);
  Test.isEqual(getLevel_("ERROR"), ERROR);
}

function testGetLevelUnhappyPath_() {
  Test.willFail(() => {getLevel_("GARBAGE")}, "Log level 'GARBAGE' is not valid.");
}

function testGetLoggerType_() {
  Test.isEqual(getLoggerType_(Logger), "Google");
  Test.isEqual(getLoggerType_(console), "console");
  Test.isEqual(getLoggerType_(savingLogger_), "Saving");
  Test.isEqual(getLoggerType_(noTypeLogger_), "custom");
}

function testLowerise_() {
  const myConfig = {
    'my' : {'Level' : 'WARN', "Logger" : savingLogger_},
    'MY.NAMESPACE' : {'LEVel' : 'ERROR', "logGER" : console}
  };
  const newConfig = lowerise_(myConfig);
  Test.isEqual(newConfig["my"]["level"], "WARN");
  Test.isEqual(newConfig["my"]["logger"], savingLogger_);
  Test.isEqual(newConfig["my.namespace"]["level"], "ERROR");
  Test.isEqual(newConfig["my.namespace"]["logger"], console);
}

/* -----------------------------------------------------------------------------------
  Configuration tests
 ----------------------------------------------------------------------------------- */

function getConfigureSuite_() {
  let suite = Test.newTestSuite("Configure")
    .addSetUp(setUp_)
    .addTest(testDefault_)
    .addTest(testConfigNamespaceAfter_)
    .addTest(testConfigNamespaceBefore_)
    .addTest(testConfigDefault_)
    .addTest(testConfigCaseInsensitive_)
    .addTest(testConfigInherited_)
    .addTest(testConfigOverrideLevel_)
    .addTest(testConfigOverrideLogger_)
    .addTest(testConfigOverrideDefault_)
    .addTest(testConfigComplex_)
    .addTest(testDumpConfig_)
  ;
  return suite;
}

function testConfigNamespaceAfter_() {
  const MyLogger = newLog("my");

  setConfig({
    'my' : {'level' : 'ERROR', "logger" : savingLogger_}
  });

  Test.isEqual(MyLogger.LEVEL, ERROR);
  Test.isEqual(MyLogger.LOGGER, savingLogger_);
}

function testConfigNamespaceBefore_() {
  setConfig({
    'my' : {'level' : 'ERROR', "logger" : savingLogger_}
  });

  const MyLogger = newLog("my");

  Test.isEqual(MyLogger.LEVEL, ERROR);
  Test.isEqual(MyLogger.LOGGER, savingLogger_);
}

function testConfigDefault_() {
  const MyLogger = newLog("my");

  setConfig({
    'default' : {'level' : 'ERROR', "logger" : savingLogger_}
  });

  Test.isEqual(MyLogger.LEVEL, ERROR);
  Test.isEqual(MyLogger.LOGGER, savingLogger_);
}

function testConfigCaseInsensitive_() {
  const MyLogger = newLog("MY");
  const MyNamespaceLogger = newLog("my.namespace");

  setConfig({
    'my' : {'level' : 'WARN', "logger" : savingLogger_},
    'MY.NAMESPACE' : {'level' : 'ERROR', "logger" : console}
  });

  Test.isEqual(MyLogger.LEVEL, WARN);
  Test.isEqual(MyLogger.LOGGER, savingLogger_);
  Test.isEqual(MyNamespaceLogger.LEVEL, ERROR);
  Test.isEqual(MyNamespaceLogger.LOGGER, console);
}

function testConfigInherited_() {
  const MyNamespaceLogger = newLog("my.namespace");

  setConfig({
    'my' : {'level' : 'ERROR', "logger" : savingLogger_}
  });

  Test.isEqual(MyNamespaceLogger.LEVEL, ERROR);
  Test.isEqual(MyNamespaceLogger.LOGGER, savingLogger_);
}

function testConfigOverrideLevel_() {
  const MyNamespaceLogger = newLog("my.namespace");

  setConfig({
    'my' : {'level' : 'ERROR', "logger" : savingLogger_},
    'my.namespace' : {'level' : 'WARN'}
  });

  Test.isEqual(MyNamespaceLogger.LEVEL, WARN);
  Test.isEqual(MyNamespaceLogger.LOGGER, savingLogger_);
}

function testConfigOverrideLogger_() {
  const MyNamespaceLogger = newLog("my.namespace");

  setConfig({
    'my' : {'level' : 'ERROR', "logger" : savingLogger_},
    'my.namespace' : {"logger" : console}
  });

  Test.isEqual(MyNamespaceLogger.LEVEL, ERROR);
  Test.isEqual(MyNamespaceLogger.LOGGER, console);
}

function testConfigOverrideDefault_() {
  const MyNamespaceLogger = newLog("my.namespace");

  setConfig({
    'default' : {'level' : 'ERROR', "logger" : savingLogger_},
    'my.namespace' : {"logger" : console}
  });

  Test.isEqual(MyNamespaceLogger.LEVEL, ERROR);
  Test.isEqual(MyNamespaceLogger.LOGGER, console);
}

function testConfigOverrideDeep_() {
  const MyNamespaceDeepLogger = newLog("my.namespace.deep");

  setConfig({
    'my' : {'level' : 'ERROR', "logger" : savingLogger_},
    'my.namespace' : {"logger" : console}
  });

  Test.isEqual(MyNamespaceDeepLogger.LEVEL, ERROR);
  Test.isEqual(MyNamespaceDeepLogger.LOGGER, console);
}

function testConfigComplex_() {
  const SomeOtherNamespaceLogger = newLog("some.other.namespace");
  const MyOtherNamespaceLogger = newLog("my.other.namespace");
  const MyNamespaceLogger = newLog("my.namespace");
  const MyNamespaceValueLogger = newLog("my.namespace.value");

  setConfig({
      'default' : {'level' : 'WARN', 'logger': savingLogger_},
      'my' : {'level' : 'DEBUG', 'logger': console},
      'my.namespace' : {'level' : 'ERROR', "logger" : Logger},
      'my.namespace.value' : {"logger" : savingLogger_}
    }
  );

  Test.isEqual(SomeOtherNamespaceLogger.LEVEL, WARN);
  Test.isEqual(SomeOtherNamespaceLogger.LOGGER, savingLogger_);
  Test.isEqual(MyNamespaceLogger.LEVEL, ERROR);
  Test.isEqual(MyNamespaceLogger.LOGGER, Logger);
  Test.isEqual(MyOtherNamespaceLogger.LEVEL, DEBUG);
  Test.isEqual(MyOtherNamespaceLogger.LOGGER, console);
  Test.isEqual(MyNamespaceValueLogger.LEVEL, ERROR);
  Test.isEqual(MyNamespaceValueLogger.LOGGER, savingLogger_);
}

function testDumpConfig_() {
  messages = [];
  loggers = [];

  const SomeOtherNamespaceLogger = newLog("some.other.namespace");
  const MyLogger = newLog("my");
  const MyOtherNamespaceLogger = newLog("my.other.namespace");
  const MyNamespaceLogger = newLog("my.namespace");
  const MyNamespaceValueLogger = newLog("my.namespace.value");

  setConfig({
      'default' : {'level' : 'TRACE', 'logger' : savingLogger_},
      'my' : {'level' : 'DEBUG'},
      'my.namespace' : {'level' : 'INFO'},
      'my.namespace.value' : {'level' : 'WARN'}
    }
  );
  
  Test.isEqual(messages.length, 0, "Should be no messages during initialisation");
  dumpConfig(savingLogger_);

  Test.isEqual(messages.length, 6);
  Test.isEqual(messages[0], 'The logger configuration is {"default":{"level":"TRACE","logger":{"type":"Saving"}},"my":{"level":"DEBUG"},"my.namespace":{"level":"INFO"},"my.namespace.value":{"level":"WARN"}}');
  Test.isEqual(messages[1], "Logger with namespace 'some.other.namespace' is a Saving logger with level 'TRACE'");
  Test.isEqual(messages[2], "Logger with namespace 'my' is a Saving logger with level 'DEBUG'");
  Test.isEqual(messages[3], "Logger with namespace 'my.other.namespace' is a Saving logger with level 'DEBUG'");
  Test.isEqual(messages[4], "Logger with namespace 'my.namespace' is a Saving logger with level 'INFO'");
  Test.isEqual(messages[5], "Logger with namespace 'my.namespace.value' is a Saving logger with level 'WARN'");

  messages = [];
  loggers = [];
  dumpConfig(Logger);
  Test.isEqual(messages.length, 0, "Should log to logger provided");
}

/* -----------------------------------------------------------------------------------
  Performance tests
 ----------------------------------------------------------------------------------- */

function getPerformanceSuite_() {
  let suite = Test.newTestSuite("Performance")
    .addSetUp(setUp_)
    .addTest(testPerformance_)
  ;
  return suite;
}

function testPerformance_() {
  const loop = 10000;
  const TestLogger = newLog("test");

  // s = string (no Log library)
  let sDate = new Date();
  for (let i=1;i<=loop;i++) {
    Logger.log("2024-03-17 24:16:53.381 [INFO]  [Test]::I have written with string %s times", i);
  }
  esDate = new Date();

  // i = info only (statements logged)
  iDate = new Date();
  for (let i=1;i<=loop;i++) {
    TestLogger.info("I have written with info   %s times", i);
  }
  eiDate = new Date();

  // t = trace only (statements not logged)
  let tDate = new Date();
  for (let i=1;i<=loop;i++) {
    TestLogger.trace("I have not written with trace %s times", i);
  }
  etDate = new Date();

  let sTime = (esDate.getTime() - sDate.getTime());
  Logger.log("String (no library): %s times in %s ms", loop, sTime);

  let iTime = (eiDate.getTime() - iDate.getTime());
  Logger.log("Info (logged): %s times in %s ms (%s)", loop, iTime, iTime/sTime);

  let tTime = (etDate.getTime() - tDate.getTime());
  Logger.log("Trace (not logged): %s times in %s ms", loop, tTime);

  Test.isLessThanOrEqualTo(tTime, 10, "Trace (not logged) is too slow"); //should be almost zero overhead 
  Test.isLessThan(iTime/sTime, 2.3, "Info (logged) is too slow"); //allowed to be twice as slow as a standard Logger message
}