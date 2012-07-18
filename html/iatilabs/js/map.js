var activities = new Object();

google.load('visualization', '1', {'packages': ['geomap']});
google.setOnLoadCallback(getJSONActivityCounts);

function hideElement(id) {
  var elem = document.getElementById(id);
  elem.style.display = 'none';
}

function showElement(id) {
  var elem = document.getElementById(id);
  elem.style.display = 'block';
}


function getCountryAndActivityData(jsonData) {
  finished = false;

  for (var countryCode in jsonData) {
    for (var donor in jsonData[countryCode]) {
      activityCount = Number(jsonData[countryCode][donor])

      if (activities[countryCode] == undefined) {
        activities[countryCode] = new Object();
        activities[countryCode].dfid = 0;
        activities[countryCode].worldbank = 0;
        activities[countryCode].undp = 0;
      }
      
      // TODO: when more donors are added, make this link to the checkboxes
      if (donor == 'dfid'){
        activities[countryCode].dfid += activityCount;
      }
    }
  }

  finished = true;
}

function getJSONActivityCounts() {
  hideElement('map_canvas');
  hideElement('info');

  $.ajax({
      url: 'cache/activity.json',
      data: {},
      timeout: 10000,	     
      success: getCountryAndActivityData,
      dataType: 'json',
      async: false
    });

  drawMap();
  showElement('map_canvas');
  showElement('info');
  hideElement('loading');
}


function processXmlData(xmlData) {
  var activityNodes = xmlData.getElementsByTagName('iati-activity');

  for (var i = 0; i < activityNodes.length; i++) {
    var activityNode = activityNodes[i];
    var countries = activityNode.getElementsByTagName('recipient-country');

    if (countries.length > 0){
      var countryCode = countries[0].getAttribute('code');

      if (activities[countryCode] == undefined) {
	activities[countryCode] = new Object();
	activities[countryCode].dfid = 0;
	activities[countryCode].worldbank = 0;
	activities[countryCode].undp = 0;
      }

      var orgs = activityNode.getElementsByTagName('reporting-org');

      if (orgs.length > 0 && orgs[0].hasChildNodes()) {
	var reportingOrg = orgs[0].firstChild.data;
	if (reportingOrg == 'Department for International Development'){
	  activities[countryCode].dfid ++;
	}
	else if (reportingOrg == 'World Bank'){
	  activities[countryCode].worldbank ++;
	}
	else if (reportingOrg == 'UNDP'){
	  activities[countryCode].undp ++;
	}
      }
    }
  }
  drawMap();
  showElement('map_canvas');
  showElement('info');
  hideElement('loading');
}

function getXML() {
  hideElement('map_canvas');
  hideElement('info');

  $.ajax({url: '/data?reduced=true',
	     data: '',
	     timeout: 10000,
	     success: processXMLData,
	     dataType: 'xml'});
}

function drawMap() {
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Country');
  data.addColumn('number', 'Activities');

  var showDfid = document.getElementById('dfid').checked;
  var showWorldBank = false;
  var showUndp = false;

  for (var country in activities) {
    if (country != 'NS') {
      var activity = activities[country];
      
      var count = 0;
  
      if (showDfid)
        count += activity.dfid;
      if (showWorldBank)
        count += activity.worldbank;
      if (showUndp)
        count += activity.undp;
      
      data.addRow([getCountryName(country), count]);
    }
  }

  var options = {};
  options['dataMode'] = 'regions';
  options['width'] = '100%';
  options['height'] = '400px';

  var container = document.getElementById('map_canvas');
  var geomap = new google.visualization.GeoMap(container);

  google.visualization.events.addListener(geomap, 'select', selectCountry);

  function selectCountry() {
    tableIndex = geomap.getSelection()[0].row;
    countryName = data.getValue(tableIndex, 0);
    countryCode = getCountryCode(countryName);
    window.location.href = 'labs.html?data=' + registry_api_url +
      '/package/dfid-' + countryCode.toLowerCase();
  }
 
  geomap.draw(data, options);
};
