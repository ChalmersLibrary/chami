const FolioCommunicator = require('../../communication/foliocommunicator');
const fs = require('fs');

describe('FolioCommunicator integration tests', () => {
  let sut;

  beforeEach(() => {
    const config = fs.readFileSync('config.json');
    process.env = JSON.parse(config);
    sut = new FolioCommunicator();
  });

  afterEach(() => {
    global.folioToken = undefined;
  });

  describe('send data to FOLIO', () => {
    test('should make successful put', async () => {
      const record = {
        "id": "99b0ba61-f7cd-41e3-9395-bb086fc8c355",
        "hrid":'https://libris.kb.se/sb4dqfc42gwb70r',
        "title": "Making Marie Curie : intellectual property and celebrity culture in an age of information",
        "instanceTypeId": "6312d172-f0cf-40f6-b27d-9fa8feaf332f",
        "source": "MARC",
        "identifiers": [
          {
            value: "https://libris.kb.se/sb4dqfc42gwb70r",
            identifierTypeId: "925c7fb9-0b87-4e16-8713-7f4ea71d854b",
          },
          {
            value: "17774314",
            identifierTypeId: "28c170c6-3194-4cff-bfb2-ee9525205cf7",
          }
        ]
      };

      await expect(sut.sendDataToFolio([record])).resolves.not.toThrow();
    });
    describe('should throw error', () => {
      test('add instance to FOLIO', async () => {
        let instance = {
          'id': '5e4011a1-609f-4bb3-9bdc-d2a88eb2d637',
          'source': 'MARC',
          'title': 'chami-test',
          'instanceTypeId': 'd5b234e7-5477-4ce1-831d-43dd181246fb',
          'identifiers': [{
            'identifierTypeId': '925c7fb9-0b87-4e16-8713-7f4ea71d854b',
            'value': '1111'
          }]
        };

        expect.assertions(2);
        jest.spyOn(sut, 'post');
  
        await expect(sut.sendDataToFolio([instance]))
          .rejects
          .toThrow(new Error(['FOLIO: Failed to send data:', 
            ' Failed to post record - Url: ',
            'https://folio-goldenrod-okapi.dev.folio.org/instance-storage/instances',
            ', Status: 400, Message: Bad Request'].join('')));
        expect(sut.post).toHaveBeenCalledWith(instance);
      });
    });
  });

  describe('acquire Token From Folio', () => {
    test('should fail', async () => {
      process.env.folioUsername = "adnim";

      await expect(sut.acquireTokenFromFolio())
        .rejects
        .toStrictEqual(new Error("FOLIO: Failed to acquire token: Url:" +
          " https://folio-goldenrod-okapi.dev.folio.org/authn/login," +
          " Status: 422, Message: Unprocessable Entity"));
    });

    test('should be successful', async () => {
      await sut.acquireTokenFromFolio();

      expect(global.folioToken).toBeTruthy();
    });
  });
});