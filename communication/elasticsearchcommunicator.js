const { Client } = require('@elastic/elasticsearch');

module.exports = class ElasticsearchCommunicator {

  constructor() {
    this.indexName = 'chalmmi-data-fetch';
  }

  createClient() {
    return new Client({
      auth: {
        username: process.env.elasticsearchUsername,
        password: process.env.elasticsearchPassword
      },
      node: process.env.elasticsearchHost
    });
  }

  async index(data) {
    const client = this.createClient();
    const { statusCode, warnings } = await client.index({
      index: this.indexName,
      type: '_doc',
      body: data
    });
    this.validResponse(statusCode, warnings);
  }

  async search(query) {
    const client = this.createClient();
    const { body, statusCode, warnings } = await client.search({
      index: this.indexName,
      body: query
    }); 
    this.validResponse(statusCode, warnings);
    return body;
  }

  validResponse(statusCode, warnings) {
    if ((statusCode >= 200 && statusCode < 300) === false) {
      throw new Error(`StatusCode: ${statusCode}, Warning(s): ${warnings}`);
    }  
  }
};