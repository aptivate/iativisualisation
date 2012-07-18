var iatitable = "#iatitable";
var tablexslt = "xslt/record.xslt.xml";
var tabs = "#tabs";
var activityheaderRow = "#iatitable tbody tr:first-child";
var expandbuttons = ".activityexpand";
var expandtext = "+";
var collapsetext = "-";
var expandicon = "images/iatiplus.png";
var collapseicon = "images/iatiminus.png";
var collapseAllButton = ".collapseall";
var expandAllButton = ".expandall";

var defaultQuery = registry_api_url + "/package/dfid-rw";

function loadTableData(){
    $(iatitable).transform({xml:tablexml, xsl:tablexslt});
}

function expand(button){
    button.attr("alt", collapsetext).attr("src",collapseicon).parents('tr').siblings().fadeIn('fast');
}

function collapse(button){
    button.attr("alt", expandtext).attr("src",expandicon).parents('tr').siblings().fadeOut('fast');
}

function collapseAll(){
    collapse($(expandbuttons));
}

function expandAll(){
    expand($(expandbuttons));
}


function toggleActivity(){
    var mode = $(this).attr("alt");
    if (mode == expandtext){
        expand($(this));
    }else{
        collapse($(this));
    }
}

function loadTab(event, ui){
    if ($(ui.tab).find('spa').html()){
        loadTableData();
    }
}



function updateDescription(source, country) {
    var descriptionText = "IATI Data";
    var countryName;
    var sourceName;

    var join = " for " ;
    if ( source != "any" ) {
        sourceName = getSourceName(source);
        if (sourceName == "undefined" || sourceName == "") {
            sourceName = source;
        }
        descriptionText += " for " + sourceName;
        join = " in ";
    }
    if ( country != "any" ) {
        countryName = getCountryName(country.toUpperCase());
        if (countryName == "undefined" || countryName == "") {
            countryName = country;
        }
        descriptionText += join + countryName;
    }
    $('#table_title').html(descriptionText);
}

function getSource(queryString) {
    var pat=/.*\/(\w+)-(\w+)/; 
    return queryString.replace(pat, "$1");
}


function getCountry(queryString) {
    var pat=/.*\/(\w+)-(\w+)/; 
    return queryString.replace(pat, "$2");
}

function extractXmlFromJson(jsonData) {
  tablexml = jsonData.download_url;
  var pat=/.*\/([A-Z]{2})/;
  countrycode = tablexml.replace(pat, "$1");
  tablexml = dfid_resource_url + countrycode
}

function findXmlFromJson(jsonpath) {
  // get the json from iatiregistry, and extract the download url
  var jqxht = $.ajax(
    {
      url: jsonpath,
      data: {},
      timeout: 10000,
      success: extractXmlFromJson,
      dataType: 'json',
      cache: true,
      async: false
    });
  // IE expects XML and will barf if it is json, so catch that here
  if (jqxht.status == 200) {
    extractXmlFromJson(jQuery.parseJSON(jqxht.responseText));
  }
}


$(function(){
    $(tabs).tabs({ fx: { opacity: 'toggle'}});
    $(tabs).bind('tabsload', loadTab);
    $(collapseAllButton).click(collapseAll);
    $(expandAllButton).click(expandAll);
    $(expandbuttons).live('click',toggleActivity);
    table_meta_json = $.query.get('data');
    if (table_meta_json == "") {
        table_meta_json = defaultQuery;
    }
    findXmlFromJson(table_meta_json);
    loadTableData();
    updateDescription(getSource(table_meta_json), getCountry(table_meta_json));
});
