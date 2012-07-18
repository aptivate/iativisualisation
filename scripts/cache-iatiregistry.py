#!/usr/bin/python
# vi:ts=4 sw=4 expandtab
#
# script to grab json from iatiregistry.org and generate the activity counts

import simplejson as json
import lxml.etree
import logging
import os
import re
import sys
import urllib

# uncomment the following line to enable debug logging:
# logging.basicConfig(level=logging.DEBUG)

api_root = "http://iatiregistry.org/api/rest/package"
cache_dir = os.path.join(os.path.dirname(__file__), '..', 'html', 'iatilabs', 'cache')

# get overall json file, parse it and get list of other files
f = urllib.urlopen(api_root)
source_list = json.load(f)
f.close()

class Flow:
    def getsender(self): return self.__sender
    def setsender(self, value): self.__sender = value
    sender = property(getsender, setsender)
    
    def getsender_country_iso(self): return self.__sender_country_iso
    def setsender_country_iso(self, value): self.__sender_country_iso = value
    sender_country_iso = property(getsender_country_iso, setsender_country_iso)

    def getrecipient(self): return self.__recipient
    def setrecipient(self, value): self.__recipient = value
    recipient = property(getrecipient, setrecipient)
    
    def getrecipient_country_iso(self): return self.__recipient_country_iso
    def setrecipient_country_iso(self, value): self.__recipient_country_iso = value
    recipient_country_iso = property(getrecipient_country_iso, setrecipient_country_iso)
    
    def gettype(self): return self.__type
    def settype(self, value): self.__type = value
    type = property(gettype, settype)
    
    def getamount(self): return self.__amount
    def setamount(self, value): self.__amount = value
    amount = property(getamount, setamount)

country_iso_to_shortname = {
    'CD': 'DR Congo',
    }

ngo_id_to_shortname = {
    10000: 'Public Sector', # PUBLIC SECTOR INSTITUTIONS
    # 12000: None, # => 'Other Country', e.g. NULL GB-1-201012-105
    20000: 'Other Multilateral', # NON-GOVERNMENTAL ORGANISATIONS (NGOs) AND CIVIL SOCIETY
    21000: 'Other Multilateral',
    21005: 'CUTS', # Consumer Unity and Trust Society International
    21016: 'ICRC', # International Committee of the Red Cross
    21017: 'ICTSD', # International Centre for Trade and Sustainable Development
    21023: 'IPPF',
    21039: 'IISD', # International Institute for Sustainable Development
    21049: 'ECDPM', # European Centre for Development Policy Management
    22000: 'Other Multilateral',
    23000: 'Other Multilateral', # Developing country-based NGO
    30005: 'IAVI', # International AIDS Vaccine Initiative
    30111: 'IUCN',
    41000: 'UN', # United Nations agency, fund or commission (UN)
    41104: 'ECLAC', # Economic Commission for Latin America and the Caribbean (UN)
    41108: 'IFAD', # International Fund for Agricultural Development
    41110: 'UNAIDS', # Joint United Nations Programme on HIV/AIDS
    41114: 'UNDP',
    41116: 'UNEP', # United Nations Environment Programme
    41119: 'UNFPA', # United Nations Population Fund
    41121: 'UNHCR', # Office of the United Nations High Commissioner for Refugees
    41122: 'UNICEF', # United Nations Children's Fund
    41124: 'UN WOMEN', # United Nations Development Fund for Women, ZZ
    41127: 'UNOCHA',
    41128: 'UNODC', # United Nations Office on Drugs and Crime
    41130: 'UNRWA', # United Nations Relief and Works Agency for Palestine Refugees in the Near East
    41143: 'WHO', # World Health Organisation - core voluntary contributions account
    41302: 'ILO', # International Labour Organisation - Assessed Contributions
    41304: 'UNESCO', # United Nations Educational, Scientific and Cultural Organisation
    41316: 'UNFCCC', # United Nations Framework Convention on Climate Change
    42003: 'EC', # European Commission - European Development Fund
    42004: 'EIB', # European Investment Bank (interest subsidies only), e.g. ZZ GB-1-110656-109
    43000: 'IMF', # International Monetary Fund (IMF)
    44000: 'World Bank',
    44001: 'World Bank IBRD',
    44002: 'IDA', # International Development Association
    44003: 'World Bank IDA',
    47034: 'ECOWAS', # Economic Community of West African States
    47044: 'GEF', # Global Environment Facility Trust Fund
    47045: 'GFATM', # Global Fund to Fight AIDS, Tuberculosis and Malaria
    47053: 'ICDDRB', # Centre for Health and Population Research
    47081: 'OECD',
    47107: 'IFFI', # International Finance Facility for Immunisation
    47117: 'NEPAD', # New Partnership for Africas Development
    50000: 'Other Multilateral', # OTHER, e.g. ZZ GB-1-110165-101
    51000: 'Research/Education', # University, college or other teaching institution, research institute or think-tank
    # 52000: None, # => 'Other Country', e.g. NS GB-1-114394-104
    }

