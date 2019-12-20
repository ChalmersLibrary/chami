"use strict";

var xpath = require("xpath");
var dom = require("xmldom").DOMParser;
var marc4js = require("marc4js");
var uuidv4 = require("uuid/v4");
const Inventory = require("../data/Inventory");

module.exports = class DataConverter {
  convert(list) {
    console.log("List length:", list.length);
    let self = this;
    return new Promise(async function(resolve, reject) {
      try {
        let res = [];
        for (let i = 0; i < list.length; i++) {
          try {
            let folioData = await self.convertMarcToFolio(list[i]);
            res = res.concat(folioData);
          } catch (error) {
            console.log(error.message);
          }
        }
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
  }

  convertMarcToFolio(data) {
    // console.log("Data Length:", data.length);
    return new Promise((resolve, reject) => {
      if (typeof data === "object") {
        data = data.toString();
      }
      var doc = new dom().parseFromString(data);
      var select = xpath.useNamespaces({
        oai: "http://www.openarchives.org/OAI/2.0/",
        marc: "http://www.loc.gov/MARC21/slim"
      });

      var error = select("//oai:error", doc);
      // console.log("Error", error);
      if (error[0] == null && error[0] === undefined) {
        let inventoryJson = [];
        try {
          let oaiRecords = select("//oai:record", doc);
          if (oaiRecords.length != 0) {
            oaiRecords.forEach(oaiRecord => {
              let oaiId = select("oai:header/oai:identifier", oaiRecord)[0]
                .textContent;
              let librisId = "";
              let librisBibId = "";
              if (oaiId.includes("/bib/")) {
                librisBibId = oaiId;
              } else {
                librisId = oaiId;
              }

              let marcRecord = select("oai:metadata/marc:record", oaiRecord)[0];
              marc4js.parse(marcRecord, { fromFormat: "marcxml" }, function(
                _err,
                records
              ) {
                let inventory = new Inventory(records[0], {
                  librisId: librisId,
                  librisBibId: librisBibId,
                  hrid: oaiId,
                  instanceTypeId: "a2c91e87-6bab-44d6-8adb-1fd02481fc4f",
                  source: "MARC",
                  statisticalCodeIds: ["67e08311-90f8-4639-82cc-f7085c6511d8"]
                });
                inventoryJson.push(inventory);

                if (inventoryJson.length === oaiRecords.length) {
                  resolve(inventoryJson);
                }
              });
            });
          } else {
            let marcRecords = select("//marc:record", doc);
            console.log(marcRecords.length);

            marcRecords.forEach(marcRecord => {
              marc4js.parse(marcRecord, { fromFormat: "marcxml" }, function(
                _err,
                records
              ) {
                // console.log("rec len", records.length);
                // console.log(JSON.stringify(records[0]));

                let tag001 = records[0].controlFields
                  .filter(fields => {
                    if (fields.tag === "001") {
                      return fields;
                    }
                  })
                  .map(data => {
                    return data.data;
                  })[0];

                let tag887 = records[0].dataFields
                  .filter(fields => {
                    if (fields.tag === "887") {
                      let code5 = false;
                      fields.subfields.forEach(subfield => {
                        if (subfield.code === "5") {
                          code5 = true;
                        }
                      });
                      return !code5;
                    }
                  })[0]
                  .subfields.filter(subfields => subfields.code === "a")
                  .map(data => {
                    let d = JSON.parse(data.data);
                    return d["@id"];
                  })[0];

                let librisBibId = /^\d+$/.test(tag001) ? tag001 : "";
                let librisId = `https://libris.kb.se/${tag887}`;
                let hrid = librisId;

                let inventory = new Inventory(records[0], {
                  librisId: librisId,
                  librisBibId: librisBibId,
                  hrid: hrid,
                  instanceTypeId: "a2c91e87-6bab-44d6-8adb-1fd02481fc4f",
                  source: "MARC",
                  statisticalCodeIds: ["67e08311-90f8-4639-82cc-f7085c6511d8"]
                });
                inventoryJson.push(inventory);
                if (inventoryJson.length === marcRecords.length) {
                  resolve(inventoryJson);
                }
              });
            });
          }
        } catch (e) {
          console.log(e.stack);
          reject(e);
        }
      } else {
        console.log("Rejecting");
        reject(new Error("Error from Libris."));
      }
    });
  }
};
