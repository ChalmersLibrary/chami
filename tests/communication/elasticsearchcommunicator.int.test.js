const Elasticsearchcommunicator = require('../../communication/elasticsearchcommunicator');
const fs = require('fs');

describe('elasticsearchcommunicator unit tests', () => {
  let sut;

  beforeEach(() => {
    const config = fs.readFileSync('config.json');
    process.env = JSON.parse(config);
    sut = new Elasticsearchcommunicator();
  });

  test('index', async () => {
    const data = {
      id: "https://libris.kb.se/9ncjf4kx7mbrs1w0",
      created: '2020-11-18T07:00:00Z',
      success: true,
      message: `Successful fetch with id https://libris.kb.se/9ncjf4kx7mbrs1w0`
    };

    await expect(sut.index(data))
      .resolves
      .not
      .toThrow();
  });

  test('search', async () =>{
    const query = {
      size: 1,
      query: {
        query_string: {
          query: 'success:true && !_exists_:id'
        }
      },
      sort: [{ created: { order: 'desc' }}]
    };
    
    await expect(sut.search(query))
      .resolves
      .not
      .toThrow();
  });

});