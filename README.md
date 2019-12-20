# Chami
**Cha**lmers Library **mi**ddleware for transferring bibliographic data from Swedish Union Catalog LIBRIS to library service platform FOLIO.

## What is Chami?
Chami fetches bibliographic records from LIBRIS, transforms them from MARC-XML into Inventory json objects, and posts (or puts) them to FOLIO as Inventory instances. In its current version, Chami uses OAI-PMH for fetching individual records on demand, and LIBRIS' export API to fetch batches of records for specific time intervals.

## How is Chami used at Chalmers?

### Adding or updating new records on demand
With one click, cataloguers can add a new instance from LIBRIS to FOLIO. When the cataloguer is on the page of an isntance record in LIBRIS and clicks the Chami bookmarklet, Chami sends a request to LIBRIS' OAI-PMH server for the record at hand. 

The record is transformed and added to FOLIO (as a new record, or updating an existing one), and the cataloguer is automatically redirected from LIBRIS the new/updated isntance in FOLIO Inventory.

#### Cataloguing with LIBRIS->Chami->FOLIO

![alt text](/pictures/chami_workflow_no_url.gif)

### Scheduled fetching of new/updated records
In order to keep Inventory up to date with changes to bibliographic instancea in LIBRIS, whether made by Chalmers or by any other lirbary in the LIBRIS community, Chami regularly fetches all updates made to LIBRIS isntances with Chalmers holdings. For this, Chami makes a request to the LIBRIS MARC21 export API. 

## How data mapping is done in Chami
TBA

## How to run Chami
### Install NodeJS
Chami is built with NodeJS, so first Install NodeJS using your favourite package manager:   
```choco install nodejs```[Choclatey](https://chocolatey.org/) (Windows)   
```brew install node``` [Homebrew](https://brew.sh) (MacOS)   
Linux users will know what to use.    
   
An alternative is the [official installers](https://nodejs.org/en/download/) as well.   
### Clone this repo
Clone it into your computer. Open up a terminal and get to the root catalog
### Install required packages
run ```npm install```
### runt the tests
run ```npm test```
### start the server
