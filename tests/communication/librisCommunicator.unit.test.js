const LibrisCommunicator = require('../../communication/libriscommunicator');

describe('LibrisCommunicator', () => {
  let sut;

  beforeEach(() => {
    sut = new LibrisCommunicator();
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
      jest.spyOn(sut, 'fetchFromLibris');
      expect.assertions(2);

      await expect(sut.getDataById(id))
        .rejects
        .toStrictEqual(new Error(`Libris: Failed when fetching with id: ${id} - Invalid id`));
      expect(sut.fetchFromLibris).not.toHaveBeenCalled();
    });

    test("with valid id https://libris.kb.se/sb4dqfc42gwb70r, should pass", async () => {
      jest.spyOn(sut, 'fetchFromLibris').and.returnValue(["<?xml version='1.0' encoding='UTF-8'?><OAI-PMH xmlns=\"http://www.openarchives.org/OAI/2.0/\"><responseDate>2020-11-24T16:08:35.668Z</responseDate><request verb=\"GetRecord\" identifier=\"https://libris.kb.se/sb4dqfc42gwb70r\" metadataPrefix=\"marcxml_includehold_expanded\">http://libris.kb.se/oaipmh/</request><GetRecord><record><header><identifier>https://libris.kb.se/sb4dqfc42gwb70r</identifier><datestamp>2019-12-20T13:19:18.439+01:00</datestamp><setSpec>bib</setSpec></header><metadata><record xmlns=…ld code=\"w\">g</subfield><subfield code=\"a\">Biografi</subfield></datafield><datafield ind1=\" \" ind2=\" \" tag=\"680\"><subfield code=\"i\">Genre/formterm.</subfield></datafield><datafield ind1=\" \" ind2=\" \" tag=\"887\"><subfield code=\"a\">{\"@id\":\"fcrtxvvz51hkm33\",\"modified\":\"2020-08-26T08:30:41.999+02:00\",\"checksum\":\"76707253177\"}</subfield><subfield code=\"2\">librisxl</subfield></datafield></record></auth></about><about><agent name=\"https://libris.kb.se/library/Z\"/></about></record></GetRecord></OAI-PMH>'"]);     
      expect.assertions(2);
      const id = "https://libris.kb.se/sb4dqfc42gwb70r";
      const path = `oaipmh/?verb=GetRecord&identifier=${id}&metadataPrefix=marcxml_includehold_expanded`;
      const options = { method: 'GET' };

      const response = await sut.getDataById(id);

      expect(response.length).toBe(1);
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
      jest.spyOn(sut, 'fetchFromLibris');
      expect.assertions(2);

      await expect(sut.getDataByTimestamp(from, until))
        .rejects
        .toStrictEqual(new Error(`Libris: Failed fetching with timestamp: from ${from} - Until ${until} - Invalid timestamp(s)`));
      expect(sut.fetchFromLibris).not.toHaveBeenCalled();
    });

  test('with from: 2020-11-18T08:05:00Z, until: 2020-11-18T09:05:00Z', async () => {
     jest.spyOn(sut, 'fetchFromLibris').and.returnValue(["<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<collection xmlns=\"http://www.loc.gov/MARC21/slim\">\n  <record xmlns=\"http://www.loc.gov/MARC21/slim\" type=\"Bibliographic\"><leader>     cam a       8i 4500</leader><controlfield tag=\"001\">22159938</controlfield><controlfield tag=\"003\">SE-LIBR</controlfield><controlfield tag=\"005\">20201122080029.0</controlfield><controlfield tag=\"008\">171221s2018    xx |||||||||||000 1|eng|d</controlfield><datafield ind1=\" \" ind2=\" \" tag=\"020\"><subfield code=\"a\">978039335618…/subfield><subfield code=\"b\">201119||0000|||||000||||||000000</subfield><subfield code=\"e\">u</subfield></datafield><datafield ind1=\" \" ind2=\" \" tag=\"852\"><subfield code=\"5\">Zl</subfield><subfield code=\"b\">Zl</subfield></datafield><datafield ind1=\" \" ind2=\" \" tag=\"887\"><subfield code=\"5\">Zl</subfield><subfield code=\"a\">{\"@id\":\"fsr2vx0rcg9q7dj1\",\"modified\":\"2020-11-19T11:15:26.478+01:00\",\"checksum\":\"58303522419\"}</subfield><subfield code=\"2\">librisxl</subfield></datafield></record>\n</collection>"]);     
     expect.assertions(2);
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
        'extrafields=Z\:698 ; Za\:698 ; Zl\:698 ; Enll\:698',
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

      const response = await sut.getDataByTimestamp(from, until);

      expect(response.length).toBe(1);
      expect(sut.fetchFromLibris).toHaveBeenCalledWith(path, options);
    });
  });
});
