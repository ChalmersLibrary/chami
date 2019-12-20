var parseString = require('xml2js').parseString
var contributorTypeIds = require('./contributorTypes.json')
var contributorNameTypeIds = require('./contributorNameTypes.json')
var uuidv4 = require('uuid/v4')

module.exports = class DataConverter {
  // Main entry point for converting Marc to FOLIO. 
  // Takes a list of OAIPMH responses and converts all the data into FOLIO data and merges it into one list.
  convertListWithMarcToFolio(listWithLibrisDataForMultipleSigels) {
    let self = this
    return new Promise(async function (resolve, reject) {
      try {
        let res = [];
        for (var i=0; i<listWithLibrisDataForMultipleSigels.length; i++) {
          let folioData = await self.convertMarcToFolio(listWithLibrisDataForMultipleSigels[i]);
          res = res.concat(folioData);
        }
        resolve(res);
      } catch (err) {
        reject(err);
      }
    })
  }

  convertMarcToFolio(data) {
    let self = this;
    return new Promise((resolve, reject) => {
      // Convert incoming XML to JSON
      parseString(data, function (err, result) {
        if (err) {
          reject(err)
        }

        let jsonFolioRecords = []

        try {
          // Uncomment to see JSON MARC input data
          // console.log(JSON.stringify(result));

          // Convert each record
          let oaipmhObject = result['OAI-PMH']
          if (oaipmhObject.ListRecords && oaipmhObject.ListRecords[0].record) {
            for (var i = 0; i < oaipmhObject.ListRecords[0].record.length; i++) {
              jsonFolioRecords.push(
                self.convertMarcToFolioInventory(oaipmhObject.ListRecords[0].record[i])
              )
            }
          }
        } catch (e) {
          console.log(e.stack)
          // reject('Failed to convert from marc to FOLIO format: ' + e.)
          reject(e)
        }

        // Return Folio Inventory records
        resolve(jsonFolioRecords)
      })
    })
  }

  convertMarcToFolioInventory (outerRecord) {
    let res = {}
    var librisId = outerRecord.header[0].identifier[0]
    res.hrid = librisId.split('/')[3]
    let record = outerRecord.metadata[0].record

    res.id = uuidv4()
    res.title = this.getTitle(record)
    res.instanceTypeId = '2b94c631-fca9-a892-c730-03ee529ffe2c'
    res.source = 'LIBRIS'
    res.edition = this.getSingleSubField(record, '250', 'a')
    // res.extent = this.getSingleSubField(record, "300", "a");
    res.alternativeTitles = this.getAlternativeTitles(record)

    // Contributors

    res.contributors = this.getContributors(record)
    return res
  }
  // TODO: Function assumes one conrib per tag...
  getContributors (record) {
    let specs = [
      { tag: '100', subfields: ['a'], contributorNameTypeId: 'Personal name', contributorTypeId: 'aut' },
      { tag: '110', subfields: ['a'], contributorNameTypeId: 'Corporate name', contributorTypeId: 'aut' },
      { tag: '111', subfields: ['a'], contributorNameTypeId: 'Meeting name', contributorTypeId: 'aut' },
      { tag: '700', subfields: ['a'], contributorNameTypeId: 'Personal name', contributorTypeId: 'aut' },
      { tag: '710', subfields: ['a'], contributorNameTypeId: 'Corporate name', contributorTypeId: 'aut' },
      { tag: '711', subfields: ['a'], contributorNameTypeId: 'Meeting name', contributorTypeId: 'aut' },
      { tag: '720', subfields: ['a'], contributorNameTypeId: 'Personal name', contributorTypeId: 'aut' },
    ];
    let map1 = specs.map(spec => {
      let personName = spec.subfields.map(y => this.getSingleSubField(record, spec.tag, y)).join(' ').trim()
      if (personName.length > 0) {
        return {
          name: personName,
          contributorNameTypeId: contributorNameTypeIds.find(
            x => x.name === spec.contributorNameTypeId
          ).id,
          contributorTypeId: contributorTypeIds.find(x => x.code === spec.contributorTypeId).id
        }
      }
    })
    return map1.filter(x => x !== undefined)

  }

  getAlternativeTitles (record) {
    let spec = [
      { tag: '130', subfields: ['a'] },
      { tag: '222', subfields: ['a'] },
      { tag: '240', subfields: ['a'] },
      { tag: '246', subfields: ['a', 'b'] }
    ]
    let map1 = spec.map(x =>
      x.subfields
        .map(y => this.getSingleSubField(record, x.tag, y))
        .join(' ')
        .trim()
    )
    return map1
  }

  getTitle (record) {
    let mainTitle = this.getSingleSubField(record, '245', 'a')
    let subtitle = this.getSingleSubField(record, '245', 'b')

    if (subtitle.length > 1) {
      mainTitle = mainTitle + ' ' + subtitle
    }

    let remainingSubfields = ['n', 'p']
    let map1 = remainingSubfields.map(x =>
      this.getSingleSubField(record, '245', x)
    )
    let filtered = map1.filter(word => word.length > 1)
    let remaining = filtered.join('. ')
    if (remaining.length > 1) {
      remaining = '. ' + remaining
    }
    return (mainTitle + remaining).trim()
  }

  // Example: record, 245, q, [b,n,p]
  getMultipleSubfields (record, field, mainSubfield, subfields) {
    let mainField = this.getSingleSubField(record, field, mainSubfield)

    let remainingSubfields = subfields
    let map1 = remainingSubfields.map(x =>
      this.getSingleSubField(record, field, x)
    )
    let filtered = map1.filter(word => word.length > 1)
    let remaining = filtered.join('. ')
    if (remaining.length > 1) {
      remaining = '. ' + remaining
    }
    return (mainField + remaining).trim()
  }

  getCallNumber (hrecord) {
    let mainCallNo = this.getSingleSubField(hrecord, '852', 'h')
    let subCallNo = this.getSingleSubField(hrecord, '852', 'l')

    if (subCallNo.length > 1) {
      mainCallNo = mainCallNo + ' ' + subCallNo
    }

    let remainingSubfields = ['c', 'j']
    let map1 = remainingSubfields.map(x =>
      this.getSingleSubField(record, '852', x)
    )
    let filtered = map1.filter(word => word.length > 1)
    let remaining = filtered.join('. ')
    if (remaining.length > 1) {
      remaining = '. ' + remaining
    }
    return (mainCallNo + remaining).trim()
  }

  cleanSubField (subfield) {
    return subfield.replace('/', '').trim()
  }

  getSingleSubField (record, tag, subfield) {
    tag = record[0].datafield.find(item => item['$'].tag === tag)
    if (tag) {
      subfield = tag.subfield.find(item => item['$'].code === subfield)
      if (subfield) {
        return this.cleanSubField(subfield['_'])
      } else {
        return ''
      }
    } else {
      return ''
    }
  }
}
