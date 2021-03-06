const scheduler = require("node-schedule");
const logger = new (require("../logger/logger.js"))();
const elasticsearchCommunicator = new (require('../communication/elasticsearchcommunicator'))();
const fetchScheduler = new (require("../scheduling/fetchscheduler.js"))(elasticsearchCommunicator);
const librisCommunicator = new (require("../communication/libriscommunicator.js"))();
const dataConverter = new (require("../data/dataconverter.js"))();
const folioCommunicator = new (require("../communication/foliocommunicator.js"))(logger);

const librisFolioDataMover = new (require("../librisfoliodatamover"))(
  fetchScheduler,
  librisCommunicator,
  dataConverter,
  folioCommunicator
);

let dailySchedule;

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
      dailySchedule = scheduler.scheduleJob("15 03 * * *", async () => {
        try {
          console.log("dauilySchedule run.");
          await librisFolioDataMover.moveDataByTimestamps(null, null, true);
        } catch (error) {
          await logger.error(`Something went wrong with scheduled daily run: ${error.message}`, error);
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
