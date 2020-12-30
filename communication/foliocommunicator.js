const fetch = require("node-fetch");

module.exports = class FolioCommunicator {

  constructor(logger) {
    this.logger = logger;
  }
  
  async sendDataToFolio(records) {
    try {
      this.validateRecords(records);
      if (records.length > 0) {
        await this.acquireTokenFromFolio();
  
        const filterId = (record, id) => record.identifiers.filter((x) => {
          return x.identifierTypeId === id;
        });
  
        for(let i = 0, j = records.length; i < j; i++) {
          const record = records[i];
          const idArray = filterId(record, '925c7fb9-0b87-4e16-8713-7f4ea71d854b');
          const librisId = idArray.length > 0 ? idArray[0].value : '';
          const idArrayBibId = filterId(record, '28c170c6-3194-4cff-bfb2-ee9525205cf7');     
          const bibId = idArrayBibId.length > 0 ? idArrayBibId[0].value : '';
          const res = await this.instanceExists(librisId, bibId);
  
          if (res.exists === true && res.multipleInstances === false) {
            await this.put(res.folioId, record);
          } else if (res.exists === false && res.multipleInstances === false){
            await this.post(record);
          }
        }
      }
    } catch (error) {
      error.message = `FOLIO: Failed to send data: ${error.message}`;
      throw error;
    }
  }

  validateRecords(records) {
    if (Array.isArray(records) === false) {
      throw new Error('Wrong input type, should be list.');
    }
  }

  async acquireTokenFromFolio() {
    if (global.folioToken === undefined || global.folioToken === null) {
      const data = {
        username: process.env.folioUsername,
        password: process.env.folioPassword
      };
      const url = `${process.env.okapiUrl}/authn/login`;
      const options = {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "x-okapi-tenant": process.env.tenantId
        }
      };
      try {
        const response = await this.fetchFolio(url, options);
        global.folioToken = response.headers.get("x-okapi-token");
      } catch (error) {
        error.message = `FOLIO: Failed to acquire token: ${error.message}`;
        throw error;
      }
    }
  }

  async put(folioId, data) {
    const url = `${process.env.okapiUrl}/instance-storage/instances/${folioId}`;
    const options = {
      method: "PUT",
      headers: {
        "x-okapi-token": global.folioToken,
        "x-okapi-tenant": process.env.tenantId,
        Accept: "text/plain",
        "Content-type": "application/json"
      },
      body: JSON.stringify(data)
    };
    try {
      await this.fetchFolio(url, options);
    } catch (error) {
      error.message = `Put failed with id: ${folioId} - ${error.message}`;
      throw error;
    }
  }

  async post(data) {
    const url = `${process.env.okapiUrl}/instance-storage/instances`;
    const options = {
      method: "POST",
      headers: {
        "x-okapi-token": global.folioToken,
        "x-okapi-tenant": process.env.tenantId,
        Accept: "application/json",
        "Content-type": "application/json"
      },
      body: JSON.stringify(data),
    };    
    try {
      const errorMessage =  {
        UnprocessableEntity : "Unprocessable Entity"
      };
     // await this.fetchFolio(url, options);
     const response = await fetch(url, options);
     if (response.ok === false && response.statusText === errorMessage.UnprocessableEntity) {
       await this.logger.error(`Failed to post record with id ${data.hrid}:`, 
        new Error(`Url: ${response.url}, Status: ${response.status}, Message: ${response.statusText}`));
     } else {
      this.validateResponse(response);
     }
    } catch (error) {
      error.message = `Failed to post record: ${JSON.stringify(data)} - ${error.message}`;
      throw error;
    }
  }

  async instanceExists(librisId, bibId) {
    this.validateIds(librisId, bibId);

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

    const url = `${process.env.okapiUrl}/inventory/instances?limit=1&query=${query}`;
    let options = {
      method: "GET",
      headers: {
        "x-okapi-token": global.folioToken,
        "x-okapi-tenant": process.env.tenantId,
        Accept: "application/json",
        "Content-type": "application/json"
      },
      timeout: 15000
    };

    try {
      const response = await this.fetchFolio(url, options);
      const data = await response.json();
      if (data.totalRecords === 0) {
        return { exists: false, multipleInstances: false};
      } else if (data.totalRecords === 1) {
        return { exists: true, folioId: data.instances[0].id, multipleInstances: false };
      } else if (data.totalRecords > 1) {
        await this.logger.error("FolioCommunicator:", new Error(`Multiple instances found with id ${data.instances[0].id}`));
        return  { exists: true, multipleInstances: true };
      }
    } catch (error) {
      error.message = `InstanceExists - ${error.message}`;
      throw error;
    }
  }

  validateIds(librisId, bibId) {
    if (!librisId && !bibId) {
      throw new Error("No ids found.");
    }
  }

  async fetchFolio(url, options) {
    const response = await fetch(url, options);
    this.validateResponse(response);
    return response;
  }

  validateResponse(response) {
    if (response.ok === false) {
      throw new Error(`Url: ${response.url}, Status: ${response.status}, Message: ${response.statusText}`);
    }
  }


};