# For each file, fetch it, and accumulate the activity count and
# transactions by donor:

activity_counts = {}
donor_recipient_transactions = {}

for i, source in enumerate(source_list):
    if False and re.match(r'^dfid-', source):
        continue

    if False and source != "dfid-ns":
        continue
    
    print "[%d/%d] %s" % (i + 1, len(source_list), source)
    
    f = urllib.urlopen(api_root + '/' + source)
    country_data = json.load(f)
    f.close()
    if 'extras' not in country_data:
        print "Ignored %s: does not contain ['extras']" % source
        continue
    if 'donors' not in country_data['extras']:
        print "Ignored %s: does not contain ['extras']['donors']" % source
        continue
    donors = country_data['extras']['donors']

    missing = False
    
    try:
        activity_count = country_data['extras']['activity_count']
        if isinstance(activity_count, int):
            pass
        elif re.match(r'\d+', activity_count):
            activity_count = int(activity_count)
        else:
            missing = True
    except KeyError:
        missing = True
    
    if missing:    
        print "Ignored file with missing activity count: %s" % source
        continue

    if 'country' not in country_data['extras']:
        print "Ignored %s: does not contain ['extras']['country']" % source
        continue
    country_code = country_data['extras']['country']

    if not activity_counts.has_key(country_code):
        activity_counts[country_code] = {}

    for donor in donors:
        if not activity_counts[country_code].has_key(donor):
            activity_counts[country_code][donor] = activity_count
        else:
            activity_counts[country_code][donor] += activity_count

    download_url = country_data['download_url']

    try:
        xmldb_doc = lxml.etree.parse(download_url)
    except lxml.etree.XMLSyntaxError, e:
        print 'Skipping %s: XML error %s' % (source, e)

    # activities_node = xmldb_doc.getroot().find("./iati-activities")
    # activity_nodes = activities_node.findall("./iati-activity")
    activity_nodes = xmldb_doc.getroot().findall("./iati-activity")
    # transaction_nodes = activities_node.findall("./iati-activity/transaction")
    transaction_nodes = xmldb_doc.getroot().findall("./iati-activity/transaction")
    
    for trans in transaction_nodes:
        type_node = trans.find("transaction-type")
        
        if type_node is None:
            type_node = trans.find("activity-type")
            
        if type_node.get("code") != "C": # Only count commitments
            logging.debug("Ignoring non-commitment transaction: %s" % type_node.text)
            continue

        date_node  = trans.find("transaction-date")
        value_node = trans.find("value")
        value_date = value_node.get("value-date")
        
        if date_node is not None:
            # dfid data: only include the 2010 budget
            if date_node.text != "Budget for financial year 2010":
                logging.debug("Ignoring non-2010 transaction: %s" % date_node.text)
                continue
        elif value_date is not None:
            # HP data: only include transactions in 2010
            if not re.match(r'^2010-', value_node.get("value-date")):
                logging.debug("Ignoring non-2010 transaction: %s" % value_date)
                continue
        else:
            logging.debug("Found no date for transaction: %s" % date_node.text)

        funder_node = trans.find("../participating-org[@role='Funding']")
        # if donor_node is not None:
        #    donor_name = donor_node.text
        sender = funder_node.text.title()
        sender_country_iso = funder_node.get("ref")
        
        # HP foundation
        if re.match(r'^US-EIN-\d+', sender_country_iso): # US-EIN-941655673
            sender_country_iso = 'US'

        recipient_code = None
        recipient_node = trans.find("../recipient-country")
        
        collaboration_type_node = trans.find("../collaboration-type")
        
        if collaboration_type_node is not None:
            collaboration_type = collaboration_type_node.text
        else:
            collaboration_type = None
        
        if (collaboration_type is not None and
            collaboration_type == "Multilateral"):
            recipient_name = None
            recipient_code = "ZZ" # force to Implementing Partner
        elif recipient_node is not None:
            # DFID gives the ISO country code as a "ref" attribute:
            #   <recipient-country code="BA">Bosnia</recipient-country>
            # But HP foundation doesn't:
            #   <recipient-country>Ghana</recipient-country>
            # so for HP, we need to try a lookup in the country list
            
            recipient_country_iso = recipient_node.get("code")
            # if recipient_country_iso is None:
                
            recipient_name = recipient_node.text
            logging.debug("country: %s" % recipient_name)
        else: # try a region
            recipient_country_iso = None # no such thing for regions
            recipient_node = trans.find("../recipient-region")
            if recipient_node is not None:
                m = re.match('(.*) \((.*)\)', recipient_node.text)
                if m is not None: # DFID-specific codes, e.g. Balkan Regional (BL)
                    recipient_code = m.group(2)
                    recipient_name = m.group(1)
                    logging.debug("dfid region: %s (%s)" % (recipient_name, recipient_code))
                else: # OECD DAC region codes, e.g. 189 => North of Sahara, regional
                    recipient_name = recipient_node.text
                    logging.debug("oecd region: %s" % recipient_name)
            else: # not a country or region, set to None, will fill in later
                recipient_name = None

        implementing_partner_node = trans.find("../participating-org[@role='Implementing']")

        # HP uses Flow Types to identify recipient as country or NGO: see
        # http://iaticonsultation.org/codelists/flow_type.html
        
        value = value_node.text
        flow_type_node = trans.find("flow-type")
        
        if flow_type_node is None:
            flow_type_node = trans.find("../default-flow-type")
        
        new_flows = []
        
        # ODA can go to multilaterals too
        if False and flow_type_node is not None:
            flow_type = int(flow_type_node.get("code"))
            if flow_type == 10 or flow_type == 20:
                trans_type = 1 # donor to country
                # recipient_name = trans.find("../recipient-country").text
            else:
                trans_type = 2 # donor to multilateral
                recipient_name = implementing_partner_node.text
                
                if recipient_node is not None:
                    # in this case, we may know where the money is going too,
                    # so create a new flow for that
                    ngo_flow = Flow()
                    ngo_flow.sender = implementing_partner_node.text
                    ngo_flow.sender_country_iso = None
                    ngo_flow.recipient = recipient_node.text
                    ngo_flow.recipient_country_iso = None # could lookup
                    ngo_flow.type = 3 # NGO to country
                    ngo_flow.amount = int(value)
                    new_flows.append(ngo_flow)
        elif recipient_code is not None and recipient_code == "ZZ":
            # DFID multilateral organisations
            trans_type = 2 # donor to multilateral
            if implementing_partner_node is not None:
                recipient_name = implementing_partner_node.text
                ref = int(implementing_partner_node.get("ref"))
                if ref is not None and ref in ngo_id_to_shortname:
                    recipient_name = ngo_id_to_shortname[ref]
                    # this shouldn't be used any more
                    assert recipient_name is not None
            else:
                recipient_name = "Other Multilateral"
            logging.debug("found an ngo: %s" % recipient_name)
            recipient_country_iso = None
        else: # recipient is a country, region, or Other (None)
            trans_type = 1 # donor to country
            if recipient_country_iso in country_iso_to_shortname:
                recipient_name = country_iso_to_shortname[recipient_country_iso]

        if recipient_name is None:
            recipient_name = "Other Country"
            trans_type = 1 # in case it's a conversion from a non-region file
            # via ngo_id_to_shortname
            logging.debug("Adding %s to %s" % (value, recipient_name))
            recipient_country_iso = None
        elif (recipient_name == "Recipient Government" or
            recipient_name == "NON-GOVERNMENTAL ORGANISATIONS (NGOs) AND CIVIL SOCIETY"):
            logging.debug("Adding %s to %s" % (value, recipient_name))

        if (collaboration_type is not None and
            collaboration_type == "Multilateral"):
            logging.debug("Multilateral to %s for %s" % (recipient_name, value))

        new_flow = Flow()
        new_flow.sender = sender
        new_flow.sender_country_iso = sender_country_iso
        new_flow.recipient = recipient_name
        new_flow.recipient_country_iso = recipient_country_iso
        new_flow.type = trans_type
        new_flow.amount = int(value)
        new_flows.append(new_flow)

        for flow in new_flows:
            if not flow.sender in donor_recipient_transactions:
                donor_recipient_transactions[flow.sender] = {}
            
            recips = donor_recipient_transactions[flow.sender]
            
            if flow.recipient in recips:
                old_flow = recips[flow.recipient]

                if old_flow.recipient_country_iso != flow.recipient_country_iso:
                    logging.error("Recipient %s ISO code changed from %s to %s" %
                        (old_flow.recipient, old_flow.recipient_country_iso,
                            flow.recipient_country_iso))

                if old_flow.type != flow.type:
                    logging.error("Flow from %s to %s changed type from %d to %d" %
                        (old_flow.sender, old_flow.recipient_name,
                            old_flow.type, flow.type))
                        
                assert old_flow.sender == flow.sender
                assert old_flow.sender_country_iso == flow.sender_country_iso
                assert old_flow.recipient == flow.recipient
                assert old_flow.recipient_country_iso == flow.recipient_country_iso
                assert old_flow.type == flow.type
                old_flow.amount += flow.amount
            else:
                recips[flow.recipient] = flow

# reorganise into the data structure needed by the javascript

transactions = []

for donor_name, recipients in donor_recipient_transactions.iteritems():
    for trans in recipients.values():
        transactions.append({
            'from': trans.sender,
            'from_iso': trans.sender_country_iso,
            'to': trans.recipient,
            'to_iso': trans.recipient_country_iso,
            'amount': trans.amount,
            'type': trans.type,
            })

feeds = dict(transactions=transactions)

# save as json to, say, cache/activity.json ...
f = open(os.path.join(cache_dir, 'activity.json'), 'w')
json.dump(activity_counts, f, indent=4)
f.close()

f = open(os.path.join(cache_dir, 'dfid.json'), 'w')
json.dump(feeds, f, indent=4)
f.close()

