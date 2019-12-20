var rp = require("request-promise");
var util = require("util");
module.exports = class LibrisCommunicator {
  getDataById(id) {
    return new Promise((resolve, reject) => {
      let url =
        "https://libris.kb.se/api/oaipmh/?verb=GetRecord&identifier=" +
        id +
        "&metadataPrefix=marcxml_includehold_expanded";
      console.log("Fetching record from " + url);
      rp({
        url: url,
        method: "GET"
      })
        .then(value => {
          console.log(`Value from libris: ${value}`);
          resolve([value]);
        })
        .catch(reason => {
          reject(
            new Error("Error when fetching from Libris with id: " + reason)
          );
        });
    });
  }

  getDataByTimestamp(from, until) {
    return new Promise((resolve, reject) => {
      let fromUri =
        "https://libris.kb.se/api/marc_export/?from=%s&until=%s&deleted=ignore&virtualDelete=true";
      Promise.all([
        rp({
          url: util.format(fromUri, from, until),
          method: "POST",
          multipart: [
            {
              "content-type": "raw",
              body: `move240to244=off
f003=SE-LIBR
holdupdate=on
lcsh=off
composestrategy=composelatin1
holddelete=off
authtype=interleaved
isbnhyphenate=off
name=CTHB
locations=Z Za Zl Enll
bibcreate=on
authcreate=on
format=marcxml
longname=Chalmers tekniska högskola
extrafields=Z\:698 ; Za\:698 ; Zl\:698 ; Enll\:698
biblevel=off
issnhyphenate=off
issndehyphenate=off
holdtype=interleaved
holdcreate=on
characterencoding=UTF-8
isbndehyphenate=off
bibupdate=on
efilter=off
move0359=off
authupdate=on
sab=off`
            }
          ]
        })
      ])
        .then(value => {
          resolve(value);
        })
        .catch(reason => {
          reject(
            new Error(
              "Error when fetching from Libris with timestamp: " + reason
            )
          );
        });
    });
  }
};
