module.exports = class FetchScheduler {

  constructor(elasticsearchCommunicator) {
    this.indexName = 'chalmmi-data-fetch';
    this.elasticsearchCommunicator = elasticsearchCommunicator;
  }

  async registerSuccessfulFetchWithId(id, now) {
    const data = {
      created: this.createUTCDateTimeString(now),
      id: id,
      message: `Successful fetch with id ${id}`,
      success: true
    };
    await this.registerSuccessfulFetch(data);
  }

  async registerSuccessfulFetchWithTimestamps(from, until, now, convertedData, isCronJob) {
    const ids = convertedData.map(x => x.hrid);
    const data = {
      created: this.createUTCDateTimeString(now),
      cronJob: isCronJob,
      from: from,
      instances: ids,
      totalInstances: convertedData.length,
      message: `Timestamp: ${from} - ${until} Total instances: ${convertedData.length}`  
    };
    await this.registerSuccessfulFetch(data);
  }

  async registerSuccessfulFetch(data) {
    try {
      await this.elasticsearchCommunicator.index(data);
    } catch (error) {
      error.message = `FetchScheduler: Failed to register successful fetch: ${error.message}`;
      throw error;
    }
  }

  async getLatestSuccessfulFetchTimestamp() {
    try { 
      const query = {
        size: 1,
        query: {
          query_string: {
            query: 'cronJob:true && success:true && !_exists_:id'
          }
        },
        sort: [{ created: { order: 'desc' }}]
      };
      const response = await this.elasticsearchCommunicator.search(query);
      
      if (response.hits && 
          response.hits.hits && 
          response.hits.hits.length > 0 && 
          response.hits.hits[0]._source) {
        return response.hits.hits[0]._source.created;
      } else {
        let yesterdayTimestamp = new Date();
        yesterdayTimestamp.setDate(yesterdayTimestamp.getDate() - 1);
        return this.createUTCDateTimeString(yesterdayTimestamp);
      }
    } catch (error) {
      error.message = `Failed to get latest successful fetch timestamp: ${error.message}`;
      throw error;
    }
  }

  async getLatestFetchTimestamps() {
    try {
      const query = {
        size: 50,
        query: {
          match_all: {}
        },
        sort: [{ created: { order: 'desc' }}]
      };
      const response = await this.elasticsearchCommunicator.search(query);
      return response.hits;
    } catch (error) {
      error.message = `Failed to get latest fetch timestamps: ${error.message}`;
      throw error;
    }
  }

  zeroPadMethod(text, padLength) { 
    return '0000'.substr(0, padLength - text.toString().length) + text; 
  }

  createUTCDateTimeString(date) {
    return date.getFullYear() + '-' +
      this.zeroPadMethod(date.getUTCMonth() + 1, 2) + '-' +
      this.zeroPadMethod(date.getUTCDate(), 2) + 'T' +
      this.zeroPadMethod(date.getUTCHours(), 2) + ':' +
      this.zeroPadMethod(date.getUTCMinutes(), 2) + ':' +
      this.zeroPadMethod(date.getUTCSeconds(), 2) + 'Z';
  }
};
