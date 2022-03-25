const assert = require("assert");
const { getNumber } = require("../lib/helpers");

process.env.NODE_ENV = 'testing';




const _app = {
  tests: {
    unit: {},
    api: require("./api.js"),
  },

  countTests: () => {
    let counter = 0;
    for(const key in _app.tests) {
      if(_app.tests.hasOwnProperty(key)) {
        const subTests = _app.tests[key];
        for(const testName in subTests) {
          if(subTests.hasOwnProperty(testName)) {
            counter++;
          }
        }
      }
    }

    return counter;
  },

  runTests: () => {
    const errors = [];
    let successes = 0;
    const limit = _app.countTests();
    let counter = 0;
    for(const key in _app.tests) {
      if(_app.tests.hasOwnProperty(key)) {
        const subTests = _app.tests[key];
        for(const testName in subTests) {
          if(subTests.hasOwnProperty(testName)) {
            (() => {
              const tmpTestName = testName;
              const testValue = subTests[testName];

              try {
                testValue(() => {
                  console.log("\x1b[32m%s\x1b[0m", tmpTestName);
                  counter++
                  successes++
                  
                  if(counter === limit) {
                    _app.produceTestReport(limit, successes, errors);
                  }
                });
              } catch (error) {
                console.log("\x1b[32m%s\x1b[0m", tmpTestName);
                errors.push({
                  name: testName,
                  error,
                });
                console.log("\x1b[31m%s\x1b[0m", testName);
                counter++;

                if(counter === limit) {
                  _app.produceTestReport(limit, successes, errors);
                }
              }
            })();
          }
        }
      }
    }

  },

  produceTestReport: (limit, successes, errors) => {
    console.log("");
    console.log("--------BEGIN TEST REPORT----------");
    console.log("");
    console.log(`Total Tests: ${limit}`);
    console.log(`Pass: ${successes}`);
    console.log(`Fail: ${errors.length}`);
    console.log("");
    
    
    if(errors.length > 0) {
      console.log("--------BEGIN ERRORS DETAIL----------");
      errors.forEach(testError => {
        console.log("\x1b[31m%s\x1b[0m", testError.name);
        console.log(testError.error);
        console.log("");
      });
      console.log("--------END ERRORS DETAIL----------");      
    }
    
    console.log("");
    console.log("--------END TEST REPORT----------");

    process.exit();
  }
};

_app.tests.unit['helpers.getNumber should return a number'] = (done) => {
  const val = getNumber();
  assert.equal(typeof val, "number");
  done();
};

_app.tests.unit['helpers.getNumber should return 1'] = (done) => {
  const val = getNumber();
  assert.equal(val, 1);
  done();
};

_app.tests.unit['helpers.getNumber should return 1'] = (done) => {
  const val = getNumber();
  assert.equal(val, 2);
  done();
};

_app.runTests();