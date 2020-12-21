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

  async moveDataById(id) {
    const now = new Date();
    const res = await this.librisCommunicator.getDataById(id);
    const convertedData = await this.dataConverter.convert(res);
    await this.folioCommunicator.sendDataToFolio(convertedData);
    await this.fetchScheduler.registerSuccessfulFetchWithId(id, now);
  }

  async moveDataByTimestamps(from, until, isCronJob) {
    const now = new Date();
    from = await this.getTimestamp(from);
    until = this.getUntilTimestamp(until, now);
    const res = await this.librisCommunicator.getDataByTimestamp(from, until);
    const convertedData = await this.dataConverter.convert(res);
    await this.folioCommunicator.sendDataToFolio(convertedData);
    await this.fetchScheduler.registerSuccessfulFetchWithTimestamps(from, until, now, convertedData, isCronJob);
  }

  async getTimestamp(from) {
    if (from) {
      return from;
    } else {
      return await this.fetchScheduler.getLatestSuccessfulFetchTimestamp();
    }
  }

  getUntilTimestamp(until, now) {
    if (until) {
      return until;
    } else {
      return this.fetchScheduler.createUTCDateTimeString(now);
    }
  }
};
