describe('foliocommunicator', function () {
  var FolioCommunicator = require('../../communication/foliocommunicator')
  var foliocommunicator
  beforeEach(function () {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
    var fs = require('fs')
    let rawdata = fs.readFileSync('config.json')
    process.env = JSON.parse(rawdata)
    foliocommunicator = new FolioCommunicator()
  })
  it('log in', function () {
    return foliocommunicator.login().then(() => {
      // console.log(global.folioToken)
      expect(global.folioToken).toBeTruthy()
      global.folioToken = undefined
    })
  })

  it('add instance to FOLIO', function (done) {
    let instance = {
      'id': '5e4011a1-609f-4bb3-9bdc-d2a88eb2d637',
      'source': 'MARC',
      'title': 'chami-test',
      'instanceTypeId': 'd5b234e7-5477-4ce1-831d-43dd181246fb',
      'identifiers': [{
        'identifierTypeId': '925c7fb9-0b87-4e16-8713-7f4ea71d854b',
        'value': '1111'
      }]
    }
    return foliocommunicator.sendDataToFolio([ instance ]).then(() => {
      expect(true).toBeTruthy()
      done()
    })
  })
})
