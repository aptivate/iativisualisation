// var registry_api_url = "http://iatiregistry.org/api/rest";
// to use the proxy, use the following line instead:
var registry_api_url = "/proxy";

var dfid_resource_url = "/dfidproxy/"
// this really loads from http://projects.dfid.gov.uk/iati/Country,
// but that's forbidden by the cross-domain policy
// you might be able to use "http://iatilabs.org/dfidproxy/",
// but that breaks relocation for no benefit.
