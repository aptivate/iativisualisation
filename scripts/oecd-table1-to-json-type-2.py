#!/usr/bin/python
# vim: ts=4:sw=4:expandtab

import logging
logging.basicConfig(level=logging.DEBUG)
from logging import debug

import csv

donor_countries = [
    'Australia',
    'Austria',
    'Belgium',
    'Canada',
    'Chinese Taipei',
    'Czech Republic',
    'Denmark',
    'Finland',
    'France',
    'Germany',
    'Greece',
    'Hungary',
    'Iceland',
    'Ireland',
    'Israel',
    'Italy',
    'Japan',
    'Korea ',
    'Luxembourg',
    'Netherlands',
    'New Zealand',
    'Norway',
    'Poland',
    'Portugal',
    'Slovak Republic',
    'Slovenia',
    'Spain',
    'Sweden',
    'Switzerland',
    'Thailand',
    'Turkey',
    'United Arab Emirates',
    'United Kingdom',
    'United States',
    ]

fund_to_recipient_map = {
    'I.B. ***Memo: Food Aid Through UN': 'UN Food Aid',
    'I.B. ***Memo: Food Aid Through EC': 'EC Food Aid',
    'I.B.1.1. To UN Agencies': 'UN',
    'I.B.1.2. To EU Institutions': 'EU',
    'I.B.1.2. To European Union': 'EU',
    'I.B.1.3. To IDA': 'IDA',
    'I.B.1.4. To AMCs, IBRD, IFC, MIGA ': 'World Bank', # (except IDA)
    'I.B.1.5. To Regional Development Banks': 'Development Banks',
    'I.B.1.6. To GEF': 'GEF',
}

class Transaction:
    donor = property()
    recipient = property()
    trans_type = property()
    amount = property()
    currency = property()

donors = {}

# reader = csv.reader(open('data/TABLE1_Data+FootnotesLegend_56a8dc3d-0ea6-416e-9e77-aa345c17f193.csv', 'rb'),
reader = csv.reader(open('data/TABLE1_Data_f5ea0141-91a3-4a69-a46d-bec649d0afb0.csv', 'rb'),
    delimiter='\t', quotechar='"')

# discard header row
reader.next()

for row in reader:
    # if len(row) < 13:
    #    continue # not a valid row, maybe the Legend at the end?

    donor_name = row[1]
    fund_flows = row[5]
    currency_type = row[7]
    trans_type = row[9]
    year = int(row[10])
    value = row[12]

    if (donor_name.endswith(", Total") or
        donor_name.endswith(",Total")):
        # debug("skipping donor %s" % donor_name)
        continue # skip summary rows

    if (donor_name == "EU Institutions" or donor_name == "Arab Countries"):
        # debug("skipping donor %s" % donor_name)
        continue # not countries

    if donor_name not in donor_countries:
        logging.error("Unknown donor: %s" % donor_name)
        continue

    if year != 2009:
        debug("skipping year %d" % year)
        continue # we only care about 2009

    if trans_type not in fund_to_recipient_map:
        debug("skipping fund: %s" % trans_type)
        continue # only certain transactions are donations to INGOs

    recipient_name = fund_to_recipient_map[trans_type]

    # if flow_type != "Net Disbursements":
    if fund_flows != "Gross Disbursements":
        debug("skipping flow type %s" % fund_flows)
        continue # don't care about other flows

    if currency_type != "Current Prices (USD millions)":
        debug("skipping currency type %s" % currency_type)
        continue # don't care about other currencies or units

    currency = row[9]

    value = int(float(value) * 1000000)

    trans_type = 2

    if not donor_name in donors:
        donors[donor_name] = {}
    
    recips = donors[donor_name]
    
    if recipient_name in recips:
        logging.error("Duplicate row for %s -> %s" % (donor_name, recipient_name))

    if not recipient_name in recips:
        trans = recips[recipient_name] = Transaction()
        trans.donor = donor_name
        trans.recipient = recipient_name
        trans.trans_type = trans_type
        trans.currency = currency
        trans.amount = 0
    
    trans = recips[recipient_name]

    if trans.trans_type != trans_type:
        logging.error("Transaction type for %s and %s changed from %d to %d" %
            (donor_name, recipient_name, trans.trans_type, trans_type))

    if trans.currency != currency:
        logging.error("Transaction currency for %s and %s changed from %s to %s" %
            (donor_name, recipient_name, trans.currency, currency))

    assert trans.donor == donor_name
    assert trans.recipient == recipient_name
    assert trans.trans_type == trans_type
    assert trans.currency == currency
    trans.amount += value
        
transactions = []

for donor_name, recipients in donors.iteritems():
    for trans in recipients.values():
        if trans.amount <= 0:
            continue # skip zero and negative rows

        transactions.append({
            'from': trans.donor,
            'to': trans.recipient,
            'amount': trans.amount,
            'type': trans.trans_type, 
            })

feeds = dict(transactions=transactions)

import json
print json.dumps(feeds, indent=4)
