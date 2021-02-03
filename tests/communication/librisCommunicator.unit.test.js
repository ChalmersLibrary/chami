const LibrisCommunicator = require('../../communication/libriscommunicator');

describe('LibrisCommunicator', () => {
  let sut;

  beforeEach(() => {
    sut = new LibrisCommunicator();
    jest.spyOn(sut, 'fetchFromLibris');
  });

  describe('getDataById', () => {
    test.each([
      null,
      undefined,
      "",
      123,
      [],
      {},
      'sb4dqfc42gwb70j',
      'http://libris.kb.se/sb4dqfc42gwb70j'
    ])('with invalid id %s, should throw error', async (id) => {
      expect.assertions(2);

      await expect(sut.getDataById(id))
        .rejects
        .toStrictEqual(new Error(`Libris: Failed when fetching with id: ${id} - Invalid id`));
      expect(sut.fetchFromLibris).not.toHaveBeenCalled();
    });

    test("with valid id https://libris.kb.se/sb4dqfc42gwb70r, should pass", async () => {
      const id = "https://libris.kb.se/sb4dqfc42gwb70r";
      const path = `oaipmh/?verb=GetRecord&identifier=${id}&metadataPrefix=marcxml_includehold_expanded`;
      const options = { method: 'GET' };

      await sut.getDataById(id);

      expect(sut.fetchFromLibris).toHaveBeenCalledWith(path, options);
    });
  });

  describe('getDataByTimestamp', () => {
    test.each([
      [null, null],
      [undefined, undefined],
      [123, 123],
      ['2020-11-18T08:05:00Z', null],
      [null, '2020-11-18T08:05:00Z'],
      ['2020-11-18T08:05:00Z', undefined],
      [undefined, '2020-11-18T08:05:00Z'],
      ['', ''],
      ['2020-11-18T08:05:00Z', '2020-16-18T08:05:00Z'],
      ['2020-16-18T08:05:00Z', '2020-11-18T08:05:00Z'],
      ['no date', '2020-11-18T08:05:00Z'],
      ['2020-11-18', '2020-11-18T08:05:00Z']
    ])('with invalid timestamps: from %s - until %s', async (from, until) => {
      expect.assertions(2);

      await expect(sut.getDataByTimestamp(from, until))
        .rejects
        .toStrictEqual(new Error(`Libris: Failed fetching with timestamp: from ${from} - Until ${until} - Invalid timestamp(s)`));
      expect(sut.fetchFromLibris).not.toHaveBeenCalled();
    });

  test('with from: 2020-11-18T08:05:00Z, until: 2020-11-18T09:05:00Z', async () => {
      const from = '2020-11-18T07:00:00Z';
      const until = '2020-11-18T07:01:00Z';
      const path = `marc_export/?from=${from}&until=${until}&deleted=ignore&virtualDelete=true`;
      const body = [
        'move240to244=off',
        'f003=SE-LIBR',
        'holdupdate=on',
        'lcsh=off',
        'composestrategy=composelatin1',
        'holddelete=off',
        'authtype=interleaved',
        'isbnhyphenate=off',
        'name=CTHB',
        'locations=Z Za Zl Enll',
        'bibcreate=on',
        'authcreate=on',
        'format=marcxml',
        'longname=Chalmers tekniska högskola',
        'extrafields=Z:698 ; Za:698 ; Zl:698 ; Enll:698',
        'biblevel=off',
        'issnhyphenate=off',
        'issndehyphenate=off',
        'holdtype=interleaved',
        'holdcreate=on',
        'characterencoding=UTF-8',
        'isbndehyphenate=off',
        'bibupdate=on',
        'efilter=off',
        'move0359=off',
        'authupdate=on',
        'sab=off'].join('\n');
      const options = {
        method: 'POST',
        headers: {"content-type": "raw"},
        body: body
      };

      await sut.getDataByTimestamp(from, until);

      expect(sut.fetchFromLibris).toHaveBeenCalledWith(path, options);
    });
  });
});
