import * as axios from 'axios'
import * as fs from "fs"
import mongoose from 'mongoose'
import * as ss from 'simple-statistics'
// let getDates = require('../functions/getDates')
import eods from '../models/eods.js'
import {getTicks} from '../functions/getTicks.mjs'
import * as Databasing from '../old stock-viewer files/Databasing.mjs'
import * as PolygonUtils from '../old stock-viewer files/PolygonUtils.mjs'
import dotenv from 'dotenv'

import * as util from 'util'
import { domainToASCII } from 'url'

const log_file = fs.createWriteStream('.' + '/debug.log', { flags: 'w' });
const log_stdout = process.stdout;

console.log = function (...args) { //
	log_file.write(util.format(...args) + '\n');
	log_stdout.write(util.format(...args) + '\n');
};
console.write = function (...args) { //
	log_file.write(util.format(...args));
	log_stdout.write(util.format(...args));
};

const config = dotenv.config().parsed
const ESTOffset = -5
// polygon key
let key = config.API_KEY
// console.log(config)
// Filter function should take in an index into the list and return true or false
// Also days is the number of days considered in the calculation
// const Filters = [
// 	{ name: "ALL PASS", days: 1, filter: ()=>true },
// 	{ name: "ALL PASS2", days: 1, filter: ()=>true },
// 	nDaysUp(3),
// 	nDaysDown(3),
// 	{ name: "Gap Up", days: 2, filter: gapUp },
// 	{ name: "Gap Down", days: 2, filter: gapDown },
// ]

const Filters = [
	{ name: "ALL PASS", min: 0, max: 0, filter: () => true },
	{ name: "ALL PASS2", min: 0, max: 0, filter: () => true },
	nDaysUp(3),
	nDaysDown(3),
	{ name: "Gap Up", min: -1, max: 0, filter: gapUp },
	{ name: "Gap Down", min: -1, max: 0, filter: gapDown },
]
Filters.forEach(calcDays)
function calcDays(filter) {
	filter.minIndex = Math.min(filter.min, 0)
	filter.maxIndex = Math.max(filter.max, 0)
	filter.days = filter.maxIndex - filter.minIndex + 1
	return filter.days
}
async function setFilter(doc, filter) {
	await doc.updateOne({ $addToSet: { filtersPassed: filter.name } })
}
function nDaysUp(n) {
	return {
		name: `${n} Days Up`,
		// days: n + 1,
		min: - n, max: 0,
		filter: (data, i) => {
			const start = i - n;
			for (let day = start; day < i; day++) {
				if (data[day + 1].c <= data[day].o)
					return false;
			}
			return true;
		}
	}
}
function nDaysDown(n) {
	return {
		name: `${n} Days Down`,
		// days: n + 1,
		min: - n, max: 0,
		filter: (data, i) => {
			const start = i - n;
			for (let day = start; day < i; day++) {
				if (data[day + 1].c >= data[day].o)
					return false;
			}
			return true;
		}
	}
}
function gapUp(series, i) {
	return series[i].l > series[i - 1].h
}
function gapDown(series, i) {
	return series[i].h < (series[i - 1].l)
}

// function toDateString(millis) {
// 	return new Date(millis).getTimezoneOffset()("EST")
// }

async function storeDataFor(date) {
	let result;
	// get the eod from polygon
	let Eod = await PolygonUtils.getGroupedDaily({ date })
	if (Eod == null){
		console.log("ploygon fetch failed")
		return null
	}

	// write the data to mongo
	// Old code:
	// processEodData(Eod, date)
	const EODdata = []
	for(const eod of Eod.results){
		if(EODdata.length==3)break;
		const tickInfo = await getTicks(eod.T, dateString(new Date(eod.t)))
		console.log(EODdata)
		EODdata.push({...eod,...tickInfo})
	}
	console.log(EODdata)
	// const EODdata = Eod.results
	await Databasing.storeEODs(EODdata)
		// .then((resp) => {
		// 	if (resp !== null) {
		// 		console.log("wrote data")
		// 	} else {
		// 		console.log("write failed")//, err.config.data)
		// 	}
		// })
		// .catch((err) => {
		// 	console.log("DB err: ")
		// })
}
async function processRange(start, end) {
	let universe = await Databasing.getDistinct(eods, {}, ['T'])
	const tickers=(universe.T || [])
	let otherLengths
	// loop through active symbols pass to child process for processing
	console.log("Processing Data:")
	let tickersProcessed = 0
	for (const ticker of tickers) {
		progressBar("Tickers Processed",tickersProcessed++,tickers.length)
		// get past data data points, should already be sorted
		const dailiesForTicker = await Databasing.getDailies(ticker, start, end)

		if (dailiesForTicker !== null) {
			// if(otherLengths!=dailiesForTicker.length){
			// 	console.log(`while before we had ${otherLengths}, ${ticker} has ${dailiesForTicker.length}`)
			// 	otherLengths=dailiesForTicker.length
			// } 

			// Removes any filters there's not enough data for
			const FiltersToCheck = Filters.filter(f => f.days <= dailiesForTicker.length)

			//Iterates over every filter
			for (const filter of FiltersToCheck) {
				const daysToProcess = dailiesForTicker.length - filter.maxIndex
				for (let i = -filter.minIndex; i < daysToProcess; i++) {
					const dialy = dailiesForTicker[i]
					if (filter.filter(dailiesForTicker, i)) {
						await setFilter(dialy, filter)
					}
				}
			}
			for (const daily of dailiesForTicker) {
				await daily.save()
			}
			// //update averages and other data points
			// result = await computeDatapoints(dailiesForTicker.data, ticker, date)
			// 	.then(console.log("complete computeDatapoints"))

		} else {
			console.log("ticker fetch failed")
		}

	}
	progressBar("Tickers Processed",tickers.length,tickers.length)
	return true

}
function dateString(date) {
	return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
}
const UTCArgs = {
	start: [0, 0, 0, 0],
	end: [23, 59, 59, 999]
}
function toUTC(date, clampTo = "start") {
	return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), ...UTCArgs[clampTo]);
}
const FullProgressBar = 20
function progressBar(message,part,whole){
	const percent = whole==0?0:part/whole
	const Amount = Math.round(FullProgressBar*percent)
	console.write(`\r${part}/${whole} ${message}: [${'#'.repeat(Amount)}${' '.repeat(FullProgressBar-Amount)}]`)
}
async function processPast(daysToProcess) {
	console.log(`Processing the past ${daysToProcess} days`)
	let dateObject = new Date()
	dateObject.setDate(dateObject.getDate() - daysToProcess)
	const startOfRange = toUTC(dateObject);
	console.log("\nStoring Data:")
	for (let i = 0; i < daysToProcess; i++) {
		progressBar("Days Stored",i,daysToProcess)
		let date = dateString(dateObject)//convertMillisecondsToDate(Date.now()-86400000)
		await storeDataFor(date)
		dateObject.setDate(dateObject.getDate() + 1)
	}
	progressBar("Days Stored",daysToProcess,daysToProcess)
	console.log("\nDone storing data\n")
	const endOfRange = toUTC(dateObject, "end");

	await processRange(startOfRange, endOfRange)
	console.log("\n")
}

const numberOfDays = +(process.argv[2] || 10)
const programStart = new Date()
processPast(numberOfDays).then(() =>{
	const time = new Date()-programStart
	console.log(`Processed ${numberOfDays} day(s) in ${time}ms`)
	mongoose.disconnect()
	console.log("Done Disconnecting")
})


// {filtersPassed:{$ne:[],$exists:true}}
// {filtersPassed:{$not:{$ne:[],$exists:true}}}