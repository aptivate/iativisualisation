#!/usr/bin/python
# vi:ts=4 sw=4 expandtab

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

recipient_countries = [
    'Afghanistan',
    'Albania',
    'Algeria',
    'Angola',
    'Anguilla',
    'Antigua and Barbuda',
    'Argentina',
    'Armenia',
    'Azerbaijan',
    'Bangladesh',
    'Barbados',
    'Belarus',
    'Belize',
    'Benin',
    'Bhutan',
    'Bolivia',
    'Bosnia-Herzegovina',
    'Botswana',
    'Brazil',
    'Burkina Faso',
    'Burundi',
    'Cambodia',
    'Cameroon',
    'Cape Verde',
    'Central African Rep.',
    'Chad',
    'Chile',
    'China',
    'Colombia',
    'Comoros',
    'Congo, Dem. Rep.',
    'Congo, Rep.',
    'Cook Islands',
    'Costa Rica',
    'Cote d\'Ivoire',
    'Croatia',
    'Cuba',
    'Djibouti',
    'Dominica',
    'Dominican Republic',
    'East African Community',
    'Ecuador',
    'Egypt',
    'El Salvador',
    'Equatorial Guinea',
    'Eritrea',
    'Ethiopia',
    'Fiji',
    'Gabon',
    'Gambia',
    'Georgia',
    'Ghana',
    'Grenada',
    'Guatemala',
    'Guinea',
    'Guinea-Bissau',
    'Guyana',
    'Haiti',
    'Honduras',
    'India',
    'Indonesia',
    'Indus Basin',
    'Iran',
    'Iraq',
    'Jamaica',
    'Jordan',
    'Kazakhstan',
    'Kenya',
    'Kiribati',
    'Korea, Dem. Rep.',
    'Kosovo',
    'Kyrgyz Republic',
    'Laos',
    'Lebanon',
    'Lesotho',
    'Liberia',
    'Libya',
    'Macedonia, FYR',
    'Madagascar',
    'Malawi',
    'Malaysia',
    'Maldives',
    'Mali',
    'Marshall Islands',
    'Mauritania',
    'Mauritius',
    'Mayotte',
    'Mexico',
    'Micronesia, Fed. States',
    'Moldova',
    'Mongolia',
    'Montenegro',
    'Montserrat',
    'Morocco',
    'Mozambique',
    'Myanmar',
    'Namibia',
    'Nauru',
    'Nepal',
    'Nicaragua',
    'Niger',
    'Nigeria',
    'Niue',
    'Northern Marianas',
    'North of Sahara, regional',
    'Oceania, regional',
    'Oman',
    'Pakistan',
    'Palau',
    'Palestinian Adm. Areas',
    'Panama',
    'Papua New Guinea',
    'Paraguay',
    'Peru',
    'Philippines',
    'Recipient',
    'Rwanda',
    'Samoa',
    'Sao Tome & Principe',
    'Senegal',
    'Serbia',
    'Seychelles',
    'Sierra Leone',
    'Solomon Islands',
    'Somalia',
    'South Africa',
    'Sri Lanka',
    'States Ex-Yugoslavia',
    'St. Helena',
    'St. Kitts-Nevis',
    'St. Lucia',
    'St.Vincent & Grenadines',
    'Sudan',
    'Suriname',
    'Swaziland',
    'Syria',
    'Tajikistan',
    'Tanzania',
    'Thailand',
    'Timor-Leste',
    'Togo',
    'Tokelau',
    'Tonga',
    'Trinidad and Tobago',
    'Tunisia',
    'Turkey',
    'Turkmenistan',
    'Tuvalu',
    'Uganda',
    'Ukraine',
    'Uruguay',
    'Uzbekistan',
    'Vanuatu',
    'Venezuela',
    'Viet Nam',
    'Wallis & Futuna',
    'Yemen',
    'Zambia',
    'Zimbabwe',
    ]

country_rename = {
    "Congo, Rep.": "Republic of Congo",
    "Korea, Dem. Rep.": "Democratic Republic of Korea",
    "Congo, Dem. Rep.": "Democratic Republic of Congo",
    "Central African Rep.": "Central African Republic",
}

ingos = [
    'AfDB (African Dev. Bank)',
    'AfDF (African Dev. Fund)',
    'Arab Agencies',
    'AsDF (Asian Dev. Fund)',
    'Bill & Melinda Gates Foundation',
    'CarDB (Carribean Dev. Bank)',
    'Donor',
    'EU Institutions',
    'GAVI',
    'GEF',
    'Global Fund',
    'IAEA',
    'IDA',
    'IDB Spec. Fund',
    'IFAD',
    'IMF (SAF,ESAF,PRGF)',
    'Montreal Protocol',
    'Nordic Dev. Fund',
    'UNAIDS',
    'UNDP',
    'UNFPA',
    'UNHCR',
    'UNICEF',
    'UNRWA',
    'UNTA',
    'WFP',
    ]

ingo_rename = {
    "CarDB (Carribean Dev. Bank)": "Caribbean Development Bank",
    "IMF (SAF,ESAF,PRGF)": "IMF",
    "AfDB (African Dev. Bank)": "African Development Bank",
    "AfDF (African Dev. Fund)": "African Development Fund",
    "AsDF (Asian Dev. Fund)": "Asian Development Fund",
}
    
class Transaction:
    donor = property()
    recipient = property()
    trans_type = property()
    amount = property()

donors = {}

reader = csv.reader(open('data/oecd-2009-TABLE2A.csv', 'rb'), delimiter='\t',
    quotechar='"')

# discard header row
reader.next()

for row in reader:
    donor_name = row[1]
    recipient_country = row[9]
    value = row[12]
    aid_type = int(row[4])
    data_type = row[6]
    
    # if donor_name == "":
    #    continue

    if (aid_type != 240 # Memo: ODA Total, Gross disbursements
        or data_type != "A"): # Current Prices (USD millions)
        continue # skip this row

    if (donor_name.endswith(", Total") or
        donor_name.endswith(",Total") or
        recipient_country.endswith(", Total")):
        continue # skip summary rows

    if (recipient_country.endswith(", regional") or
        recipient_country == "Developing Countries unspecified"):
        continue # not sure what these are?

    if (donor_name == "EU Institutions" or donor_name == "Arab Countries"):
        continue # not countries

    trans_type = None

    if donor_name in donor_countries:
        trans_type = 1
    elif donor_name in ingos:
        trans_type = 3
    else:
        print "Unknown donor: %s" % donor_name

    if donor_name in ingo_rename:
        donor_name = ingo_rename[donor_name]

    if recipient_country in country_rename:
        recipient_country = country_rename[recipient_country]

    value = int(float(value) * 1000000)
    
    if not donor_name in donors:
        donors[donor_name] = {}
    
    recips = donors[donor_name]
    
    if not recipient_country in recips:
        trans = recips[recipient_country] = Transaction()
        trans.donor = donor_name
        trans.recipient = recipient_country
        trans.trans_type = trans_type
        trans.amount = 0
    
    trans = recips[recipient_country]

    if trans.trans_type != trans_type:
        print ("Transaction type for %s and %s changed from %d to %d" %
            (donor_name, recipient_country, trans.trans_type, trans_type))

    assert trans.donor == donor_name
    assert trans.recipient == recipient_country
    assert trans.trans_type == trans_type
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
