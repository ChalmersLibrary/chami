const fs = require('fs');
const ElasticsearchCommunicator = require('../communication/elasticsearchcommunicator');
const FetchScheduler = require("../scheduling/fetchscheduler.js");
const LibrisCommunicator = require("../communication/libriscommunicator.js");
const DataConverter = require("../data/dataconverter.js");
const FolioCommunicator = require("../communication/foliocommunicator.js");
const LibrisFolioDataMover = require("../librisfoliodatamover");

describe("LibrisFolioDataMover", function() {
  let sut;
  let fetchScheduler;
  let librisCommunicator;
  let dataConverter;
  let folioCommunicator;
  let elasticsearchCommunicator;

  beforeEach(() => {
    const config = fs.readFileSync('config.json');
    process.env = JSON.parse(config);
    elasticsearchCommunicator = new ElasticsearchCommunicator();
    fetchScheduler = new FetchScheduler(elasticsearchCommunicator);
    librisCommunicator = new LibrisCommunicator();
    dataConverter = new DataConverter();
    folioCommunicator = new FolioCommunicator();
    sut = new LibrisFolioDataMover(
      fetchScheduler, 
      librisCommunicator, 
      dataConverter, 
      folioCommunicator);
  });

  describe('moveDataById', () => {
    test.each([
      123,
      [],
      {},
      'sb4dqfc42gwb70j',
      'http://libris.kb.se/sb4dqfc42gwb70j'
    ])('should crash with invalid id: %s', async (id) => {
      await expect(sut.moveDataById(id))
      .rejects
      .toEqual(new Error(`Libris: Failed when fetching with id: ${id} - Invalid id`));
    });

    test('with valid id', async () => {
      const id = 'https://libris.kb.se/cwp4dbhp175mlkm';

      await expect(sut.moveDataById(id))
        .resolves
        .not
        .toThrow();
    }, 8000);
  });

  describe('moveDataByTimestamps', () => {
    describe('invalid', () => {
      test.each([
        '2012-01-02',
        1234,
      ])('should crash with invalid from timestamp: %s', async (from) => {
        let until = '2020-12-07T10:34:37Z';
  
        await expect(sut.moveDataByTimestamps(from, until, false))
          .rejects
          .toEqual(new Error(`Libris: Failed fetching with timestamp: from ${from} - Until ${until} - Invalid timestamp(s)`));
      });  
    });

    describe('valid', () => {
      test.each([
      //  ['2020-11-18T07:00:00Z', '2020-11-18T07:03:00Z' ],
        [null, null]
      ])('with valid timestamps from %s until %s', async (from, until) => {
        await expect(sut.moveDataByTimestamps(from, until, false))
          .resolves
          .not
          .toThrow();
  
      }, 10000);
    });
  });
});
