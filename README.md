# Chami
**Cha**lmers Library **mi**ddleware for FOLIO

##What is Chami?

Chami fetches bibliographic records from Swedish Union Catalog LIBRIS, transforms them from MARC-XML into Inventory json objects, and posts (or puts) them to FOLIO as Inventory instances. In its current version, Chami uses OAI-PMH for fetching individual records on demand, and LIBRIS' export API to fetch batches od records for specific time intervals.

##How is Chami used at Chalmers?
###Adding or updating new record on demand
With one click, cataloguers can add a new instance from LIBRIS to FOLIO. When the cataloguer is on the page of an isntance record in LIBRIS and clicks the Chami bookmarklet, Chami sends a request to LIBRIS' OAI-PMH server for the record at hand. 

The record is transformed and added to FOLIO (as a new record, or updating an existing one), and the cataloguer is automatically redirected from LIBRIS the new/updated isntance in FOLIO Inventory.

####Demo
![alt text](/pictures/chami_workflow_no_url.gif) "Demo of cataloguing workflow")

###Scheduled fetching of updated records
In order to keep Inventory up to date with changes to bibliographic instancea in LIBRIS, whether made by Chalmers or by any other lirbary in the LIBRIS community, Chami regularly fetches all updates made to LIBRIS isntances with Chalmers holdings. For this, Chami makes a request to the LIBRIS MARC21 export API. 
