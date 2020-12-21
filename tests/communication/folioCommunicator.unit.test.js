const FolioCommunicator = require('../../communication/foliocommunicator');
const Logger = require('../../logger/logger');

describe('foliocommunicator unit tests', () => {
  let sut;
  let logger;

  beforeEach(() => {
    logger = new Logger();
    sut = new FolioCommunicator(logger);
    jest.spyOn(sut, 'acquireTokenFromFolio');
  });

  describe('sendDataToFolio', () => {
    test.each([
      null,
      undefined,
      '',
      'random string',
      {},
      134
    ])('with %s, should throw error', async (records) => {
      expect.assertions(2);
      await expect(sut.sendDataToFolio(records))
        .rejects
        .toStrictEqual(new Error('FOLIO: Failed to send data: Wrong input type, should be list.'));
      expect(sut.acquireTokenFromFolio).not.toHaveBeenCalled();
    });
  });

  describe('put', () => {
    describe('should fail and log', () => {
      test('Not Found', async () => {
        const folioId = '5e4011a1-609f-4bb3-9bdc-d2a88eb2d637';
        const url = `${process.env.okapiUrl}/instance-storage/instances/${folioId}`;
        const data = {
          'id': '5e4011a1-609f-4bb3-9bdc-d2a88eb2d637',
          'source': 'MARC',
          'title': 'chami-test',
          'instanceTypeId': 'd5b234e7-5477-4ce1-831d-43dd181246fb',
          'identifiers': [{
            'identifierTypeId': '925c7fb9-0b87-4e16-8713-7f4ea71d854b',
            'value': '1111'
          }]
        };
        const options = {
          method: "PUT",
          headers: {
            "x-okapi-token": undefined,
            "x-okapi-tenant": process.env.tenantId,
            Accept: "text/plain",
            "Content-type": "application/json"
          },
          body: JSON.stringify(data)
        };
        const error = new Error(`Url: ${url}, Status: 404, Message: Not Found`);
        jest.spyOn(sut, 'fetchFolio').mockRejectedValueOnce(error);
        expect.assertions(2);

        await expect(sut.put(folioId, data))
          .rejects
          .toStrictEqual(error);
        expect(sut.fetchFolio).toHaveBeenCalledWith(url, options);
      });
    });      
  });

  describe('post', () => {
    describe('should fail and log', () => {
      test('Not Found', async () => {
        const data = {
          'id': '5e4011a1-609f-4bb3-9bdc-d2a88eb2d637',
          'source': 'MARC',
          'title': 'chami-test',
          'instanceTypeId': 'd5b234e7-5477-4ce1-831d-43dd181246fb',
          'identifiers': [{
            'identifierTypeId': '925c7fb9-0b87-4e16-8713-7f4ea71d854b',
            'value': '1111'
          }]
        };
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
        const error = new Error(`Url: ${url}, Status: 404, Message: Not Found`);
        jest.spyOn(sut, 'fetchFolio').mockRejectedValueOnce(error);
        expect.assertions(2);

        await expect(sut.post(data))
          .rejects
          .toStrictEqual(error);
        expect(sut.fetchFolio).toHaveBeenCalledWith(url, options);
      });
    });
  });
});