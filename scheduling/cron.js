var scheduler = require("node-schedule");

var fetchScheduler = new (require("../scheduling/fetchscheduler.js"))();
var librisCommunicator = new (require("../communication/libriscommunicator.js"))();
var dataConverter = new (require("../data/dataconverter.js"))();
var folioCommunicator = new (require("../communication/foliocommunicator.js"))();

var librisFolioDataMover = new (require("../librisfoliodatamover.js"))(
  fetchScheduler,
  librisCommunicator,
  dataConverter,
  folioCommunicator
);

var dailySchedule;

module.exports = {
  initialize: function(enabled) {
    if (enabled) {
      console.log("Cron jobs enabled");
      // Setup scheduler that runs every minute. Disabled for now.
      // minuteSchedule = scheduler.scheduleJob("* * * * *", () => {
      //   try {
      //     console.log("Starting five minute run.");
      //     librisFolioDataMover.moveData(null, null, null);
      //     // console.log("minuteSchedule run.");
      //     console.log("move done.");
      //   } catch (err) {
      //     console.log("Something went wrong with scheduled minute run.");
      //     console.log(err.message);
      //   }
      // });

      // Setup scheduler that runs daily at 5:15
      dailySchedule = scheduler.scheduleJob("15 03 * * *", () => {
        try {
          console.log("dauilySchedule run.");
          librisFolioDataMover.moveData(null, null, null);
        } catch (err) {
          console.log("Something went wrong with scheduled daily run.");
          console.log(err.message);
        }
      });
    } else {
      console.log("Cron jobs not enabled.");
    }
  },

  nextDailyRun: () => {
    return dailySchedule.nextInvocation();
  }
};
