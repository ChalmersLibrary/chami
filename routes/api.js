const express = require("express");
const router = express.Router();
const util = require("util");
const cron = require("../scheduling/cron.js");

const logger = new (require("../logger/logger.js"))();
const elasticsearchCommunicator = new (require('../communication/elasticsearchcommunicator'))();
const fetchScheduler = new (require("../scheduling/fetchscheduler.js"))(elasticsearchCommunicator);
const librisCommunicator = new (require("../communication/libriscommunicator.js"))();
const dataConverter = new (require("../data/dataconverter.js"))();
const folioCommunicator = new (require("../communication/foliocommunicator.js"))();

const librisFolioDataMover = new (require("../librisfoliodatamover"))(
  fetchScheduler,
  librisCommunicator,
  dataConverter,
  folioCommunicator
);

router.post("/InstancesAndHoldings", async function(req, res) {
  const id = req.query.id;
  const from = req.query.from;
  const until = req.query.until;
  try {
    if (id) {
      await librisFolioDataMover.moveDataById(id);
    } else {
      await librisFolioDataMover.moveDataByTimestamps(from, until);
    }
    res.send(
      "Instances and holdings in FOLIO has been updated with data from Libris."
    );
  } catch (error) {
    await logger.error('InstancesAndHoldings', error);
    res.status(500).send(error.message);
  }
});

router.get("/FetchTimes", async function(req, res) {
  try {
    const timestamp = await fetchScheduler.getLatestFetchTimestamps();
    return res.json(timestamp);
  } catch (error) {
    await logger.error('FetchTimes:', error);
    res.status(500).send(error);
  }
});

router.get("/Bookmarklet", function(req, res) {
  res.send(
    `<a href="javascript:(function(){window.s0=document.createElement('script');window.s0.setAttribute('type','text/javascript');window.s0.setAttribute('src','${process.env.serverurl}/bookmarklet.js?t='+Date.now());document.getElementsByTagName('body')[0].appendChild(window.s0);})();">LIBRIS->FOLIO</a>`
  );
});

router.get("/PostAndRedirect", async (req, res) => {
  try {
    await folioCommunicator.acquireTokenFromFolio();
    let librisId = req.query.id;
    await librisFolioDataMover.moveDataById(librisId);
    let value = await folioCommunicator.instanceExists(librisId);
    let i = 0;
    while (!value.exists && i < 4) {
      i++;
      value = await folioCommunicator.instanceExists(librisId);
    }
    let uriTemp =
      "https://chalmers.folio.ebsco.com/inventory/view/%s?sort=title";
    let uri = util.format(uriTemp, value.folioId);
    if (value.exists) {
      res.redirect(uri);
    } else {
      throw new Error("Record was not found in FOLIO");
    }
  } catch (error) {
    await logger.error('PostAndRedirect:', error);
    res.status(500).send(error);
  }
});

router.get("/NextDailyRunTime", async (req, res) => {
  try {
    res.json(cron.nextDailyRun());
  } catch (error) {
    await logger.error('NextDailyRunTime:', error);
    res.status(500).send(error);
  }
});

module.exports = router;
