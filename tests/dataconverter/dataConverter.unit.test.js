const DataConverter = require('../../data/dataconverter');
const fs = require('fs');

describe('dataConverter unit tests', () => {
  let sut;

  beforeEach(() => {
    sut = new DataConverter();
  });

  describe('convert - should throw error', () => {
      test.each([
        [],
        {},
        null,
        undefined,
        [''],
        123
      ])('missing records with list %s', async (input) => {
        await expect(sut.convert(input))
          .rejects
          .toThrow(new Error('Failed to convert record(s) - Wrong input type, should be string.'));
      });
  });

  describe('Empty strings', () => {
    test.each([
      "",
      ''])('Should return empty list', async (input) => {
        const response = await sut.convert(input);
  
        expect(response).toStrictEqual([]);
      });
  });

  test('asdasd', async () => {
    const data = '<?xml version="1.0" encoding="utf-8"?>\n<collection xmlns="http://www.loc.gov/MARC21/slim">\n</collection>';
    
    const response = await sut.convert(data);

    expect(response.length).toBe(0);
  });

  test('List of records', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_records.xml', 'utf8');

    const response = await sut.convert(data);

    expect(response.length).toBe(21);
  });


  test('err', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/tedst_no_records_match.xml', 'utf8');

    await expect(sut.convert(data)).rejects.toThrow(new Error('Failed to convert record(s) - Error from Libris.'));
  });

  test('Simple Title: should match title (245)', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test1.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(7);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].instanceFormatIds).toContain('8d511d33-5e85-4c5d-9bce-6e3c9cd0c324');
    expect(response[0].title).not.toContain('/');
    expect(response[0].instanceTypeId).toBe('6312d172-f0cf-40f6-b27d-9fa8feaf332f');
    expect(response[0].modeOfIssuanceId).toBe('9d18a02f-5897-4c31-9106-c9abb5c7ae8b');
    expect(response[0].statisticalCodeIds).toContain('55326d56-4466-43d7-83ed-73ffd4d4221f');
    expect(response[0].title).toBe('Modern Electrosynthetic Methods in Organic Chemistry');
  });

  test('Composed title: Should create a composed title (245) with the [a, b, k, n, p] subfields.', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_composed_title.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(3);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].title).not.toContain('/');
    expect(response[0].title).toBe('The wedding collection. Volume 4, Love will be our home: 15 songs of love and commitment.');
  });

  test('Alternative titles: Should match 246 to alternativeTitles', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test3.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(3);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].alternativeTitles).not.toContain('/');
    expect(response[0].alternativeTitles).toContainEqual({
      alternativeTitleTypeId: '0fe58901-183e-4678-a3aa-0b4751174ba8',
      alternativeTitle: 'Engineering identities, epistemologies and values'
    });
  });

  test('Should match 130 to alternativeTitles', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test4.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(2);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].alternativeTitles).toContainEqual({
      alternativeTitleTypeId: '0fe58901-183e-4678-a3aa-0b4751174ba8',
      alternativeTitle: "Les cahiers d'urbanisme"
    });
  });

  test('Should match 246 to alternativeTitles when there is also 130', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test4.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(2);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].alternativeTitles).toContainEqual(
      {
        alternativeTitleTypeId: '0fe58901-183e-4678-a3aa-0b4751174ba8',
        alternativeTitle: "Cahiers d'urbanisme et d'aménagement du territoire"
      }
    );
  });

  test('Should match 222 to alternativeTitles (when there are also 130 and 246)', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test4.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(4);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].alternativeTitles).toContainEqual(
      {
        alternativeTitleTypeId: '0fe58901-183e-4678-a3aa-0b4751174ba8',
        alternativeTitle: "Cahiers d'urbanisme et d'aménagement du territoire"
      });
    expect(response[0].alternativeTitles).toContainEqual(
      {
        alternativeTitleTypeId: '0fe58901-183e-4678-a3aa-0b4751174ba8',
        alternativeTitle: "Les cahiers d'urbanisme"
      });
    expect(response[0].alternativeTitles).toContainEqual(
      {
        alternativeTitleTypeId: '0fe58901-183e-4678-a3aa-0b4751174ba8',
        alternativeTitle: 'Urbana tidskrifter'
      });
  });

  test('Editions: Should add editions (250) to the editions list and enforce unique', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_editions.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(3);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].editions).toContain('8. uppl.');
    expect(response[0].editions).toContain('[Revised]');
  });

  test('Languages: Should add languages (041$a) to the languages list; ignores non-ISO languages', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_multiple_languages.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(8);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].languages).toContain('eng');
    expect(response[0].languages).toContain('ger');
    expect(response[0].languages).toContain('fre');
    expect(response[0].languages).toContain('ita');
    expect(response[0].languages).not.toContain('en_US');
    expect(response[0].languages).not.toContain('###');
    expect(response[0].languages).not.toContain('zxx');
  });

  test('Should add language found in 008 where there is no 041', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_language_in_008.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(2);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].languages).toContain('fre');
  });

  test('Should fetch Libris Bib id, Libris XL id', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_publications.xml', 'utf8');
    const bibid = {
      'identifierTypeId': '28c170c6-3194-4cff-bfb2-ee9525205cf7',
      'value': '21080448'
    };
    const xl_id = {
      'identifierTypeId': '925c7fb9-0b87-4e16-8713-7f4ea71d854b',
      'value': 'https://libris.kb.se/8sl08b9l54wxk4m'
    };
    const xl_id_short = {
      'identifierTypeId': '4f3c4c2c-8b04-4b54-9129-f732f1eb3e14',
      'value': '8sl08b9l54wxk4m'
    };

    const response = await sut.convert(data);

    expect.assertions(3);
    expect(response[0].identifiers).toContainEqual(xl_id);
    expect(response[0].identifiers).toContainEqual(bibid);
    expect(response[0].identifiers).toContainEqual(xl_id_short);

  });

  test('Should fetch Libris Bib id', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_identifiers_libris_old_bib.xml', 'utf8');
    const bibid = {
      'identifierTypeId': '28c170c6-3194-4cff-bfb2-ee9525205cf7',
      'value': '21080448'
    };
    const xl_id = {
      'identifierTypeId': '925c7fb9-0b87-4e16-8713-7f4ea71d854b',
      'value': 'http://libris.kb.se/bib/21080448'
    };

    const response = await sut.convert(data);

    expect.assertions(2);
    expect(response[0].identifiers).toContainEqual(xl_id);
    expect(response[0].identifiers).toContainEqual(bibid);
  });

  test('Physical Descriptions: Should add physical descriptions (300$abce)', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_physical_descriptions.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(2);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].physicalDescriptions).toContain('xxxiv, 416 pages illustrations 24 cm.');
  });

  test('Index Title: Should trim title (245) by n-chars, as specified by indicator 2', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_index_title.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(2);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].indexTitle).toBe('cahiers d\'urbanisme');
  });

  test('Should add all types of alternative titles: 130, 222, 240, 246, 247', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_alternative_titles.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(6);
    expect(response[0].isValid).toBeTruthy();
    // 246
    expect(response[0].alternativeTitles).toContainEqual(
      {
        alternativeTitleTypeId: '0fe58901-183e-4678-a3aa-0b4751174ba8',
        alternativeTitle: 'Engineering identities, epistemologies and values - remainder title'
      }
    );
    // 247
    expect(response[0].alternativeTitles).toContainEqual(
      {
        alternativeTitleTypeId: '0fe58901-183e-4678-a3aa-0b4751174ba8',
        alternativeTitle: 'Medical world news annual review of medicine'
      }
    );
    // 240
    expect(response[0].alternativeTitles).toContainEqual(
      {
        alternativeTitleTypeId: '0fe58901-183e-4678-a3aa-0b4751174ba8',
        alternativeTitle: 'Laws, etc. (Laws of Kenya : 1948)'
      }
    );
    // 222
    expect(response[0].alternativeTitles).toContainEqual(
      {
        alternativeTitleTypeId: '0fe58901-183e-4678-a3aa-0b4751174ba8',
        alternativeTitle: 'Soviet astronomy letters'
      }
    );
    // 130
    expect(response[0].alternativeTitles).toContainEqual(
      {
        alternativeTitleTypeId: '0fe58901-183e-4678-a3aa-0b4751174ba8',
        alternativeTitle: 'Star is born (Motion picture : 1954)'
      }
    );
  });

  test('Should add identifiers: 010, 019, 020, 022, 024, 028, 035', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_identifiers.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(25);
    expect(response[0].isValid).toBeTruthy();
    // 010
    expect(response[0].identifiers).toContainEqual(
      { value: '2008011507', identifierTypeId: 'c858e4f2-2b6b-4385-842b-60732ee14abb' }
    );
    // 020
    expect(response[0].identifiers).toContainEqual(
      { value: '9780307264787', identifierTypeId: '8261054f-be78-422d-bd51-4ed9f33c3422' }
    );
    expect(response[0].identifiers).toContainEqual(
      { value: '9780071842013', identifierTypeId: '8261054f-be78-422d-bd51-4ed9f33c3422' }
    );
    expect(response[0].identifiers).toContainEqual(
      { value: '0071842012', identifierTypeId: '8261054f-be78-422d-bd51-4ed9f33c3422' }
    );
    // 020$z
    expect(response[0].identifiers).toContainEqual(
      { value: '9780307264755', identifierTypeId: 'fcca2643-406a-482a-b760-7a7f8aec640e' }
    );
    expect(response[0].identifiers).toContainEqual(
      { value: '9780307264766', identifierTypeId: 'fcca2643-406a-482a-b760-7a7f8aec640e' }
    );
    expect(response[0].identifiers).toContainEqual(
      { value: '9780307264777', identifierTypeId: 'fcca2643-406a-482a-b760-7a7f8aec640e' }
    );
    // 022
    expect(response[0].identifiers).toContainEqual(
      { value: '0376-4583', identifierTypeId: '913300b2-03ed-469a-8179-c1092c991227' }
    );
    // 022$z
    expect(response[0].identifiers).toContainEqual(
      { value: '0027-3473', identifierTypeId: '27fd35a6-b8f6-41f2-aa0e-9c663ceb250c' }
    );
    expect(response[0].identifiers).toContainEqual(
      { value: '0027-3475', identifierTypeId: '27fd35a6-b8f6-41f2-aa0e-9c663ceb250c' }
    );
    expect(response[0].identifiers).toContainEqual(
      { value: '0027-3476', identifierTypeId: '27fd35a6-b8f6-41f2-aa0e-9c663ceb250c' }
    );
    // 022$l
    expect(response[0].identifiers).toContainEqual(
      { value: '1234-1232', identifierTypeId: '5860f255-a27f-4916-a830-262aa900a6b9' }
    );
    // 02$2m
    expect(response[0].identifiers).toContainEqual(
      { value: '1560-15605', identifierTypeId: '27fd35a6-b8f6-41f2-aa0e-9c663ceb250c' }
    );
    // 022$y
    expect(response[0].identifiers).toContainEqual(
      { value: '0046-2254', identifierTypeId: '27fd35a6-b8f6-41f2-aa0e-9c663ceb250c' }
    );
    // 024
    expect(response[0].identifiers).toContainEqual(
      { value: '7822183031', identifierTypeId: '2e8b3b6c-0e7d-4e48-bca2-b0b23b376af5' }
    );
    expect(response[0].identifiers).toContainEqual(
      { value: 'M011234564', identifierTypeId: '2e8b3b6c-0e7d-4e48-bca2-b0b23b376af5' }
    );
    // 028
    expect(response[0].identifiers).toContainEqual(
      { value: 'PJC 222013', identifierTypeId: 'b5d8cdc4-9441-487c-90cf-0c7ec97728eb' }
    );
    // 035
    expect(response[0].identifiers).toContainEqual(
      { value: '(OCoLC)898162644', identifierTypeId: '7e591197-f335-4afb-bc6d-a6d76ca3bace' }
    );
    // 035$z
    expect(response[0].identifiers).toContainEqual(
      { value: '(OCoLC)898087359', identifierTypeId: '2e8b3b6c-0e7d-4e48-bca2-b0b23b376af5' }
    );
    expect(response[0].identifiers).toContainEqual(
      { value: '(OCoLC)930007675', identifierTypeId: '2e8b3b6c-0e7d-4e48-bca2-b0b23b376af5' }
    );
    expect(response[0].identifiers).toContainEqual(
      { value: '(OCoLC)942940565', identifierTypeId: '2e8b3b6c-0e7d-4e48-bca2-b0b23b376af5' }
    );
    // 019
    expect(response[0].identifiers).toContainEqual(
      { value: '62874189', identifierTypeId: '2e8b3b6c-0e7d-4e48-bca2-b0b23b376af5' }
    );
    expect(response[0].identifiers).toContainEqual(
      { value: '244170452', identifierTypeId: '2e8b3b6c-0e7d-4e48-bca2-b0b23b376af5' }
    );
    expect(response[0].identifiers).toContainEqual(
      { value: '677051564', identifierTypeId: '2e8b3b6c-0e7d-4e48-bca2-b0b23b376af5' }
    );
  });

  test('Should add series statements (800, 810, 811, 830, 440, 490) to series list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_series.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(8);
    expect(response[0].isValid).toBeTruthy();
    // 800
    expect(response[0].series).toContain('Joyce, James, 1882-1941. James Joyce archive.');
    // 810
    expect(response[0].series).toContain('United States. Dept. of the Army. Field manual.');
    // 811
    expect(response[0].series).toContain('International Congress of Nutrition (11th : 1978 : Rio de Janeiro, Brazil). Nutrition and food science ; v. 1.');
    // 830
    expect(response[0].series).toContain('Philosophy of engineering and technology ; v. 21.');
    expect(response[0].series).toContain('American university studies. Foreign language instruction ; vol. 12.');
    // 440
    expect(response[0].series).toContain('Journal of polymer science. Part C, Polymer symposia ; no. 39');
    // 490
    expect(response[0].series).toContain('Pediatric clinics of North America ; v. 2, no. 4.');
  });

  test('Should deduplicate identical series statements from 830 and 490 in series list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_series_duplicates.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(2);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].series).toContain('McGraw-Hill technical education series');
  });

  test('Should add contributors (100, 111 700) to the contributors list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_contributors.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(8);
    expect(response[0].isValid).toBeTruthy();
    // 100, no contrib type indicated
    expect(response[0].contributors).toContainEqual(
      {
        contributorNameTypeId: '2b94c631-fca9-4892-a730-03ee529ffe2a',
        name: 'Chin, Stephen, 1977-',
        contributorTypeId: '5daa3848-958c-4dd8-9724-b7ae83a99a27',
        primary: true
      }
    );
    // 100$4
    expect(response[0].contributors).toContainEqual(
      {
        contributorNameTypeId: '2b94c631-fca9-4892-a730-03ee529ffe2a',
        name: 'Presthus, Robert Vance',
        contributorTypeId: '5daa3848-958c-4dd8-9724-b7ae83a99a27',
        primary: true
      }
    );
    // 100$ade4, unknown typeid, set type text to cartographer
    expect(response[0].contributors).toContainEqual(
      {
        contributorNameTypeId: '2b94c631-fca9-4892-a730-03ee529ffe2a',
        name: 'Lous, Christian Carl, 1724-1804',
        contributorTypeId: '5daa3848-958c-4dd8-9724-b7ae83a99a27',
        primary: true
      }
    );
    // 700$e (contributor)
    expect(response[0].contributors).toContainEqual(
      {
        contributorNameTypeId: '2b94c631-fca9-4892-a730-03ee529ffe2a',
        name: 'Weaver, James L.',
        contributorTypeId: '9f0a2cf0-7a9b-45a2-a403-f68d2850d07c',
        primary: false
      }
    );
    // 111$acde, no contrib type id
    expect(response[0].contributors).toContainEqual(
      {
        contributorNameTypeId: 'e8b311a6-3b21-43f2-a269-dd9310cb2d0a',
        name: 'Wolfcon Durham 2018',
        contributorTypeId: '5daa3848-958c-4dd8-9724-b7ae83a99a27',
        primary: false
      }
    );
    // 111$abbde4
    expect(response[0].contributors).toContainEqual(
      {
        contributorNameTypeId: 'e8b311a6-3b21-43f2-a269-dd9310cb2d0a',
        name: 'Kyōto Daigaku. Genshiro Jikkenjo. Senmon Kenkyūkai (2013 January 25)',
        contributorTypeId: '6e09d47d-95e2-4d8a-831b-f777b8ef6d81',
        primary: false
      }
    );
    // 111$aee44
    // multiple relation types (author, illustrator), pick first one?
    expect(response[0].contributors).toContainEqual(
      {
        contributorNameTypeId: 'e8b311a6-3b21-43f2-a269-dd9310cb2d0a',
        name: 'Tupera Tupera (Firm)',
        contributorTypeId: '6e09d47d-95e2-4d8a-831b-f777b8ef6d81',
        primary: false
      }
    );

  });

  test('Should add classifications (050, 082, 090, 086, 080) to the classifications list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_classifications.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(6);
    expect(response[0].isValid).toBeTruthy();
    // LoC 050
    expect(response[0].classifications).toContainEqual({
      classificationNumber: 'TK7895.E42 C45 2016',
      classificationTypeId: 'ce176ace-a53e-4b4d-aa89-725ed7b2edac'
    });
    // Dewey 082
    expect(response[0].classifications).toContainEqual({
      classificationNumber: '004.165',
      classificationTypeId: '42471af9-7d25-4f3a-bf78-60d29dcf463b'
    });
    // LoC local 090
    expect(response[0].classifications).toContainEqual({
      classificationNumber: 'HV6089 .M37 1989a',
      classificationTypeId: 'ce176ace-a53e-4b4d-aa89-725ed7b2edac'
    });
    // Government Document Classification Number 086
    expect(response[0].classifications).toContainEqual({
      classificationNumber: 'ITC 1.12:TA-503 (A)-18 AND 332-279',
      classificationTypeId: '40d2f1ee-c8ef-420b-b74a-bbddcc2ac2dd'
    });
    // UDC 080
    expect(response[0].classifications).toContainEqual({
      classificationNumber: '72.03(092) Le Corbusier Idées',
      classificationTypeId: 'e8662436-75a8-4984-bebc-531e38c774a0'
    });
  });

  test('Should add subjects (600, 610, 611, 630, 647, 648, 650, 651) to the subjects list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_subjects.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(11);
    expect(response[0].isValid).toBeTruthy();
    // 600$abcdq
    expect(response[0].subjects).toContain(
      'Kougeas, Sōkr. V. IV Diogenes, Emperor of the East, active 1068-1071. (Sōkratēs V.)');
    // 610$abcdn
    expect(response[0].subjects).toContain(
      'Frederick II, King of Prussia, 1712-1786. No. 2.');
    // 611$acde
    expect(response[0].subjects).toContain(
      'Mississippi Valley Sanitary Fair (Venice, Italy). (1864 : ǂc Saint Louis, Mo.). Freedmen and Union Refugees\' Department.');
    // 630$adfhklst
    expect(response[0].subjects).toContain(
      'B.J. and the Bear. (1906) 1998. [medium] Manuscript. English New International [title]');
    // 647$acdvxyz
    expect(response[0].subjects).toContain(
      'Bunker Hill, Battle of (Boston, Massachusetts : 1775)');
    // 648$avxyz
    expect(response[0].subjects).toContain(
      'Twentieth century Social life and customs.');
    // 650$abcdvxyz
    expect(response[0].subjects).toContain(
      'Engineering Philosophy.');
    // 651$avxyz
    expect(response[0].subjects).toContain(
      'Aix-en-Provence (France) Philosophy. Early works to 1800.');
    expect(response[0].subjects).toContain(
      'Engineering_653');
    expect(response[0].subjects).toContain(
      'Engineering_655');
  });

  test('Should add publications (260$abc & 264$abc) to the publications list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_publications.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(3);
    expect(response[0].isValid).toBeTruthy();
    // 260$abc
    expect(response[0].publication).toContainEqual(
      {
        publisher: 'Elsevier',
        place: 'New York NY',
        dateOfPublication: '1984'
      }
    );
    // 264$abc
    expect(response[0].publication).toContainEqual(
      {
        publisher: 'Springer',
        place: 'Cham',
        dateOfPublication: '[2015]',
        role: 'Publication'
      }
    );
  });

  test('Should add publication frequency (310$ab & 321$ab) to the publicationFrequency list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_publication_frequency.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(4);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].publicationFrequency.length).toEqual(2); // check deduplication
    // 310$ab
    expect(response[0].publicationFrequency).toContain('Varannan månad, 1983-');
    // 321$ab
    expect(response[0].publicationFrequency).toContain('Monthly, Mar. 1972-Dec. 1980');
  });

  test('Should add publication range (362$a) to the publicationRange list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_publication_range.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(3);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].publicationRange.length).toEqual(1); // check deduplication
    expect(response[0].publicationRange).toContain('No 1-');
  });
  
  test('Should add notes (500-510) to notes list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_notes_50x.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(11);
    expect(response[0].isValid).toBeTruthy();
    // 500$a
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: '"Embedded application development for home and industry."--Cover.'
    });
    // 500$3a5
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Cotsen copy: Published plain red wrappers with first and last leaves pasted to interior wrappers. NjP'
    });
    // 501$a5
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'With: Humiliations follow\'d with deliverances. Boston : Printed by B. Green; J. Allen for S. Philips, 1697. Bound together subsequent to publication. DLC'
    });
    // 502$bcd
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'M. Eng. University of Louisville 2013'
    });
    // 504$ab
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Includes bibliographical references. 19'
    });
    // 506$a
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Classified.'
    });
    // 507$b
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Not drawn to scale.'
    });
    // 508$a
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Film editor, Martyn Down ; consultant, Robert F. Miller.'
    });
    // 508$a
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Film editor, Martyn Down ; consultant, Robert F. Miller.'
    });
    // 510$axb
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Index medicus, 0019-3879, v1n1, 1984-'
    });
  });

  test('Should add notes (511-518) to notes list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_notes_51x.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(7);
    expect(response[0].isValid).toBeTruthy();
    // 511$a
    expect(response[0].notes).toContainEqual({
      'staffOnly': false,
      'instanceNoteTypeId': '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      'note': 'Marshall Moss, violin ; Neil Roberts, harpsichord.'
    });
    // 513$ab
    expect(response[0].notes).toContainEqual({
      'staffOnly': false,
      'instanceNoteTypeId': '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      'note': 'Quarterly technical progress report; January-April 1, 1977.'
    });
    // 514$adef
    expect(response[0].notes).toContainEqual({
      'staffOnly': false,
      'instanceNoteTypeId': '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      'note': 'The map layer that displays Special Feature Symbols shows the approximate location of small (less than 2 acres in size) areas of soils... Quarter quadrangles edited and joined internally and to surrounding quads. All known errors corrected. The combination of spatial linework layer, Special Feature Symbols layer, and attribute data are considered a complete SSURGO dataset.'
    });
    // 515$a
    expect(response[0].notes).toContainEqual({
      'staffOnly': false,
      'instanceNoteTypeId': '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      'note': 'Designation New series dropped with volume 38, 1908.'
    });
    // 516$a
    expect(response[0].notes).toContainEqual({
      'staffOnly': false,
      'instanceNoteTypeId': '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      'note': 'Numeric (Summary statistics).'
    });
    // 518$3dp
    expect(response[0].notes).toContainEqual({
      'staffOnly': false,
      'instanceNoteTypeId': '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      'note': '3rd work 1981 November 25 Neues Gewandhaus, Leipzig.'
    });
  });

  test('Should add notes (520-525) to notes list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_notes_52x.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(5);
    expect(response[0].isValid).toBeTruthy();
    // 520$a
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: '"Create embedded projects for personal and professional applications. Join the Internet of Things revolution with a project-based approach to building embedded Java applications. Written by recognized Java experts, this Oracle Press guide features a series of low-cost, DIY projects that gradually escalate your development skills. Learn how to set up and configure your Raspberry Pi, connect external hardware, work with the NetBeans IDE, and write and embed powerful Java applications. Raspberry Pi with Java: Programming the Internet of Things (IoT) covers hobbyist as well as professional home and industry applications."--Back cover.'
    });
    // 522$a
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'County-level data from Virginia.'
    });
    // 524$a
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Dakota'
    });
    // 525$a
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Supplements accompany some issues.'
    });
  });

  test('Should add notes (530-534) to notes list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_notes_53x.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(5);
    expect(response[0].isValid).toBeTruthy();
    // 530$a
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Available on microfiche.'
    });
    // 532$a
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Closed captioning in English.'
    });
    // 533$abcdfn5
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Electronic reproduction. Cambridge, Mass. Harvard College Library Digital Imaging Group, 2003 (Latin American pamphlet digital project at Harvard University ; 0005). Electronic reproduction from microfilm master negative produced by Harvard College Library Imaging Services. MH'
    });
    // 534$patn
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Originally issued: Frederick, John. Luck. Published in: Argosy, 1919.'
    });
  });

  test('Should add notes (540-546) to notes list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_notes_54x.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(7);
    expect(response[0].isValid).toBeTruthy();
    // 540
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'There are copyright and contractual restrictions applying to the reproduction of most of these recordings; Department of Treasury; Treasury contracts 7-A130 through 39-A179.'
    });
    // 541
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: '5 diaries 25 cubic feet; Merriwether, Stuart; 458 Yonkers Road, Poughkeepsie, NY 12601; Purchase at auction; 19810924; 81-325; Jonathan P. Merriwether Estate; $7,850.'
    });
    // 542
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Duchess Foods Government of Canada Copyright 1963, par la Compagnie Canadienne de l\'Exposition Universelle de 1967 1963 Nov. 2010 Copyright Services, Library and Archives Canada'
    });
    // 544
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Burt Barnes papers; State Historical Society of Wisconsin.'
    });
    // 545
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'The Faribault State School and Hospital provided care, treatment, training, and a variety of other services to mentally retarded individuals and their families. It was operated by the State of Minnesota from 1879 to 1998 under different administrative structures and with different names. A more detailed history of the Hospital may be found at http://www.mnhs.org/library/findaids/80881.html'
    });
    // 546
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Marriage certificate German; Fraktur.'
    });
  });

  test('Should add notes (550-556) to notes list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_notes_55x.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(5);
    expect(response[ 0 ].isValid).toBeTruthy();
    // 550$a
    expect(response[ 0 ].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Organ of the Potomac-side Naturalists\' Club.'
    });
    // 552
    expect(response[ 0 ].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'NYROADS The roads of New York, none unknown irregular.'
    });
    // 555
    expect(response[ 0 ].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Available in repository and on Internet; Folder level control; http://digital.library.pitt.edu/cgi-bin/f/findaid/findaid-idx?type=simple;c=ascead;view=text;subview=outline;didno=US-PPiU-ais196815'
    });
    // 556
    expect(response[ 0 ].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Disaster recovery : a model plan for libraries and information centers. 0959328971'
    });
  });

  test('Should add notes (561-567) to notes list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_notes_56x.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(6);
    expect(response[0].isValid).toBeTruthy();
    // 561$3a
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Family correspondence Originally collected by Henry Fitzhugh, willed to his wife Sarah Jackson Fitzhugh and given by her to her grandson Jonathan Irving Jackson, who collected some further information about his grandmother and the papers of their relatives and Cellarsville neighbors, the Arnold Fitzhugh\'s, before donating the materials along with his own papers as mayor of Cellarsville to the Historical Society.'
    });
    // 562
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'The best get better Sue Hershkowitz'
    });
    // 563
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Gold-tooled morocco binding by Benjamin West, approximately 1840. Uk'
    });
    // 565
    // todo: can't be right, spreadsheet shoduld include subfield 3 i think
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: '11;'
    });
    // 567
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Continuous, deterministic, predictive.'
    });
  });

  test('Should add notes (580-586) to notes list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_notes_58x.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(4);
    expect(response[ 0 ].isValid).toBeTruthy();
    // 580
    expect(response[ 0 ].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Forms part of the Frances Benjamin Johnston Collection.'
    });
    // 583
    expect(response[ 0 ].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'scrapbooks (10 volumes) 1 cu. ft. microfilm 198303 at completion of arrangement 1983 master film schedule Thomas Swing'
    });
    // 586
    expect(response[ 0 ].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Pulitzer prize in music, 2004'
    });
  });

  test('Should add notes (590-599) to notes list', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_notes_59x.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(4);
    expect(response[0].isValid).toBeTruthy();
    // 590$a
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Labels reversed on library\'s copy.'
    });
    // 592$a
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'Copy in McGill Library\'s Osler Library of the History of Medicine, Robertson Collection copy 1: signature on title page, Jos. E. Dion, E.E.M., Montréal.'
    });
    // 599$abcde
    expect(response[0].notes).toContainEqual({
      staffOnly: false,
      instanceNoteTypeId: '9d4fcaa1-b1a5-48ea-b0d1-986839737ad2',
      note: 'c.2 2014 $25.00 pt art dept.'
    });
  });

  test('Failing record', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_notes_failing.xml', 'utf8');

    const response = await sut.convert(data);
    expect.assertions(2);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].title).not.toContain('/');
  });

  test('Should just work. Get record example', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test_get_record.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(2);
    expect(response[0].isValid).toBeTruthy();
    expect(response[0].title).toContain('Rysslands ekonomiska geografi');
  });

  
/*   test('', async () => {
    const data = fs.readFileSync('tests/dataconverter/testdata/test4.xml', 'utf8');

    const response = await sut.convert(data);

    expect.assertions(4);

  }); */
});