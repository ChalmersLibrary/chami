var rp = require('request-promise');

module.exports = class FetchScheduler {
    constructor() {
        this.indexName = 'chalmmi-data-fetch';
    }

    registerSuccessfulFetch(createdDateTime, id, fromDateTime) {
        let self = this;
        return new Promise(function (resolve, reject) {
            try {
                let url = self.buildElasticsearchDataPostUrl(self.indexName, false);
                let data = {
                    id: id,
                    created: self.createUTCDateTimeString(createdDateTime),
                    success: true,
                    message: 'Great success!'
                };
                if (!id) { // If we have id, fromDateTime has not been used.
                    data.from = fromDateTime;
                }
                rp({
                    url: url,
                    method: 'POST',
                    json: data
                }).then(function (value) {
                    resolve();
                }).catch(function (reason) {
                    reject('Failed to register successful fetch in Elasticsearch: ' + reason);
                });
            } catch (err) {
                reject('Failed to register successful fetch: ' + err);
            }
        });
    }

    registerUnsuccessfulFetch(createdDateTime, id, fromDateTime, message) {
        let self = this;
        return new Promise(function (resolve, reject) {
            try {
                let url = self.buildElasticsearchDataPostUrl(self.indexName, false);
                let data = {
                    id: id,
                    created: self.createUTCDateTimeString(createdDateTime),
                    success: false,
                    message: message.toString()
                };
                if (!id) { // If we have id, fromDateTime has not been used.
                    data.from = fromDateTime;
                }
                rp({
                    url: url,
                    method: 'POST',
                    json: data
                }).then(function (value) {
                    resolve();
                }).catch(function (reason) {
                    reject('Failed to register unsuccessful fetch in Elasticsearch: ' + reason);
                });
            } catch (err) {
                reject('Failed to register unsuccessful fetch: ' + err);
            }
        });
    }

    getLatestSuccessfulFetchTimestamp() {
        let self = this;
        return new Promise(function (resolve, reject) {
            try {
                let url = self.buildElasticsearchQueryUrl(self.indexName, false);

                rp({
                    url: url,
                    method: 'POST',
                    json: {
                      size: 1,
                      query: {
                        query_string: {
                            query: 'success:true && !_exists_:id'
                        }
                      },
                      sort: [
                          { created: { order: 'desc' } }
                      ]
                    }
                }).then(function (value) {
                    if (value.hits && value.hits.hits && value.hits.hits.length > 0 && value.hits.hits[0]._source) {
                        resolve(value.hits.hits[0]._source.created);
                    } else {
                        // If we don't have any timestamp we return yesterdays date.
                        let yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        resolve(self.createUTCDateTimeString(yesterday));
                    }
                }).catch(function (reason) {
                    let rootCause;
                    if (reason && reason.error && reason.error.error) {
                        rootCause = reason.error.error.root_cause;
                    }
                    if (reason.error.error.type === 'index_not_found_exception' ||
                        (reason.error.error.type === 'search_phase_execution_exception' && 
                            rootCause && 
                            rootCause.length > 0 && 
                            rootCause[0].reason.indexOf('No mapping found') > -1)) {
                        // If we don't have any timestamp we return yesterdays date.
                        let yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        resolve(self.createUTCDateTimeString(yesterday));
                    } else {
                        reject(reason);
                    }
                });
            } catch (err) {
                reject('Failed to get latest successful fetch timestamp: ' + err);
            }
        });
    }

    getLatestFetchTimestamps() {
        try {
            let self = this;
            return new Promise(function (resolve, reject) {
                let url = self.buildElasticsearchQueryUrl(self.indexName, false);
    
                rp({
                    url: url,
                    method: 'POST',
                    json: {
                      size: 50,
                      query: {
                        match_all: {}
                      },
                      sort: [
                          { created: { order: 'desc' } }
                      ]
                    }
                }).then(function (value) {
                    resolve(value.hits);
                }).catch(function (reason) {
                    reject(reason);
                });
            });
        } catch (err) {
            reject('Failed to get latest fetch timestamps: ' + err);
        }
    }

    buildElasticsearchDataPostUrl(index) { 
        return 'https://' + process.env.elasticsearchUsername + ':' + 
        process.env.elasticsearchPassword + '@' + 
        process.env.elasticsearchHost + ':' + 
        process.env.elasticsearchPort + '/' + index + '/_doc';
    }    

    buildElasticsearchQueryUrl(index, ignoreUnavailable = false) {
        return 'https://' + process.env.elasticsearchUsername + ':' + 
        process.env.elasticsearchPassword + '@' + 
        process.env.elasticsearchHost + ':' + 
        process.env.elasticsearchPort + '/' + index + '/_search' + 
        (ignoreUnavailable ? '?ignore_unavailable=true' : '');
    }

    zeroPadMethod(text, padLength) { return '0000'.substr(0, padLength - text.toString().length) + text; }

    createUTCDateTimeString(date) {
        return date.getFullYear() + '-' + 
            this.zeroPadMethod(date.getUTCMonth() + 1, 2) + '-' + 
            this.zeroPadMethod(date.getUTCDate(), 2) + 'T' +
            this.zeroPadMethod(date.getUTCHours(), 2) + ':' +
            this.zeroPadMethod(date.getUTCMinutes(), 2) + ':' + 
            this.zeroPadMethod(date.getUTCSeconds(), 2) + 'Z';
    }
}