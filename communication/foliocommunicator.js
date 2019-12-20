var rp = require("request-promise");

module.exports = class FolioCommunicator {
  async sendDataToFolio(records) {
    let self = this;
    // console.log("Time to send data to FOLIO!");
    // console.log("Number of records from OAI-PMH: " + records.length);
    // console.log(`Records ${JSON.stringify(records)}`);
    try {
      if (records.length == 0) {
        throw new Error("Found no records");
      }
      console.log(`Sending ${records.length} records to Folio.`);
      await self.login();
      var responses = await records.map(async record => {
        // console.log(`global.folioToken in update: ${global.folioToken}`);
        var idArray = record.identifiers.filter(function(el) {
          return el.identifierTypeId == "925c7fb9-0b87-4e16-8713-7f4ea71d854b";
        });
        var idArrayBibId = record.identifiers.filter(function(el) {
          return el.identifierTypeId == "28c170c6-3194-4cff-bfb2-ee9525205cf7";
        });
        var librisId = idArray[0].value || "";
        if (idArrayBibId.length > 0) {
          var bibId = idArrayBibId[0].value || "";
        } else {
          var bibId = "";
        }
        var res = await self.instanceExists(librisId, bibId);
        // console.log(`Record Id: ${record.id}`);
        // console.log("Res: ", res);
        if (res.exists === true) {
          console.log(
            "Yes, found instance " +
              res.folioId +
              " already present in FOLIO, Updating..."
          );
          return self.put("/instance-storage/instances/" + res.folioId, record);
        } else {
          console.log("No, New instance received, creating...");
          return self.post("/instance-storage/instances", record);
        }
      });
      return responses;
    } catch (e) {
      console.error(e.message);
      throw Error(e.message);
    }
  }
  // Logs in to FOLIO to acquire a X-OKAPI-TOKEN
  login() {
    console.log("Logging in");
    return new Promise((resolve, reject) => {
      if (global.folioToken && global.folioToken.length > 5) {
        resolve();
      } else {
        // console.log("Logging in " + process.env.folioUsername);
        let path = "/authn/login";
        let data = {
          username: process.env.folioUsername,
          password: process.env.folioPassword
        };
        var options = {
          method: "POST",
          uri: process.env.okapiUrl + path,
          body: data,
          resolveWithFullResponse: true,
          headers: {
            "Content-Type": "application/json",
            "x-okapi-tenant": process.env.tenantId
          },
          json: true
        };
        rp(options)
          .then(function(response) {
            // console.log(`Headers: ${JSON.stringify(response.headers)}`);
            global.folioToken = response.headers["x-okapi-token"];
            // console.log(`global.folioToken: ${global.folioToken}`);
            resolve();
          })
          .catch(function(reason) {
            console.log("REASON login: " + reason);
            reject(reason);
          });
      }
    });
  }

  // PUTs (updates a FOLIO record)
  put(path, data) {
    // console.log("PUT to " + path);
    let self = this;
    return new Promise((resolve, reject) => {
      let options = {
        url: process.env.okapiUrl + path,
        method: "PUT",
        headers: {
          "x-okapi-token": global.folioToken,
          "x-okapi-tenant": process.env.tenantId,
          Accept: "text/plain",
          "Content-type": "application/json"
        },
        json: true,
        body: data
      };
      rp(options)
        .then(response => {
          resolve();
        })
        .catch(reason => {
          console.log("REASON4: " + reason);
          reject(reason);
        });
    });
  }

  // POSTs (creates a FOLIO record)
  post(path, data) {
    console.log("POST to " + path + " Data: " + JSON.stringify(data));
    return new Promise((resolve, reject) => {
      let options = {
        url: process.env.okapiUrl + path,
        method: "POST",
        headers: {
          "x-okapi-token": global.folioToken,
          "x-okapi-tenant": process.env.tenantId,
          Accept: "application/json",
          "Content-type": "application/json"
        },
        json: true,
        body: data,
        resolveWithFullResponse: true
      };
      rp(options)
        .then(response => {
          resolve();
        })
        .catch(reason => {
          console.log("REASON: " + reason);
          reject(reason);
        });
    });
  }

  instanceExists(librisId, bibId) {
    console.log(
      `instanceExists running for LibrisId: ${librisId} and/or ${bibId}`
    );
    let self = this;
    return new Promise((resolve, reject) => {
      let path = "/inventory/instances?limit=1&query=";
      if (!librisId && !bibId) {
        reject(Error("no ids found"));
      }
      let query = "(";
      if (librisId) {
        query +=
          'identifiers =/@value/@identifierTypeId="925c7fb9-0b87-4e16-8713-7f4ea71d854b" "' +
          librisId +
          '"';
      }
      if (librisId && bibId) {
        query += " or ";
      }
      if (bibId) {
        query +=
          'identifiers =/@value/@identifierTypeId="28c170c6-3194-4cff-bfb2-ee9525205cf7" "' +
          bibId +
          '"';
      }
      query += ")";
      console.log(`${path} (${query})`);
      // console.log(
      //   `folioToken: ${global.folioToken}, folioTenant: ${process.env.tenantId}`
      // );
      let options = {
        url: process.env.okapiUrl + path + query,
        method: "GET",
        headers: {
          "x-okapi-token": global.folioToken,
          "x-okapi-tenant": process.env.tenantId,
          Accept: "application/json",
          "Content-type": "application/json"
        },
        json: true,
        timout: 15000
      };
      return rp(options)
        .then(function(data) {
          console.log(JSON.stringify(data));
          let res;
          if (data.totalRecords === 0) {
            console.log(`Found ${data.totalRecords} = create`);
            res = { exists: false };
          } else if (data.totalRecords === 1) {
            console.log(`Found ${data.totalRecords} = update`);
            res = { exists: true, folioId: data.instances[0].id };
          } else if (data.totalRecords > 1) {
            console.log(`Found ${data.totalRecords} = crash`);
            reject("Multiple instances found");
          }
          // let res =
          //   data.totalRecords === 1
          //     ? { exists: true, folioId: data.instances[ 0 ].id }
          //     : { exists: false }
          resolve(res);
        })
        .catch(function(reason) {
          console.log(JSON.stringify(reason));
          reject(reason);
        });
    });
  }
};
