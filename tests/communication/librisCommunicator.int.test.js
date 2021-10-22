const LibrisCommunicator = require('../../communication/libriscommunicator');

describe('LibrisCommunicator integration tests', () => {
  let sut;

  beforeEach(() => {
    sut = new LibrisCommunicator();
  });
  
  describe('getDataById', () => {
    test('with valid id, should return response', async () => {
      const id = 'https://libris.kb.se/9ncjf4kx7mbrs1w0';

      const response = await sut.getDataById(id);

      expect(response).toBeTruthy();
    }, 10000);

    test('with invalid id, should throw error', async () => {
      const id = 'https://libris.kb.se/sb4dqfc42gwb70j';

      await expect(sut.getDataById(id))
        .rejects
        .toThrow(new Error('Libris: Failed when fetching with id: https://libris.kb.se/sb4dqfc42gwb70j - XML error - noRecordsMatch'));
    });
  });

  describe('getDataByTimestamp', () => {
    test('with valid timestamps', async () => {
      const from = '2020-11-18T07:00:00Z';
      const until = '2020-11-18T07:06:00Z';

      await expect(sut.getDataByTimestamp(from, until))
        .resolves
        .not
        .toThrow();
    }, 50000);
  });
});

