"use strict";

var xpath = require("xpath");
var dom = require("xmldom").DOMParser;
var marc4js = require("marc4js");
const Inventory = require("../data/Inventory");

module.exports = class DataConverter {

  async convert(list) {
    try {
      this.validateList(list);
      return await this.convertData(list);
    } catch (error) {
      error.message = `Failed to convert record(s) - ${error.message}`;
      throw error;
    }
  }

  validateList(list) {
    if(Array.isArray(list) === false || list.length === 0 || list[0] === '') {
      throw new Error('Missing records');
    }
  }

  async convertData(list) {
    let res = [];
    for (let i = 0, j = list.length; i < j; i++) {
      let folioData = await this.convertMarcToFolio(list[i]);
      res = res.concat(folioData);
    }
    return res;
  }

  convertMarcToFolio(data) {
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
          reject(e);
        }
      } else {
        reject(new Error("Error from Libris."));
      }
    });
  }
};
