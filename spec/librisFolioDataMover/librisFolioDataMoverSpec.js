describe("LibrisFolioDataMover", function() {
  let createLibrisFolioDataMover = counter => {
    counter = typeof counter !== "undefined" ? counter : {};
    counter.fetchScheduler = {
      getLatestSuccessfulFetchTimestamp: 0,
      registerSuccessfulFetch: 0,
      registerUnsuccessfulFetch: 0
    };
    counter.librisCommunicator = {
      getDataById: 0,
      getDataByTimestamp: 0
    };
    counter.dataConverter = {
      convert: 0
    };
    counter.folioCommunicator = {
      sendDataToFolio: 0
    };
    let fetchScheduler = {
      getLatestSuccessfulFetchTimestamp: () => {
        counter.fetchScheduler.getLatestSuccessfulFetchTimestamp += 1;
        return new Promise(r => r("2012-01-02"));
      },
      registerSuccessfulFetch: () => {
        counter.fetchScheduler.registerSuccessfulFetch += 1;
        return new Promise(r => r());
      },
      registerUnsuccessfulFetch: () => {
        counter.fetchScheduler.registerUnsuccessfulFetch += 1;
        return new Promise(r => r());
      }
    };
    let librisCommunicator = {
      getDataById: () => {
        counter.librisCommunicator.getDataById += 1;
        return new Promise(r => r());
      },
      getDataByTimestamp: () => {
        counter.librisCommunicator.getDataByTimestamp += 1;
        return new Promise(r => r());
      }
    };
    let dataConverter = {
      convert: () => {
        counter.dataConverter.convert += 1;
        return new Promise(r => r());
      }
    };
    let folioCommunicator = {
      sendDataToFolio: () => {
        counter.folioCommunicator.sendDataToFolio += 1;
        return new Promise(r => r());
      }
    };

    return new (require("../../librisfoliodatamover"))(
      fetchScheduler,
      librisCommunicator,
      dataConverter,
      folioCommunicator
    );
  };

  it("should not crash with both valid id and from", async () => {
    let librisFolioDataMover = createLibrisFolioDataMover();
    let id = 1;
    let from = "2012-01-02";
    let until;
    await librisFolioDataMover.moveData(id, from, until);
  });

  it("should not crash with valid from timestamp only", async () => {
    let librisFolioDataMover = createLibrisFolioDataMover();
    let id = 0;
    let from = "2012-01-02";
    let until;
    await librisFolioDataMover.moveData(id, from, until);
  });

  it("should not crash with valid id only", async () => {
    let librisFolioDataMover = createLibrisFolioDataMover();
    let id = 1;
    let from;
    let until;
    await librisFolioDataMover.moveData(id, from, until);
  });

  it("should not crash with no valid id or timestamps", async () => {
    let librisFolioDataMover = createLibrisFolioDataMover();
    let id;
    let from;
    let until;
    await librisFolioDataMover.moveData(id, from, until);
  });

  it("should call sub methods correct amount of times with both valid timestamp and id", async () => {
    let counter = {};
    let librisFolioDataMover = createLibrisFolioDataMover(counter);
    let id = 1;
    let from = "2012-01-02";
    let until;
    await librisFolioDataMover.moveData(id, from, until);
    expect(counter.fetchScheduler.getLatestSuccessfulFetchTimestamp).toEqual(0);
    expect(counter.fetchScheduler.registerSuccessfulFetch).toEqual(1);
    expect(counter.fetchScheduler.registerUnsuccessfulFetch).toEqual(0);
    expect(counter.librisCommunicator.getDataById).toEqual(1);
    expect(counter.librisCommunicator.getDataByTimestamp).toEqual(0);
    expect(counter.dataConverter.convert).toEqual(1);
    expect(counter.folioCommunicator.sendDataToFolio).toEqual(1);
  });

  it("should call sub methods correct amount of times with valid id only", async () => {
    let counter = {};
    let librisFolioDataMover = createLibrisFolioDataMover(counter);
    let id = 1;
    let from;
    let until;
    await librisFolioDataMover.moveData(id, from, until);
    expect(counter.fetchScheduler.getLatestSuccessfulFetchTimestamp).toEqual(0);
    expect(counter.fetchScheduler.registerSuccessfulFetch).toEqual(1);
    expect(counter.fetchScheduler.registerUnsuccessfulFetch).toEqual(0);
    expect(counter.librisCommunicator.getDataById).toEqual(1);
    expect(counter.librisCommunicator.getDataByTimestamp).toEqual(0);
    expect(counter.dataConverter.convert).toEqual(1);
    expect(counter.folioCommunicator.sendDataToFolio).toEqual(1);
  });

  it("should call sub methods correct amount of times with valid timestamp only", async () => {
    let counter = {};
    let librisFolioDataMover = createLibrisFolioDataMover(counter);
    let id;
    let from = "2012-01-02T00:00:00Z";
    let until = "2012-02-01T00:00:00Z";
    await librisFolioDataMover.moveData(id, from, until);
    expect(counter.fetchScheduler.getLatestSuccessfulFetchTimestamp).toEqual(0);
    expect(counter.fetchScheduler.registerSuccessfulFetch).toEqual(1);
    expect(counter.fetchScheduler.registerUnsuccessfulFetch).toEqual(0);
    expect(counter.librisCommunicator.getDataById).toEqual(0);
    expect(counter.librisCommunicator.getDataByTimestamp).toEqual(1);
    expect(counter.dataConverter.convert).toEqual(1);
    expect(counter.folioCommunicator.sendDataToFolio).toEqual(1);
  });

  it("should register unsuccessful fetch when failing convert", async () => {
    let counter = {};
    let librisFolioDataMover = createLibrisFolioDataMover(counter);
    librisFolioDataMover.dataConverter.convert = () => {
      return new Promise((r, rj) => rj(new Error("FAIL!")));
    };
    let id = 1;
    let from;
    let until;
    await librisFolioDataMover.moveData(id, from, until);
    expect(counter.fetchScheduler.getLatestSuccessfulFetchTimestamp).toEqual(0);
    expect(counter.fetchScheduler.registerSuccessfulFetch).toEqual(0);
    expect(counter.fetchScheduler.registerUnsuccessfulFetch).toEqual(1);
    expect(counter.librisCommunicator.getDataById).toEqual(1);
    expect(counter.librisCommunicator.getDataByTimestamp).toEqual(0);
    expect(counter.folioCommunicator.sendDataToFolio).toEqual(0);
  });

  it("should register unsuccessful fetch when failing FOLIO send", async () => {
    let counter = {};
    let librisFolioDataMover = createLibrisFolioDataMover(counter);
    librisFolioDataMover.folioCommunicator.sendDataToFolio = () => {
      return new Promise((r, rj) => rj(new Error("FAIL!")));
    };
    let id = 1;
    let from;
    let until;
    await librisFolioDataMover.moveData(id, from, until);
    expect(counter.fetchScheduler.getLatestSuccessfulFetchTimestamp).toEqual(0);
    expect(counter.fetchScheduler.registerSuccessfulFetch).toEqual(0);
    expect(counter.fetchScheduler.registerUnsuccessfulFetch).toEqual(1);
    expect(counter.librisCommunicator.getDataById).toEqual(1);
    expect(counter.librisCommunicator.getDataByTimestamp).toEqual(0);
    expect(counter.dataConverter.convert).toEqual(1);
  });

  it("should throw exception when failing register successful fetch", async () => {
    let expectedError = new Error("FAIL!");
    let counter = {};
    let librisFolioDataMover = createLibrisFolioDataMover(counter);
    librisFolioDataMover.fetchScheduler.registerSuccessfulFetch = () => {
      return new Promise((r, rj) => rj(expectedError));
    };
    let id = 1;
    let from;
    let until;
    let error;
    try {
      await librisFolioDataMover.moveData(id, from, until);
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(expectedError);
  });

  it("should throw exception when failing register unsuccessful fetch", async () => {
    let expectedError = new Error("FAIL!");
    let counter = {};
    let librisFolioDataMover = createLibrisFolioDataMover(counter);
    librisFolioDataMover.folioCommunicator.sendDataToFolio = () => {
      return new Promise((r, rj) => rj(new Error("FAIL!")));
    };
    librisFolioDataMover.fetchScheduler.registerUnsuccessfulFetch = () => {
      return new Promise((r, rj) => rj(expectedError));
    };
    let id = 1;
    let from;
    let until;
    let error;
    try {
      await librisFolioDataMover.moveData(id, from, until);
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(expectedError);
  });

  it("should throw exception when failing to get latest successful timestamp", async () => {
    let expectedError = new Error("FAIL!");
    let counter = {};
    let librisFolioDataMover = createLibrisFolioDataMover(counter);
    librisFolioDataMover.fetchScheduler.getLatestSuccessfulFetchTimestamp = () => {
      return new Promise((r, rj) => rj(expectedError));
    };
    let id;
    let from;
    let until;
    let error;
    try {
      await librisFolioDataMover.moveData(id, from, until);
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(
      new Error(
        "Failed to fetch timestamp from history: Error: " +
          expectedError.message
      )
    );
  });

  it("should register unsuccessful fetch when failing to get data by id from LIBRIS", async () => {
    let expectedError = new Error("FAIL!");
    let counter = {};
    let librisFolioDataMover = createLibrisFolioDataMover(counter);
    librisFolioDataMover.librisCommunicator.getDataById = () => {
      return new Promise((r, rj) => rj(expectedError));
    };
    let id = 1;
    let from;
    let until;
    let error;
    await librisFolioDataMover.moveData(id, from, until);
    expect(counter.fetchScheduler.getLatestSuccessfulFetchTimestamp).toEqual(0);
    expect(counter.fetchScheduler.registerSuccessfulFetch).toEqual(0);
    expect(counter.fetchScheduler.registerUnsuccessfulFetch).toEqual(1);
    expect(counter.librisCommunicator.getDataByTimestamp).toEqual(0);
    expect(counter.dataConverter.convert).toEqual(0);
    expect(counter.folioCommunicator.sendDataToFolio).toEqual(0);
  });

  it("should register unsuccessful fetch when failing to get data by timestamp from LIBRIS", async () => {
    let expectedError = new Error("FAIL!");
    let counter = {};
    let librisFolioDataMover = createLibrisFolioDataMover(counter);
    librisFolioDataMover.librisCommunicator.getDataByTimestamp = () => {
      return new Promise((r, rj) => rj(expectedError));
    };
    let id;
    let from = "2012-02-12";
    let until;
    let error;
    await librisFolioDataMover.moveData(id, from, until);
    expect(counter.fetchScheduler.getLatestSuccessfulFetchTimestamp).toEqual(0);
    expect(counter.fetchScheduler.registerSuccessfulFetch).toEqual(0);
    expect(counter.fetchScheduler.registerUnsuccessfulFetch).toEqual(1);
    expect(counter.librisCommunicator.getDataByTimestamp).toEqual(0);
    expect(counter.dataConverter.convert).toEqual(0);
    expect(counter.folioCommunicator.sendDataToFolio).toEqual(0);
  });

  it("should have correct context in call to getLatestSuccessfulFetchTimestamp", async () => {
    let librisFolioDataMover = createLibrisFolioDataMover();
    librisFolioDataMover.fetchScheduler.getLatestSuccessfulFetchTimestamp = function() {
      expect(this).toEqual(librisFolioDataMover.fetchScheduler);
      return new Promise((r, rj) => r());
    };
    let id = 1;
    let from;
    let until;
    await librisFolioDataMover.moveData(id, from, until);
  });

  it("should have correct context in call to registerSuccessfulFetch", async () => {
    let librisFolioDataMover = createLibrisFolioDataMover();
    librisFolioDataMover.fetchScheduler.registerSuccessfulFetch = function() {
      expect(this).toEqual(librisFolioDataMover.fetchScheduler);
      return new Promise((r, rj) => r());
    };
    let id = 1;
    let from;
    let until;
    await librisFolioDataMover.moveData(id, from, until);
  });

  it("should have correct context in call to registerUnsuccessfulFetch", async () => {
    let librisFolioDataMover = createLibrisFolioDataMover();
    librisFolioDataMover.fetchScheduler.registerUnsuccessfulFetch = function() {
      expect(this).toEqual(librisFolioDataMover.fetchScheduler);
      return new Promise((r, rj) => r());
    };
    let id = 1;
    let from;
    let until;
    await librisFolioDataMover.moveData(id, from, until);
  });

  it("should have correct context in call to getDataById", async () => {
    let librisFolioDataMover = createLibrisFolioDataMover();
    librisFolioDataMover.librisCommunicator.getDataById = function() {
      expect(this).toEqual(librisFolioDataMover.librisCommunicator);
      return new Promise((r, rj) => r());
    };
    let id = 1;
    let from;
    let until;
    await librisFolioDataMover.moveData(id, from, until);
  });

  it("should have correct context in call to getDataByTimestamp", async () => {
    let librisFolioDataMover = createLibrisFolioDataMover();
    librisFolioDataMover.librisCommunicator.getDataByTimestamp = function() {
      expect(this).toEqual(librisFolioDataMover.librisCommunicator);
      return new Promise((r, rj) => r());
    };
    let id = 1;
    let from;
    let until;
    await librisFolioDataMover.moveData(id, from, until);
  });

  it("should have correct context in call to convert", async () => {
    let librisFolioDataMover = createLibrisFolioDataMover();
    librisFolioDataMover.dataConverter.convert = function() {
      expect(this).toEqual(librisFolioDataMover.dataConverter);
      return new Promise((r, rj) => r());
    };
    let id = 1;
    let from;
    let until;
    await librisFolioDataMover.moveData(id, from, until);
  });

  it("should have correct context in call to sendDataToFolio", async () => {
    let librisFolioDataMover = createLibrisFolioDataMover();
    librisFolioDataMover.folioCommunicator.sendDataToFolio = function() {
      expect(this).toEqual(librisFolioDataMover.folioCommunicator);
      return new Promise((r, rj) => r());
    };
    let id = 1;
    let from;
    let until;
    await librisFolioDataMover.moveData(id, from, until);
  });
});
