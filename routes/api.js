var express = require("express");
var router = express.Router();
var util = require("util");
var cron = require("../scheduling/cron.js");

var fetchScheduler = new (require("../scheduling/fetchscheduler.js"))();
var librisCommunicator = new (require("../communication/libriscommunicator.js"))();
var dataConverter = new (require("../data/dataconverter.js"))();
var folioCommunicator = new (require("../communication/foliocommunicator.js"))();

var librisFolioDataMover = new (require("../librisfoliodatamover"))(
  fetchScheduler,
  librisCommunicator,
  dataConverter,
  folioCommunicator
);

router.post("/InstancesAndHoldings", function(req, res, next) {
  let id = req.query.id;
  let from = req.query.from;
  let until = req.query.until;

  librisFolioDataMover
    .moveData(id, from, until)
    .then(function(value) {
      res.send(
        "Instances and holdings in FOLIO has been updated with data from Libris."
      );
    })
    .catch(function(reason) {
      console.error(reason);
      res.status(500).send(reason);
    });
});

router.get("/FetchTimes", function(req, res, next) {
  fetchScheduler
    .getLatestFetchTimestamps()
    .then(function(value) {
      res.json(value);
    })
    .catch(function(reason) {
      console.error(reason);
      res.status(500).send(reason);
    });
});

router.get("/Bookmarklet", function(req, res, next) {
  res.send(
    `<a href="javascript:(function(){window.s0=document.createElement('script');window.s0.setAttribute('type','text/javascript');window.s0.setAttribute('src','${process.env.serverurl}/bookmarklet.js?t='+Date.now());document.getElementsByTagName('body')[0].appendChild(window.s0);})();">LIBRIS->FOLIO</a>`
  );
});

router.get("/PostAndRedirect", async (req, res, next) => {
  try {
    await folioCommunicator.login();
    let librisId = req.query.id;
    await librisFolioDataMover.moveData(librisId, null, null);
    let value = await folioCommunicator.instanceExists(librisId);
    console.log(JSON.stringify(value));
    let i = 0;
    while (!value.exists && i < 4) {
      i++;
      value = await folioCommunicator.instanceExists(librisId);
      console.log(JSON.stringify(value));
      console.log("Attempt " + i);
    }
    let uriTemp =
      "https://chalmers.folio.ebsco.com/inventory/view/%s?sort=title";
    let uri = util.format(uriTemp, value.folioId);
    if (value.exists) {
      console.log(util.format("Redirecting to %s", uri));
      res.redirect(uri);
    } else {
      throw new Error("Record was not found in FOLIO");
    }
  } catch (reason) {
    console.error(reason);
    res.status(500).send(reason);
  }
});

router.get("/NextDailyRunTime", (req, res, next) => {
  try {
    res.json(cron.nextDailyRun());
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
