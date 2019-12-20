const S = require("string");
const uuidv4 = require("uuid/v4");
const bibLangs = require("langs");
const contributorTypeIds = require("./contributorTypes.json");
var marc4js = require("marc4js");

// initialize json schema validation
const Ajv = require("Ajv");
const ajv = new Ajv({ schemaId: "id", allErrors: true });
ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"));
const schema = require("../schemas/instance.json");

// transformer
let transformer = marc4js.transform({ toFormat: "xml" });
let output = "";
transformer.on("data", function(chunk) {
  output += chunk;
});
transformer.on("error", function(err) {
  console.log(err.message);
});
transformer.on("end", function() {
  console.log(output);
});

module.exports = class Inventory {
  constructor(record, options = {}) {
    this.errors = [];
    this.isValid = false;

    // options
    if (options.source) {
      this.setSource(options.source);
    }

    if (options.hrid) {
      this.hrid = options.hrid;
    }

    this.record = record; // marc bib record
    this.id = uuidv4();

    this.title = this.setTitle();
    this.instanceTypeId = this.setInstanceTypeId();
    this.modeOfIssuanceId = this.setModeOfIssuanceId();
    this.statisticalCodeIds = ["55326d56-4466-43d7-83ed-73ffd4d4221f"];
    this.indexTitle = this.setIndexTitle();
    this.identifiers = this.setIdentifiers(options);
    this.alternativeTitles = this.setAlternativeTitles();
    this.languages = this.setLanguages();
    this.editions = this.setEditions();
    this.series = this.setSeries();
    this.contributors = this.setContributors();
    this.physicalDescriptions = this.setPhysicalDescriptions();
    this.classifications = this.setClassifications();
    this.subjects = this.setSubjects();
    this.publication = this.setPublication();
    this.publicationFrequency = this.setPublicationFrequency();
    this.publicationRange = this.setPublicationRange();
    this.notes = this.setNotes();
    this.instanceFormatIds = ["8d511d33-5e85-4c5d-9bce-6e3c9cd0c324"];
    // schema validation
    this.validate();
  }

  toJSON() {
    return {
      id: this.id,
      hrid: this.hrid,
      instanceTypeId: this.instanceTypeId,
      modeOfIssuanceId: this.modeOfIssuanceId,
      source: this.source,
      instanceTypeId: this.instanceTypeId,
      title: this.title,
      indexTitle: this.indexTitle,
      alternativeTitles: this.alternativeTitles,
      identifiers: this.identifiers,
      editions: this.editions,
      series: this.series,
      languages: this.languages,
      contributors: this.contributors,
      physicalDescriptions: this.physicalDescriptions,
      classifications: this.classifications,
      subjects: this.subjects,
      publication: this.publication,
      publicationFrequency: this.publicationFrequency,
      publicationRange: this.publicationRange,
      notes: this.notes,
      statisticalCodeIds: this.statisticalCodeIds
    };
  }

  setTitle() {
    // // // 245 - title statement
    // let title = this.record.dataFields.filter(dataField => dataField.tag ==='245')[0].findSubfield('a').data;
    // // concat subtitle if any
    // if (this.record.dataFields.filter(dataField => dataField.tag ==='245')[0].findSubfield('b')) {
    //   title += ' ' + this.record.dataFields.filter(dataField => dataField.tag ==='245')[0].findSubfield('b').data;
    // }
    // title = S(title).chompRight(" /").s;
    let composed_title = "";
    let allowed_subfields = ["a", "b", "k", "n", "p"];
    let titles = this.record.dataFields.filter(
      dataField => dataField.tag === "245"
    );
    let title = "";
    if (titles.length > 1) {
      title = titles.reduce(function(a, b) {
        return a.length > b.length ? a : b;
      });
    } else if (titles.length === 1) {
      title = titles[0];
    }
    if (title) {
      title.subfields.forEach(function(subField) {
        if (allowed_subfields.includes(subField.code)) {
          composed_title += subField.data + " ";
        }
      });
    }
    if (composed_title.trim().endsWith("/")) {
      return composed_title
        .trim()
        .slice(0, -1)
        .trim();
    } else {
      return composed_title.trim();
    }
  }

  setIndexTitle() {
    // 245 - title statement
    let trim_chars = this.record.dataFields.filter(
      dataField => dataField.tag === "245"
    )[0]._indicator2;
    return this.title.substr(trim_chars);
  }

  // todo: support specific subfield lists?
  setAlternativeTitles() {
    let alt_titles = [];
    let type_id = "0fe58901-183e-4678-a3aa-0b4751174ba8";
    // 246 - varying form of title
    let var_titles = this.record.dataFields.filter(
      dataField => dataField.tag === "246"
    );
    var_titles.filter(var_title => var_title.findSubfield("a"));
    var_titles.forEach(function(title_node) {
      var alt_title_data = "";
      try {
        alt_title_data += title_node.findSubfield("a").data;
      } catch (error) {
        console.log("246 a data missing:", error);
      }
      if (title_node.findSubfield("b")) {
        alt_title_data += " - " + title_node.findSubfield("b").data;
      }
      alt_titles.push({
        alternativeTitleTypeId: type_id,
        alternativeTitle: alt_title_data
      });
    });

    // 247 - former title
    let former_titles = this.record.dataFields.filter(
      dataField => dataField.tag === "247"
    );
    former_titles.filter(var_title => var_title.findSubfield("a"));
    former_titles.forEach(function(title_node) {
      var former_title_data = title_node.findSubfield("a").data;
      if (title_node.findSubfield("b")) {
        former_title_data += " - " + title_node.findSubfield("b").data;
      }
      alt_titles.push({
        alternativeTitleTypeId: type_id,
        alternativeTitle: former_title_data
      });
    });

    // 240 - uniform titles
    let uniform_titles = this.record.dataFields.filter(
      dataField => dataField.tag === "240"
    );
    uniform_titles.filter(uniform_title => uniform_title.findSubfield("a"));
    uniform_titles.forEach(function(title_node) {
      alt_titles.push({
        alternativeTitleTypeId: type_id,
        alternativeTitle: title_node.findSubfield("a").data
      });
    });

    // 222 - key titles
    let key_titles = this.record.dataFields.filter(
      dataField => dataField.tag === "222"
    );
    key_titles.filter(key_title => key_title.findSubfield("a"));
    key_titles.forEach(function(title_node) {
      alt_titles.push({
        alternativeTitleTypeId: type_id,
        alternativeTitle: title_node.findSubfield("a").data
      });
    });

    // 130 - main entry - uniform titles
    let main_entry_titles = this.record.dataFields.filter(
      dataField => dataField.tag === "130"
    );
    main_entry_titles.filter(key_title => key_title.findSubfield("a"));
    main_entry_titles.forEach(function(title_node) {
      alt_titles.push({
        alternativeTitleTypeId: type_id,
        alternativeTitle: title_node.findSubfield("a").data
      });
    });

    return alt_titles;
  }

  setInstanceTypeId() {
    switch (this.record.leader._typeOfRecord) {
      case "a":
        return "6312d172-f0cf-40f6-b27d-9fa8feaf332f";
      case "m":
        return "6312d172-f0cf-40f6-b27d-9fa8feaf332f";
      case "t":
        return "6312d172-f0cf-40f6-b27d-9fa8feaf332f";
      case "e":
        return "526aa04d-9289-4511-8866-349299592c18";
      case "g":
        return "225faa14-f9bf-4ecd-990d-69433c912434";
      case "i":
        return "9bce18bd-45bf-4949-8fa8-63163e4b7d7f";
      case "p":
        return "a2c91e87-6bab-44d6-8adb-1fd02481fc4f";
      default:
        return "d5b234e7-5477-4ce1-831d-43dd181246fb";
    }
  }

  setModeOfIssuanceId() {
    switch (this.record.leader.implDefined1[0]) {
      case "m":
        return "9d18a02f-5897-4c31-9106-c9abb5c7ae8b";
      case "s":
        return "068b5344-e2a6-40df-9186-1829e13cd344";
      default:
        return "612bbd3d-c16b-4bfb-8517-2afafc60204a";
    }
  }

  setEditions() {
    let editions = [];
    let edition_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "250"
    );
    edition_nodes.filter(edition_node => edition_node.findSubfield("a"));
    edition_nodes.forEach(function(edition_node) {
      editions.push(edition_node.findSubfield("a").data);
    });
    return this.removeDups(editions);
  }

  setPhysicalDescriptions() {
    let extents = [];
    let subfields = ["a", "b", "c", "e"];
    let nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "300"
    );
    nodes.forEach(function(node) {
      let composed_extent = "";
      node.subfields.forEach(function(subField) {
        if (subfields.includes(subField.code)) {
          composed_extent += subField.data + " ";
        }
      });
      extents.push(composed_extent.trim());
    });
    return this.removeDups(extents);
  }

  // SERIES
  setSeries() {
    let series_800 = this.getFolioSeriesList({
      tag: "800",
      subfields: ["a", "c", "d", "q", "t", "k", "l", "f"]
    });
    let series_810 = this.getFolioSeriesList({
      tag: "810",
      subfields: ["a", "b", "c", "d", "k", "n", "p", "l", "t", "v"]
    });
    let series_811 = this.getFolioSeriesList({
      tag: "811",
      subfields: ["a", "c", "d", "e", "n", "p", "t", "v"]
    });
    let series_830 = this.getFolioSeriesList({
      tag: "830",
      subfields: ["a", "n", "p", "v"]
    });
    let series_490 = this.getFolioSeriesList({
      tag: "490",
      subfields: ["a", "v"]
    });
    let series_440 = this.getFolioSeriesList({
      tag: "440",
      subfields: ["a", "n", "p", "v"]
    });
    // return merged and deduped list
    let series = [];
    return this.removeDups(
      series.concat(
        series_800,
        series_810,
        series_811,
        series_830,
        series_490,
        series_440
      )
    );
  }

  setIdentifiers(options) {
    let identifiers = [];
    // Special case for Swedish Union catalog ID
    if (options.librisId) {
      // uri version
      identifiers.push({
        value: options.librisId,
        identifierTypeId: "925c7fb9-0b87-4e16-8713-7f4ea71d854b"
      });
      // Short version
      identifiers.push({
        value: options.librisId.replace("https://libris.kb.se/", ""),
        identifierTypeId: "4f3c4c2c-8b04-4b54-9129-f732f1eb3e14"
      });
    }
    // Special case for Swedish Union catalog legacy ID
    //
    // Why is librisBibId not used to set the bibId instead of fetching it again from 001?
    // Lari & Lisa 2019-11-12
    //
    if (options.librisBibId) {
      // uri version
      if (!options.librisId) {
        identifiers.push({
          value: options.librisBibId,
          identifierTypeId: "925c7fb9-0b87-4e16-8713-7f4ea71d854b"
        });
      }
      let system_number = this.record.controlFields.filter(
        dataField => dataField.tag === "001"
      )[0].data;
      if (!isNaN(system_number)) {
        // Short version of legacy ID
        identifiers.push({
          value: system_number,
          identifierTypeId: "28c170c6-3194-4cff-bfb2-ee9525205cf7"
        });
      }
    } else {
      let system_number = this.record.controlFields.filter(
        dataField => dataField.tag === "001"
      )[0].data;
      if (!isNaN(system_number)) {
        // Short version of legacy ID
        identifiers.push({
          value: system_number,
          identifierTypeId: "28c170c6-3194-4cff-bfb2-ee9525205cf7"
        });
      }
    }
    // LCCN (010)
    let lccn_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "010"
    );
    lccn_nodes.forEach(function(node) {
      // VALID (a)
      if (node.findSubfield("a")) {
        identifiers.push({
          value: node.findSubfield("a").data,
          identifierTypeId: "c858e4f2-2b6b-4385-842b-60732ee14abb"
        });
      }
    });

    // ISBN (020)
    // todo: identifierTypeIds
    let isbn_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "020"
    );
    isbn_nodes.forEach(function(isbn_node) {
      // VALID (a)
      if (isbn_node.findSubfield("a")) {
        identifiers.push({
          value: isbn_node.findSubfield("a").data,
          identifierTypeId: "8261054f-be78-422d-bd51-4ed9f33c3422"
        });
      }
      // CANCELED/INVALID (z)
      let canceled_isbns = isbn_node.findSubfields("z");
      canceled_isbns.forEach(function(node) {
        identifiers.push({
          value: node.data,
          identifierTypeId: "fcca2643-406a-482a-b760-7a7f8aec640e"
        });
      });
    });

    // ISSN (022)
    // todo: identifierTypeIds
    let issn_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "022"
    );
    issn_nodes.forEach(function(issn_node) {
      // VALID (a)
      if (issn_node.findSubfield("a")) {
        identifiers.push({
          value: issn_node.findSubfield("a").data,
          identifierTypeId: "913300b2-03ed-469a-8179-c1092c991227"
        });
      }
      // INVALID (z)
      let invalid_issns = issn_node.findSubfields("z");
      invalid_issns.forEach(function(node) {
        identifiers.push({
          value: node.data,
          identifierTypeId: "27fd35a6-b8f6-41f2-aa0e-9c663ceb250c"
        });
      });
      // INCORRECT (y)
      let incorrect_issns = issn_node.findSubfields("y");
      incorrect_issns.forEach(function(node) {
        identifiers.push({
          value: node.data,
          identifierTypeId: "27fd35a6-b8f6-41f2-aa0e-9c663ceb250c"
        });
      });
      // CANCELED (m)
      let canceled_issns = issn_node.findSubfields("m");
      canceled_issns.forEach(function(node) {
        identifiers.push({
          value: node.data,
          identifierTypeId: "27fd35a6-b8f6-41f2-aa0e-9c663ceb250c"
        });
      });
      // LINKING (l)
      let linking_issns = issn_node.findSubfields("l");
      linking_issns.forEach(function(node) {
        identifiers.push({
          value: node.data,
          identifierTypeId: "5860f255-a27f-4916-a830-262aa900a6b9"
        });
      });
    });

    // OTHER STANDARD (024)
    // todo: identifierTypeIds
    let other_identifier_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "024"
    );
    other_identifier_nodes.forEach(function(node) {
      // VALID (a)
      if (node.findSubfield("a")) {
        identifiers.push({
          value: node.findSubfield("a").data,
          identifierTypeId: "2e8b3b6c-0e7d-4e48-bca2-b0b23b376af5"
        });
      }
    });

    // PUBLISHER (028)
    // todo: identifierTypeIds
    let publisher_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "028"
    );
    publisher_nodes.forEach(function(node) {
      // VALID (a)
      if (node.findSubfield("a")) {
        identifiers.push({
          value: node.findSubfield("a").data,
          identifierTypeId: "b5d8cdc4-9441-487c-90cf-0c7ec97728eb"
        });
      }
    });

    // SYSTEM CONTROL (035)
    // todo: identifierTypeIds
    let sys_control_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "035"
    );
    sys_control_nodes.forEach(function(sys_control_node) {
      // VALID (a)
      if (sys_control_node.findSubfield("a")) {
        identifiers.push({
          value: sys_control_node.findSubfield("a").data,
          identifierTypeId: "7e591197-f335-4afb-bc6d-a6d76ca3bace"
        });
      }
      // CANCELED (z)
      let canceled_sys_control_nodes = sys_control_node.findSubfields("z");
      canceled_sys_control_nodes.forEach(function(sys_control_node) {
        identifiers.push({
          value: sys_control_node.data,
          identifierTypeId: "2e8b3b6c-0e7d-4e48-bca2-b0b23b376af5"
        });
      });
    });
    // OCLC CONTROL NUMBER CROSS-REFERENCE (019)
    // todo: identifierTypeIds
    let oclc_control_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "019"
    );
    oclc_control_nodes.forEach(function(cross_ref_node) {
      // VALID (a) - can have multiple (https://www.oclc.org/bibformats/en/0xx/019.html)
      let valid_cross_ref_numbers = cross_ref_node.findSubfields("a");
      valid_cross_ref_numbers.forEach(function(node) {
        identifiers.push({
          value: node.data,
          identifierTypeId: "2e8b3b6c-0e7d-4e48-bca2-b0b23b376af5"
        });
      });
    });

    // GPO ITEM NUMBER (074)
    // todo: identifierTypeIds
    let gpo_item_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "074"
    );
    gpo_item_nodes.forEach(function(gpo_node) {
      // VALID (a)
      if (gpo_node.findSubfield("a")) {
        identifiers.push({
          value: gpo_node.findSubfield("a").data,
          identifierTypeId: "gpo-item-number-identifier"
        });
      }
      // CANCELED (z)
      let canceled_gpo = gpo_node.findSubfields("z");
      canceled_gpo.forEach(function(node) {
        identifiers.push({
          value: node.data,
          identifierTypeId: "canceled-gpo-item-number-identifier"
        });
      });
    });

    return identifiers;
  }

  // LANGUAGES
  setLanguages() {
    let self = this;
    let langs = [];
    let skipLangs = ["###", "zxx"];
    // 041
    let lang_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "041"
    );
    if (lang_nodes.length > 0) {
      lang_nodes.forEach(function(lang_node) {
        let lang_node_a = lang_node.findSubfields("a");
        lang_node_a.forEach(function(node) {
          if (!skipLangs.includes(node.data) && bibLangs.has("2B", node.data)) {
            langs.push(node.data);
          } else {
            self.errors.push("Language (041) not added: " + node.data);
          }
        });
      });
      // 008
    } else {
      let fixed_length_node = this.record.controlFields.filter(
        controlField => controlField.tag === "008"
      );
      if (fixed_length_node.length > 0) {
        let langCode = fixed_length_node[0].data.substr(35, 3);
        if (!skipLangs.includes(langCode) && bibLangs.has("2B", langCode)) {
          langs.push(langCode);
        } else {
          self.errors.push("Language (008) not added: " + langCode);
        }
      }
    }
    return langs;
  }

  // CONTRIBUTORS
  setContributors() {
    // 100 - PERSONAL NAME
    let contribs_100 = this.getFolioContributorsList({
      tag: "100",
      subfields: ["a", "b", "c", "d", "q"],
      contributorNameTypeId: "2b94c631-fca9-4892-a730-03ee529ffe2a"
    });
    // 700 - PERSONAL NAME
    let contribs_700 = this.getFolioContributorsList({
      tag: "700",
      subfields: ["a", "b", "c", "d", "q"],
      contributorNameTypeId: "2b94c631-fca9-4892-a730-03ee529ffe2a"
    });
    // 110 - CORPORATE NAME
    let contribs_110 = this.getFolioContributorsList({
      tag: "110",
      subfields: ["a", "b", "c", "d", "n"],
      contributorNameTypeId: "f5bda109-a719-4f72-b797-b9c22f45e4e1"
    });
    // 710 - CORPORATE NAME
    let contribs_710 = this.getFolioContributorsList({
      tag: "710",
      subfields: ["a", "b", "c", "d", "n"],
      contributorNameTypeId: "f5bda109-a719-4f72-b797-b9c22f45e4e1"
    });
    // 111 - MEETING NAME
    let contribs_111 = this.getFolioContributorsList({
      tag: "111",
      subfields: ["a", "b", "c", "d"],
      contributorNameTypeId: "e8b311a6-3b21-43f2-a269-dd9310cb2d0a"
    });
    // console.log(contribs_111);
    // 711 - MEETING NAME
    let contribs_711 = this.getFolioContributorsList({
      tag: "711",
      subfields: ["a", "b", "c", "d"],
      contributorNameTypeId: "e8b311a6-3b21-43f2-a269-dd9310cb2d0a"
    });
    // merge and return list
    let contribs = [];
    return contribs.concat(
      contribs_100,
      contribs_700,
      contribs_110,
      contribs_710,
      contribs_111,
      contribs_711
    );
  }

  // CLASSIFICATION
  setClassifications() {
    let classifications = [];
    // Library of Congress - 050
    let subfields_050 = ["a", "b"];
    let loc_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "050"
    );
    loc_nodes.forEach(function(node) {
      let composed = "";
      node.subfields.forEach(function(subField) {
        if (subfields_050.includes(subField.code)) {
          composed += subField.data + " ";
        }
      });
      classifications.push({
        classificationNumber: composed.trim(),
        classificationTypeId: "ce176ace-a53e-4b4d-aa89-725ed7b2edac"
      });
    });
    // Dewey Decimal - 082
    let subfields_082 = ["a"];
    let dewey_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "082"
    );
    dewey_nodes.forEach(function(node) {
      let composed = "";
      node.subfields.forEach(function(subField) {
        if (subfields_082.includes(subField.code)) {
          composed += subField.data + " ";
        }
      });
      classifications.push({
        classificationNumber: composed.trim(),
        classificationTypeId: "42471af9-7d25-4f3a-bf78-60d29dcf463b"
      });
    });
    // SUDOC - 086
    // todo: get classificationTypeId for SUDOCs
    let subfields_086 = ["a"];
    let sudoc_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "086"
    );
    sudoc_nodes.forEach(function(node) {
      let composed = "";
      node.subfields.forEach(function(subField) {
        if (subfields_086.includes(subField.code)) {
          composed += subField.data + " ";
        }
      });
      classifications.push({
        classificationNumber: composed.trim(),
        classificationTypeId: "sudoc-identifier"
      });
    });
    // Library of Congress (local) - 090
    let subfields_090 = ["a", "b"];
    let loc_local_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "090"
    );
    loc_local_nodes.forEach(function(node) {
      let composed = "";
      node.subfields.forEach(function(subField) {
        if (subfields_090.includes(subField.code)) {
          composed += subField.data + " ";
        }
      });
      classifications.push({
        classificationNumber: composed.trim(),
        classificationTypeId: "ce176ace-a53e-4b4d-aa89-725ed7b2edac"
      });
    });
    return classifications;
  }

  // SUBJECTS
  setSubjects() {
    // PERSONAL 600
    let subjects_600 = this.getFolioStringList({
      tag: "600",
      subfields: ["a", "b", "c", "d", "q"]
    });
    // CORPORATE 610
    let subjects_610 = this.getFolioStringList({
      tag: "610",
      subfields: ["a", "b", "c", "d", "n"]
    });
    // MEETING 611
    let meetings_611 = this.getFolioStringList({
      tag: "611",
      subfields: ["a", "c", "d", "e"]
    });
    // UNIFORM TITLE 630
    let uniform_title_630 = this.getFolioStringList({
      tag: "630",
      subfields: ["a", "d", "f", "h", "k", "l", "s", "t"]
    });
    // EVENT 647
    let event_647 = this.getFolioStringList({
      tag: "647",
      subfields: ["a", "c", "d", "v", "x", "y", "z"]
    });
    // CHRONOLOGICAL 648
    let chrono_648 = this.getFolioStringList({
      tag: "648",
      subfields: ["a", "v", "x", "y", "z"]
    });
    // TOPICAL 650
    let topical_650 = this.getFolioStringList({
      tag: "650",
      subfields: ["a", "b", "c", "d", "v", "x", "y", "z"]
    });
    // GEOGRAPHICAL 651
    let geo_651 = this.getFolioStringList({
      tag: "651",
      subfields: ["a", "v", "x", "y", "z"]
    });

    // Swedish(?) 653
    let subjects_653 = this.getFolioStringList({
      tag: "653",
      subfields: ["a"]
    });

    // Swedish(?) 655
    let subjects_655 = this.getFolioStringList({
      tag: "655",
      subfields: ["a", "b", "c", "v", "x", "y", "z"]
    });
    let subjects = [];
    return this.removeDups(
      subjects.concat(
        subjects_600,
        subjects_610,
        meetings_611,
        uniform_title_630,
        event_647,
        chrono_648,
        topical_650,
        geo_651,
        subjects_653,
        subjects_655
      )
    );
  }

  // NOTES
  setNotes() {
    let notes = [];
    // GENERAL - 500
    let notes_500 = this.getFolioStringList({
      tag: "500",
      subfields: ["a", "3", "5"]
    });
    // WITH NOTE - 501
    let notes_501 = this.getFolioStringList({
      tag: "501",
      subfields: ["a", "5"]
    });
    // DISSERTATION - 502
    let notes_502 = this.getFolioStringList({
      tag: "502",
      subfields: ["a", "b", "c", "d"]
    });
    // BIBLIOGRAPHY - 504
    let notes_504 = this.getFolioStringList({
      tag: "504",
      subfields: ["a", "b"]
    });
    // FORMATTED - 505
    let notes_505 = this.getFolioStringList({
      tag: "505",
      subfields: ["a", "g", "r", "t"]
    });
    // RESTRICTED ACCESS - 506
    let notes_506 = this.getFolioStringList({ tag: "506", subfields: ["a"] });
    // SCALE - 507
    let notes_507 = this.getFolioStringList({
      tag: "507",
      subfields: ["a", "b"]
    });
    // CREATION - 508
    let notes_508 = this.getFolioStringList({ tag: "508", subfields: ["a"] });
    // REFERENCES - 510
    let notes_510 = this.getFolioStringList({
      tag: "510",
      subfields: ["a", "b", "c", "x"]
    });
    // PERFORMER - 511
    let notes_511 = this.getFolioStringList({ tag: "511", subfields: ["a"] });
    // TYPE OF REPORT/PERIOD COVERED - 513
    let notes_513 = this.getFolioStringList({
      tag: "513",
      subfields: ["a", "b"]
    });
    // DATA QUALITY - 514
    let notes_514 = this.getFolioStringList({
      tag: "514",
      subfields: ["a", "c", "d", "e", "g", "h", "z"]
    });
    // NUMBERING - 515
    let notes_515 = this.getFolioStringList({ tag: "515", subfields: ["a"] });
    // TYPE OF COMPUTER FILE - 516
    let notes_516 = this.getFolioStringList({ tag: "516", subfields: ["a"] });
    // EVENT DATE, TIME, PLACE - 518
    let notes_518 = this.getFolioStringList({
      tag: "518",
      subfields: ["3", "a", "d", "o", "p"]
    });
    // SUMMARY - 520
    let notes_520 = this.getFolioStringList({
      tag: "520",
      subfields: ["3", "a", "b", "c"]
    });
    // GEOGRAPHIC - 522
    let notes_522 = this.getFolioStringList({ tag: "522", subfields: ["a"] });
    // PREFERRED CITATION - 524
    let notes_524 = this.getFolioStringList({ tag: "524", subfields: ["a"] });
    // SUPPLEMENT - 525
    let notes_525 = this.getFolioStringList({ tag: "525", subfields: ["a"] });
    // ADDITIONAL PHYSICAL FORM - 530
    let notes_530 = this.getFolioStringList({ tag: "530", subfields: ["a"] });
    // ACCESSIBILITY - 532
    let notes_532 = this.getFolioStringList({ tag: "532", subfields: ["a"] });
    // REPRODUCTION - 533
    let notes_533 = this.getFolioStringList({
      tag: "533",
      subfields: ["a", "b", "c", "d", "e", "f", "m", "n", "3", "5"]
    });
    // ORIGINAL VERSION - 534
    let notes_534 = this.getFolioStringList({
      tag: "534",
      subfields: [
        "a",
        "b",
        "c",
        "e",
        "f",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "t",
        "x",
        "z",
        "3"
      ]
    });
    // TERMS GOVERNING USE - 540
    let notes_540 = this.getFolioStringList({
      tag: "540",
      subfields: ["a", "b", "c", "d", "u", "5"]
    });
    // SOURCE OF ACQUISITION - 541
    let notes_541 = this.getFolioStringList({
      tag: "541",
      subfields: ["3", "a", "b", "c", "d", "e", "f", "h", "n", "o", "5"]
    });
    // COPYRIGHT STATUS - 542
    let notes_542 = this.getFolioStringList({
      tag: "542",
      subfields: ["a", "b", "c", "d", "n", "g", "f", "o", "s", "u"]
    });
    // Location of Other Archival Materials note - 544
    let notes_544 = this.getFolioStringList({
      tag: "544",
      subfields: ["a", "d"]
    });
    // Biographical or Historical Data - 545
    let notes_545 = this.getFolioStringList({
      tag: "545",
      subfields: ["a", "b", "u"]
    });
    // Language note - 546
    let notes_546 = this.getFolioStringList({
      tag: "546",
      subfields: ["3", "a", "b"]
    });
    // Former Title Complexity note - 547
    let notes_547 = this.getFolioStringList({ tag: "547", subfields: ["a"] });
    // Issuing Body note - 550
    let notes_550 = this.getFolioStringList({ tag: "550", subfields: ["a"] });
    // Entity and Attribute Information note - 552
    let notes_552 = this.getFolioStringList({
      tag: "552",
      subfields: ["a", "b", "l", "m", "n", "z"]
    });
    // Cumulative Index / Finding Aides notes - 555
    let notes_555 = this.getFolioStringList({
      tag: "555",
      subfields: ["a", "b", "c", "d", "u"]
    });
    // Entity and Attribute Information note - 556
    let notes_556 = this.getFolioStringList({
      tag: "556",
      subfields: ["a", "z"]
    });
    // Ownership and Custodial History note- 561
    let notes_561 = this.getFolioStringList({
      tag: "561",
      subfields: ["3", "a", "u", "5"]
    });
    // Copy and Version Identification note - 562
    let notes_562 = this.getFolioStringList({
      tag: "562",
      subfields: ["3", "a", "b", "c", "5"]
    });
    // Binding Information note - 563
    let notes_563 = this.getFolioStringList({
      tag: "563",
      subfields: ["3", "a", "5"]
    });
    // Case File Characteristics note - 565
    let notes_565 = this.getFolioStringList({ tag: "565", subfields: ["a"] });
    // Methodology note - 567
    let notes_567 = this.getFolioStringList({ tag: "567", subfields: ["a"] });
    // Linking Entry Complexity note - 580
    let notes_580 = this.getFolioStringList({ tag: "580", subfields: ["a"] });
    // Action note - 583
    let notes_583 = this.getFolioStringList({
      tag: "583",
      subfields: [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "h",
        "i",
        "j",
        "k",
        "l",
        "n",
        "o",
        "u",
        "x",
        "z",
        "2",
        "3",
        "5"
      ]
    });
    // Awards note - 586
    let notes_586 = this.getFolioStringList({ tag: "586", subfields: ["a"] });

    notes = notes.concat(
      notes_500,
      notes_501,
      notes_502,
      notes_504,
      notes_505,
      notes_506,
      notes_507,
      notes_508,
      notes_510,
      notes_511,
      notes_513,
      notes_514,
      notes_515,
      notes_516,
      notes_518,
      notes_520,
      notes_522,
      notes_524,
      notes_525,
      notes_530,
      notes_532,
      notes_533,
      notes_534,
      notes_540,
      notes_541,
      notes_542,
      notes_544,
      notes_545,
      notes_546,
      notes_547,
      notes_550,
      notes_552,
      notes_555,
      notes_556,
      notes_561,
      notes_562,
      notes_563,
      notes_565,
      notes_567,
      notes_580,
      notes_583,
      notes_586
    );

    // local notes - 590-599, all subfields
    let local_notes;
    for (local_notes = 590; local_notes < 600; local_notes++) {
      notes = notes.concat(
        this.getFolioStringList({ tag: local_notes.toString() })
      );
    }

    return notes.map(n => {
      return {
        staffOnly: false,
        instanceNoteTypeId: "9d4fcaa1-b1a5-48ea-b0d1-986839737ad2",
        note: n
      };
    });
  }

  // PUBLICATIONS
  setPublication() {
    let publications = [];
    let subfields_publisher = ["b"];
    let subfields_place = ["a"];
    let subfields_date = ["c"];

    // 260
    let publisher_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "260"
    );
    publisher_nodes.forEach(function(node) {
      let composed_publisher = "";
      let composed_place = "";
      let composed_date = "";
      node.subfields.forEach(function(subField) {
        if (subfields_publisher.includes(subField.code)) {
          composed_publisher +=
            subField.data.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") + " ";
        }
        if (subfields_place.includes(subField.code)) {
          composed_place +=
            subField.data.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") + " ";
        }
        if (subfields_date.includes(subField.code)) {
          composed_date +=
            subField.data.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") + " ";
        }
      });
      publications.push({
        publisher: composed_publisher.trim(),
        place: composed_place.trim(),
        dateOfPublication: composed_date.trim()
      });
    });

    // 264
    let production_nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "264"
    );
    production_nodes.forEach(function(node) {
      let composed_publisher = "";
      let composed_place = "";
      let composed_date = "";
      node.subfields.forEach(function(subField) {
        if (subfields_publisher.includes(subField.code)) {
          composed_publisher +=
            subField.data.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") + " ";
        }
        if (subfields_place.includes(subField.code)) {
          composed_place +=
            subField.data.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") + " ";
        }
        if (subfields_date.includes(subField.code)) {
          composed_date +=
            subField.data.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") + " ";
        }
      });

      // publication roles
      let publication_role = "";
      switch (node._indicator2) {
        case "0":
          publication_role = "Production";
          break;
        case "1":
          publication_role = "Publication";
          break;
        case "2":
          publication_role = "Distribution";
          break;
        case "3":
          publication_role = "Manufacturer";
          break;
      }

      // add publication object to list
      publications.push({
        publisher: composed_publisher.trim(),
        place: composed_place.trim(),
        dateOfPublication: composed_date.trim(),
        role: publication_role
      });
    });
    return publications;
  }

  // PUBLICATION FREQUENCY
  setPublicationFrequency() {
    let frequency = [];
    let subfields = ["a", "b"];

    // CURRENT - 310
    let nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "310"
    );
    nodes.forEach(function(node) {
      let composed = "";
      node.subfields.forEach(function(subField) {
        if (subfields.includes(subField.code)) {
          composed += subField.data + " ";
        }
      });
      frequency.push(composed.trim());
    });
    // FORMER - 321
    nodes = this.record.dataFields.filter(dataField => dataField.tag === "321");
    nodes.forEach(function(node) {
      let composed = "";
      node.subfields.forEach(function(subField) {
        if (subfields.includes(subField.code)) {
          composed += subField.data + " ";
        }
      });
      frequency.push(composed.trim());
    });
    return this.removeDups(frequency);
  }

  // PUBLICATION RANGE - 362
  setPublicationRange() {
    let range = [];
    let subfields = ["a"];
    let nodes = this.record.dataFields.filter(
      dataField => dataField.tag === "362"
    );
    nodes.forEach(function(node) {
      let composed = "";
      node.subfields.forEach(function(subField) {
        if (subfields.includes(subField.code)) {
          composed += subField.data + " ";
        }
      });
      range.push(composed.trim());
    });
    return this.removeDups(range);
  }

  setSource(source) {
    this.source = source;
  }

  // FOLIO UTILS

  getFolioContributorTypeId(type) {
    let retval = "5daa3848-958c-4dd8-9724-b7ae83a99a27";
    if (typeof type !== "undefined") {
      // find by name
      retval = contributorTypeIds.find(x => x.name.toLowerCase() === type)
        ? contributorTypeIds.find(x => x.name.toLowerCase() === type).id
        : "5daa3848-958c-4dd8-9724-b7ae83a99a27";
      // find by code
      if (retval === "") {
        retval = contributorTypeIds.find(x => x.code === type)
          ? contributorTypeIds.find(x => x.code === type).id
          : "5daa3848-958c-4dd8-9724-b7ae83a99a27";
      }
    }
    return retval;
  }

  getFolioContributorsList(options) {
    let retval = [];
    let self = this;
    let tag = options.tag;
    let subfields = options.subfields;
    let contributorNameTypeId = options.contributorNameTypeId;

    let contribs = this.record.dataFields.filter(
      dataField => dataField.tag === tag
    );
    contribs.forEach(function(node) {
      var composed_node = "";
      var contrib_type_text = "";
      var contrib_identifier = "5daa3848-958c-4dd8-9724-b7ae83a99a27";
      var contrib_type =
        node.findSubfield("e") ||
        node.findSubfield("j") ||
        node.findSubfield("4");
      if (typeof contrib_type !== "undefined") {
        contrib_type = contrib_type.data.replace(
          /[.,\/#!$%\^&\*;:{}=\-_`~()]/g,
          ""
        ); // remove spaces and punctuation
        // console.log('contrib type: ', contrib_type);
        contrib_identifier = self.getFolioContributorTypeId(contrib_type);
        // console.log('contrib id: ', contrib_identifier);
        /* if (contrib_identifier === '') {
          contrib_type_text = contrib_type
        } */
      }
      node.subfields.forEach(function(subField) {
        if (subfields.includes(subField.code)) {
          composed_node += subField.data + " ";
        }
      });
      composed_node = composed_node.trim().replace(/,$/, ""); // remove trailing spaces, comma
      // console.log("contrib id: ", contrib_identifier);
      retval.push({
        contributorNameTypeId: contributorNameTypeId,
        name: composed_node,
        contributorTypeId:
          contrib_identifier || "5daa3848-958c-4dd8-9724-b7ae83a99a27"
        // contributorTypeText: contrib_type_text
      });
    });
    return retval;
  }

  getFolioSeriesList(options) {
    let retval = [];
    let tag = options.tag;
    let subfields = options.subfields;
    let nodes = this.record.dataFields.filter(
      dataField => dataField.tag === tag
    );
    nodes.forEach(function(node) {
      var composed_node = "";
      node.subfields.forEach(function(subField) {
        if (subfields.includes(subField.code)) {
          composed_node += subField.data + " ";
        }
      });
      retval.push(composed_node.trim());
    });
    return retval;
  }

  getFolioStringList(options) {
    let retval = [];
    let tag = options.tag;
    let filter = options.subfields;
    let nodes = this.record.dataFields.filter(
      dataField => dataField.tag === tag
    );
    nodes.forEach(function(node) {
      let composed = "";
      node.subfields.forEach(function(subField) {
        if (filter === undefined || filter.includes(subField.code)) {
          composed += subField.data + " ";
        }
      });
      retval.push(composed.trim());
    });
    return retval;
  }

  validate() {
    this.isValid = true;
    // TODO: Fix validation
    /* this.isValid = ajv.validate(schema, this.toJSON());
    if (!this.isValid) {
      console.log(ajv.errors);
      this.errors.push(ajv.errors);
    } */
  }

  removeDups(list) {
    let unique = {};
    list.forEach(function(i) {
      if (!unique[i]) {
        unique[i] = true;
      }
    });
    return Object.keys(unique);
  }
};
