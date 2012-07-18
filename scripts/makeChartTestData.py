#!/usr/bin/python

from random import random

donors = [
    "Australia",
    "Austria",
    "Belgium",
    "Canada",
    "Denmark",
    "Finland",
    "France",
    "Germany",
    "Greece",
    "Ireland",
    "Italy",
    "Japan",
    "Luxembourg",
    "Netherlands",
    "New Zealand",
    "Norway",
    "Portugal",
    "Spain",
    "Sweden",
    "Switzerland",
    "UK",
    "USA"]

recipients = [
	"Afghanistan",
	"Angola",
	"Bangladesh",
	"Benin",
	"Bhutan",
	"Burkina Faso",
	"Burundi",
	"Cambodia",
	"Central African Republic",
	"Chad",
	"Comoros",
	"DRC",
	"Djibouti",
	"Equatorial Guinea",
	"Eritrea",
	"Ethiopia",
	"Gambia",
	"Guinea",
	"Guinea-Bissau",
	"Haiti",
	"Kiribati",
	"Laos",
	"Lesotho",
	"Liberia",
	"Madagascar",
	"Malawi",
	"Maldives",
	"Mali",
	"Mauritania",
	"Mozambique",
	"Myanmar",
	"Nepal",
	"Niger",
	"Rwanda",
	"Samoa",
	"Sao Tome & Principe",
	"Senegal",
	"Sierra Leone",
	"Solomon Islands",
	"Somalia",
	"Sudan",
	"Tanzania",
	"Timor-Leste",
	"Togo",
	"Tuvalu",
	"Uganda",
	"Vanuatu",
	"Yemen",
	"Zambia",
    ]

multilaterals = [
	"ADB",
	"ECHO",
	"FAO",
	"IFC",
	"IFAD",
	"ILO",
	"IMF",
	"IOM",
	"UNAIDS",
	"UNIFEM",
	"UNICEF",
	"UNDP",
	"UNESCO",
	"UNHCR",
	"UNFPA",
	"World Bank",
	"WFP",
	"WHO",
    ]

transactions = []

for donor in donors:
    #give each donor/payer create a random typical payment amount
    typical_payment = int(random() * 1000000)
    for recipient in recipients:
        if random() > 0.66:
            #randomly vary the donors payment by half to one and a half times.
            payment = int(typical_payment * (random() + 0.5))
            transaction = [donor, recipient, payment, 1]
            transactions.append(transaction)

for donor in donors:
    #give each donor/payer create a random typical payment amount
    typical_payment = int(random() * 5000000)
    for multilateral in multilaterals:
        if random() > 0.5:
            #randomly vary the donors payment by half to one and a half times.
            payment = int(typical_payment * (random() + 0.5))
            transaction = [donor, multilateral, payment, 2]
            transactions.append(transaction)

for multilateral in multilaterals:
    #give each donor/payer create a random typical payment amount
    typical_payment = int(random() * 2000000)
    for recipient in recipients:
        if random() > 0.33:
            payment = int(typical_payment * (random() + 0.5))        
            transaction = [multilateral, recipient, payment, 3]
            transactions.append(transaction)
        
output_file = open('transactions.json','w')

output_file.write('    feed = {\n')
output_file.write('        transactions: [\n')


for transaction in transactions:
    output_file.write('            {\n')
    output_file.write('                from: "' + transaction[0] + '",\n')
    output_file.write('                to: "' + transaction[1] + '",\n')
    output_file.write('                amount: ' + str(transaction[2]) + ',\n')
    output_file.write('                type: ' + str(transaction[3]) + ',\n')
    output_file.write('            },\n')

output_file.write('        ]\n')
output_file.write('    }\n')

print "done"
