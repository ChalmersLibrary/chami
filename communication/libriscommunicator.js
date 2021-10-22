const fetch = require("node-fetch");
const xpath = require("xpath");
const dom = require("@xmldom/xmldom").DOMParser;

module.exports = class LibrisCommunicator {

  async getDataById(id) {
    try {
      this.validateId(id);
      const path = `oaipmh/?verb=GetRecord&identifier=${id}&metadataPrefix=marcxml_includehold_expanded`;
      const options = { method: 'GET' };    
      return await this.fetchFromLibris(path, options);
    } catch (error) {
      error.message = `Libris: Failed when fetching with id: ${id} - ${error.message}`;
      throw error;
    }
  }

  async getDataByTimestamp(from, until) {
    try {
      this.validateTimestamps(from, until);
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
      return await this.fetchFromLibris(path, options);
    } catch (error) {
      error.message = `Libris: Failed fetching with timestamp: from ${from} - Until ${until} - ${error.message}`;
      throw error;
    }
  }

  validateId(id) {
    if (typeof id !== 'string' || id.startsWith('https://libris.kb.se/') === false) {
      throw new Error('Invalid id');
    }
  }

  validateTimestamps(from, until) {
    if (this.isValidTimestamp(from) === false || 
        this.isValidTimestamp(until) === false) {
      throw new Error('Invalid timestamp(s)');
    }
  }

  isValidTimestamp(timestamp) {
    if (typeof timestamp !== 'string') {
      return false;
    }
    //https://stackoverflow.com/a/58878432 
    //Valid timestamp: 2020-11-18T08:05:00Z. Does not handle leap years.
    const timestampRegex = new RegExp([
      '^[0-9]{4}-((0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01])|(0[469]|11)',
      '-(0[1-9]|[12][0-9]|30)|(02)-(0[1-9]|[12][0-9]))T(0[0-9]|1[0-9]|2[0-3])',
      ':(0[0-9]|[1-5][0-9]):(0[0-9]|[1-5][0-9])Z$'].join(''));
    return timestampRegex.test(timestamp);
  }

  async fetchFromLibris(path, options) {
    const url = `https://libris.kb.se/api/${path}`;
    const response = await fetch(url, options);
    this.validateResponse(response);
    const data = await response.text();
    this.validateXML(data);
    return data;
  }

  validateResponse(response) {
    if (response.ok === false) {
      throw new Error(`Url: ${response.url}, 
                      Status: ${response.status}, 
                      Message: ${response.statusText}`);
    }
  }

  validateXML(data) {
    const doc = new dom().parseFromString(data);
    const select = xpath.useNamespaces({
      oai: "http://www.openarchives.org/OAI/2.0/",
      marc: "http://www.loc.gov/MARC21/slim"
    });
    const error = select("//oai:error", doc);    
    if (error.length > 0) {
      const value = error[0].attributes[0].nodeValue;
      throw new Error(`XML error - ${value}`);
    }
  }
};
