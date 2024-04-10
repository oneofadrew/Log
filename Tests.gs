//---------------------------------------------------------------------------------------
// Unit tests for the Log library. These should be run along with every change to the
// library to verify nothing has broken.
//
// Before deployment this script should be deleted and the Test library removed from the
// dependency list. After deployment it should be reinstated in the app script project
// from version control.
//---------------------------------------------------------------------------------------

function runTests() {
  let suite = Test.newTestSuite("All Tests")
    .addSuite(getLogLevelSuite_())
    .addSuite(getConfigureSuite_())
  ;
  suite.run();
}

function getLogLevelSuite_() {
  let suite = Test.newTestSuite("Log Level")
    .addTest(testDefault_)
    .addTest(testGetLevel_)
    .addTest(testSetLevel_)
  ;
  return suite;
}

function testDefault_() {
  let MyLogger = newLog("Test");
  Test.isEqual(MyLogger.LEVEL, INFO);
}

function testGetLevel_() {
  Test.isEqual(getLevel_("TRACE"), TRACE);
  Test.isEqual(getLevel_("DEBUG"), DEBUG);
  Test.isEqual(getLevel_("INFO"), INFO);
  Test.isEqual(getLevel_("WARN"), WARN);
  Test.isEqual(getLevel_("ERROR"), ERROR);
}

function testSetLevel_() {
  let MyLogger = newLog("Test");
  MyLogger.setLevel("TRACE");
  Test.isEqual(MyLogger.LEVEL, TRACE);
  MyLogger.setLevel("DEBUG");
  Test.isEqual(MyLogger.LEVEL, DEBUG);
  MyLogger.setLevel("INFO");
  Test.isEqual(MyLogger.LEVEL, INFO);
  MyLogger.setLevel("WARN");
  Test.isEqual(MyLogger.LEVEL, WARN);
  MyLogger.setLevel("ERROR");
  Test.isEqual(MyLogger.LEVEL, ERROR);
}

function getConfigureSuite_() {
  let suite = Test.newTestSuite("Configure")
    .addTest(testConfigVanilla_)
    .addTest(testConfigNamespace_)
    .addTest(testConfigMultipleNamespaces_)
    .addTest(testConfigDefault_)
    .addTest(testConfigNothing_)
  ;
  return suite;
}

function testConfigVanilla_() {
  let MyLogger = newLog("My.New.Fancy.Log.Subclass");
  MyLogger.configure({
    "My.New.Fancy.Log.Subclass" : {"level" : "ERROR"}
  });
  Test.isEqual(MyLogger.LEVEL, 4);
}

function testConfigNamespace_() {
  let MyLogger = newLog("My.New.Fancy.Log.Subclass");
  MyLogger.configure({
    "My.New.Fancy" : {"level" : "WARN"},
    "My.New.Fancy.Log.Something.Else" : {"level" : "INFO"}
  });
  Test.isEqual(MyLogger.LEVEL, 3);
}

function testConfigMultipleNamespaces_() {
  let MyLogger = newLog("My.New.Fancy.Log.Subclass");
  MyLogger.configure({
    "My.New.Fancy.Log.Subclass" : {"level" : "ERROR"},
    "My.New.Fancy" : {"level" : "WARN"},
    "My.New.Fancy.Log.Something.Else" : {"level" : "INFO"}
  });
  Test.isEqual(MyLogger.LEVEL, 4);
}

function testConfigDefault_() {
  let MyLogger = newLog("My.New.Fancy.Log.Subclass");
  MyLogger.configure({
    "Default" : {"level" : "TRACE"},
    "My.New.Fancy.Nope" : {"level" : "ERROR"}
  });
  Test.isEqual(MyLogger.LEVEL, 0);
}

function testConfigNothing_() {
  let MyLogger = newLog("My.New.Fancy.Log.Subclass");
  Test.willFail(()=>{MyLogger.configure({
    "My.New.Fancy.Nope" : {"level" : "ERROR"}
  })}, "Couldn't find any configuration available for My.New.Fancy.Log.Subclass.");
}

/* -----------------------------------------------------------------------------------
  Performance tests
 ----------------------------------------------------------------------------------- */

function testPerformance() {
  const loop = 10000;
  const TestLogger = newLog("Test");

  uDate = new Date();
  for (let i=1;i<=loop;i++) {
    TestLogger.info("I have written with info %s times", i);
    TestLogger.trace("I have not written with trace %s times", i);
  }
  euDate = new Date();

  tDate = new Date();
  for (let i=1;i<=loop;i++) {
    TestLogger.info("I have written with info %s times", i);
  }
  etDate = new Date();

  let sDate = new Date();
  for (let i=1;i<=loop;i++) {
    Logger.log("2024-03-17 24:16:53.381 [INFO]  [Test]::I have written with string %s times", i);
  }
  esDate = new Date();

  let rDate = new Date();
  for (let i=1;i<=loop;i++) {
    TestLogger.trace("I have not written with trace %s times", i);
  }
  erDate = new Date();

  let sTime = (esDate.getTime() - sDate.getTime());
  Logger.log("String: %s times in %s ms", loop, sTime);

  let tTime = (etDate.getTime() - tDate.getTime());
  Logger.log("Info: %s times in %s ms", loop, tTime);

  let uTime = (euDate.getTime() - uDate.getTime());
  Logger.log("Info Not Trace: %s times in %s ms", loop, uTime);

  let rTime = (erDate.getTime() - rDate.getTime());
  Logger.log("Not Trace: %s times in %s ms", loop, rTime);

  Test.isLessThanOrEqualTo(rTime, 100, "Not Trace");
  Test.isLessThan(tTime, (sTime*2.2), "Info");
  Test.isLessThan(uTime, (sTime*2.2), "Info Not Trace");
}