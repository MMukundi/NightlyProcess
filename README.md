# Nightly Process

This code, meant to be run every night, can store useful data calculated from the dailies and trades for a range of days into a mongo database.
## __Getting Started__
In the [config file](.env), ensure that you specify:
```
API_KEY = [your Polygon API key]
DATABASE_URL = [the URL of your mongodb]
```
## __How's it work?__
* Gets End of Day(EOD) data using the [Polygon API](Polygon.io)
* For each EOD, it calculates additional data points (e.g. number of odd-lot trades)
* Stores EODs and data in mongo database

## __Commands__ 
## npm start
	npm start [startDate] [endDate]
	npm start "2021-05-01" 2021-05-04"	
Runs [the nightly processs program](nightly.js)<br>
Takes in a start date [inclusive] and an end date[exclusive] to process and store. The example above would store May 1st, 2nd, and 3rd, but not the fourth.
		

## npm run dev
	npm run dev [startDate] [endDate]
	npm run dev "2021-05-01" 2021-05-04"	
Identical to __npm start__, but run with nodemon, so it will restart when the files are changed in development.

## npm run test
	npm run test
Runs the nightly process on the 3 days May 1-3 2021.
May 1 & 2 aren't weekdays, and should be skipped
May 3rd should store each of 10325 tickers		

## npm run db
	npm run db
If you'd prefer to use a local mongo db, you can run the db with this command. It requires you to download the [mongo driver mongod](https://docs.mongodb.com/manual/installation/)
## __Outputs__
In the mongo database specified, there should be a fews Collections:
## EODs
A summary of the trading activity on a given day.

<details>
<summary>
Type information

</summary>

(An extension of the [Polyon Daily](https://polygon.io/docs/get_v1_open-close__stocksTicker___date__anchor))

```ts
{
	// The exchange symbol that this item is traded under.
	T: string,

	// The trading volume of the symbol on the given day.
	v: number,

	// The open price for the symbol on the given day.
	o: number,

	// The close price for the symbol on the given day.
	c: number,

	// The highest price for the symbol on the given day.
	h: number,

	// The lowest price for the symbol on the given day.
	l: number,
	
	// The Unix Msec timestamp for the start of the aggregate window.
	t: number,

	// The names of the calculation filters the item passes on the given day.
	filtersPassed: string[]
}
```
</details>

## Frequencies 

A record of how many times an item has traded at a given price (rounded to the nearest cent).

e.g., for the prices
```
[0.12, 0.18, 0.20, 0.21, 0.30, 0.29],
```
the table would read
```
{
	0.1: 1,
	0.2: 3,
	0.3: 2,
}
```
<details>
<summary>Type information
</summary>

(Defined [here](models/frequency.js))

```ts
{
	// The exchange symbol that this item is traded under.
	T: string,

	/* 
	A histogram, mapping a trading price (rounded to the nearest cent) 
	to the number of times that price has occured.
	*/
	frequencyTable:{
		[price:number]: number
	}
}
```
</details>
<!---
## Trades

<details>
<summary>Type information
</summary>

(An extension of the [Polyon Trade](https://polygon.io/docs/get_v2_ticks_stocks_trades__ticker___date__anchor))

```ts
{
	// The exchange symbol that this item is traded under.
	T: String,

	// The Trade ID which uniquely identifies a trade. These are unique per combination of ticker, exchange, and TRF. For example: A trade for AAPL executed on NYSE and a trade for AAPL executed on NASDAQ could potentially have the same Trade ID.
	i: number,

	// The exchange ID. See Exchanges for Polygon.io's mapping of exchange IDs.
	x: number,

	// The price of the trade. This is the actual dollar value per whole share of this trade. A trade of 100 shares with a price of $2.00 would be worth a total dollar value of $200.00.
	p: number,

	// The trade correction indicator.
	e: number,

	// The ID for the Trade Reporting Facility where the trade took place.
	r: number,

	// The nanosecond accuracy SIP Unix Timestamp. This is the timestamp of when the SIP received this message from the exchange which produced it.
	t: number,

	// The nanosecond accuracy Participant/Exchange Unix Timestamp. This is the timestamp of when the quote was actually generated at the exchange.
	y: number,

	// The nanosecond accuracy TRF(Trade Reporting Facility) Unix Timestamp. This is the timestamp of when the trade reporting facility received this message.
	f: number,

	// The sequence number represents the sequence in which message events happened. These are increasing and unique per ticker symbol, but will not always be sequential (e.g., 1, 2, 6, 9, 10, 11).
	q: number,

	// A list of condition codes.
	c: number[],

	// The size of a trade (also known as volume).
	s: number,

	// There are 3 tapes which define which exchange the ticker is listed on. 
	// These are integers in our objects which represent the letter of the alphabet. 
	// Eg: 1 = A, 2 = B, 3 = C.
	z: number,
}
```
</details>

## Tickers

A collection of information about the various tickers

<details>
<summary>Type information
</summary>

(An extension of the [Polyon Ticker v3](https://polygon.io/docs/get_v3_reference_tickers_anchor))

```ts
{
	// The URL of the entity's logo.
	logo: string,
		
	// The symbol's primary exchange.
	exchange: string,
		
	// The name of the company/entity.
	name: string,
			
	// The official CIK guid used for SEC database/filings.
	cik: string,
				
	// The Bloomberg guid for the symbol.
	bloomberg: string,

	// Standard Industrial Classification (SIC) id for the symbol. (https://en.wikipedia.org/wiki/Legal_Entity_Identifier)
	lei: number,

	// The Legal Entity Identifier (LEI) guid for the symbol. (https://en.wikipedia.org/wiki/Legal_Entity_Identifier)
	sic: string,

	// The country in which the company is registered.
	country: string,

	// The industry in which the company operates.
	industry: string,

	// The sector of the indsutry in which the symbol operates.
	sector: string,

	// The current market cap for the company.
	marketCap: number,

	// The approximate number of employees for the company.
	employees: number,

	// The phone number for the company. This is usually a corporate contact number.
	phone: string,

	// The name of the company's current CEO.
	ceo: string,

	// The URL of the company's website.
	url: string,

	// A description of the company and what they do/offer.
	description: string,

	// A list of ticker symbols for similar companies.
	similar: string[],

	// A list of words related to the company.
	tags: string[],
}
```
</details>
-->