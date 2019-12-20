const SpecReporter = require('jasmine-spec-reporter').SpecReporter;

jasmine.getEnv().clearReporters();               
jasmine.getEnv().addReporter(new SpecReporter({ 
  suite: {
    displayNumber: true,   
  },
  spec: {
    displayPending: true,
    displayStacktrace: false,
    displayErrorMessages: true,
    displaySuccessful: true,
    displayFailed: true,
    displayDuration: true
  },
  summary: {
    displayErrorMessages: true,
    displayDuration: true,
    displayPending: true,
    displayFailed: false,
    displayStacktrace: true,
    displaySuccessful: false
  }
}));