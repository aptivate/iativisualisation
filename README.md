IATI Visualisation
==================

This is the code required to run the iativisualisation that you can see at http://iatilabs.aptivate.org/

A couple of things to note:

The apache config includes a reverse proxy to a couple of other sites we pull data from. We did this to work around problems we had with cross domain json when jsonp didn't work.

Getting all the data from all the different servers takes too long to do in the javascript in the browser. So we run a python script nightly to build cached data that the javascript can use. The script is scripts/cache-iatiregistry.py and we run it once a day using cron. A recent run took 15 minutes - mostly waiting to download files.
