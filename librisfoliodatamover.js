module.exports = class LibrisFolioDataMover {
  constructor(
    fetchScheduler,
    librisCommunicator,
    dataConverter,
    folioCommunicator
  ) {
    this.fetchScheduler = fetchScheduler;
    this.librisCommunicator = librisCommunicator;
    this.dataConverter = dataConverter;
    this.folioCommunicator = folioCommunicator;
  }

  async moveData(id, from, until) {
    let now = new Date(); // Save the time when we are called for the fetch timestamp.

    // Try to get the latest timestamp if we don't have any id or timestamp.
    if (!id && !from) {
      try {
        from = await this.fetchScheduler.getLatestSuccessfulFetchTimestamp();
      } catch (error) {
        throw Error("Failed to fetch timestamp from history: " + error);
      }
    }

    if (from && !until) {
      until = now.toISOString();
    }

    // Do the moving of data.
    let dataMoveWasSuccessful = false;
    try {
      await this.internalMove(id, from, until);
      dataMoveWasSuccessful = true;
    } catch (error) {
      await this.fetchScheduler.registerUnsuccessfulFetch(now, id, from, error);
    }

    if (dataMoveWasSuccessful) {
      await this.fetchScheduler.registerSuccessfulFetch(now, id, from);
    }
  }

  internalMove(id, from, until) {
    let res;
    if (id) {
      res = this.librisCommunicator.getDataById(id);
    } else if (from && until) {
      res = this.librisCommunicator.getDataByTimestamp(from, until);
    } else {
      throw new Error("Both identifier and timestamp are null.");
    }

    return (
      res
        // .then(dataConverter.convertMarcToFolio.bind(dataConverter))
        .then(this.dataConverter.convert.bind(this.dataConverter))
        .then(
          this.folioCommunicator.sendDataToFolio.bind(this.folioCommunicator)
        )
        .catch(e => {
          throw new Error(e.message);
        })
    );
  }
};
