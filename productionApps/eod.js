import mongoose from 'mongoose'
import eods from '../models/eods.js'
import * as Databasing from '../old stock-viewer files/Databasing.js'
import * as PolygonUtils from '../old stock-viewer files/PolygonUtils.js'
import dotenv from 'dotenv'
import  MPB from 'multi-progress-bars'
import * as threads from 'worker_threads'
import Filters from './filters.js'
import Workers from './WorkerPool.js'
import lux from 'luxon';
import('intl')

const { MultiProgressBars} = MPB
const { DateTime, Settings } = lux;
const {WorkerPool,WorkerBee} = Workers

Settings.defaultZoneName = "America/New_York"

const progressBars = new MultiProgressBars({ anchor: "bottom", border: true, persist: false });
export const AddTask = progressBars.addTask.bind(progressBars)
export const IncrementTask = progressBars.incrementTask.bind(progressBars)
export const Done = progressBars.done.bind(progressBars)

const config = dotenv.config().parsed
const ESTOffset = -5

// polygon key
let key = config.API_KEY

const workerPool = new WorkerPool('./productionApps/processTicks.js', 128)

// converts milliseconds to the date format polygon api expects
let milliToDate=function(date) {
  date= new Date(date)
  let year = date.getFullYear().toString()
  let month = (date.getMonth()+1).toString()
	let day = date.getDate().toString()
  if ((date.getDay() == 0) || (date.getDay() == 6)) {
		return null
	}
	if (day.length==1) {
		day='0'+day
	}
	if (month.length==1) {
		month='0'+month
	}
	date = `${year}-${month}-${day}`
  return date
}

async function storeDataFor(date) {
	const dateAsString = dateString(date)
	let result;
	// get the eod from polygon

	let Eod = await PolygonUtils.getGroupedDaily({ date: dateAsString })
	if (Eod == null) {
		console.log("ploygon fetch failed")
		return null
	}
	if (Eod.results.length == 0) {
		console.log("No data")
		return null
	}

	// All EOD records, with the added data
	const EODdata = []

	if (Eod.results.length == 0) {
		console.log("No data")
		return null
	}

	const DateTask = `Storing ${dateAsString}`
	const DateIncrement = 1 / Eod.results.length
	progressBars.addTask(DateTask, { type: "percentage" })
	const promises = []
	const start = Date.now()
	const count = Eod.results.length
	let numProcessed = 0
	for (const eod of Eod.results) {
		promises.push(new Promise((res, rej) =>
			workerPool.run({ ticker: eod.T, date: dateAsString }, (tickInfo) => {
				// Essentially: const tickInfo = await getTicks(eod.T, dateAsString)
				//insert new name:value pairs
				tickInfo.d = milliToDate(eod.t)
				if (tickInfo.v !=0) {tickInfo.liquidity = tickInfo.n/tickInfo.v} else {tickInfo.liquidity =0}
				tickInfo.r = eod.h - eod.l
				const data = { ...eod, ...tickInfo }
				EODdata.push(data)
				// Databasing.storeEODs([data]).then(_ => {
					numProcessed++
					const elapsed = Date.now()-start
					const s = Math.round((elapsed*count/numProcessed-elapsed)/1000)
					const m = Math.round(s/60) 
					progressBars.incrementTask(DateTask, { message:`~ ${m} min (${s} s)`,percentage: DateIncrement })
					res()
				// })
			}, (e) => {
				console.log(e)
				rej()
			})))
	}
	return Promise.all(promises).then(async res=>{
		progressBars.done(DateTask)
		await Databasing.storeEODs(EODdata)
	}).catch(console.log)
}
async function processRange(start, end) {
	let universe = await Databasing.getDistinct(eods, {}, ['T'])
	const tickers = (universe.T || [])
	let otherLengths

	let tickersProcessed = 0
	let progress = 0
	const startTime = Date.now()
	const FilterTask ="Filters"
	progressBars.addTask(FilterTask, { type: "percentage" })
	for (const ticker of tickers) {

		const dailiesForTicker = await Databasing.getDailies(ticker, start, end)
		if (dailiesForTicker !== null) {

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

			tickersProcessed++
			progress+=1/tickers.length
			const elapsed = Date.now()-startTime
			const s = Math.round((elapsed*tickers.length/tickersProcessed-elapsed)/1000)
			const m = Math.round(s/60) 
			progressBars.incrementTask(FilterTask, {message:`~ ${m} min (${s} s)`, percentage: progress })

		} else {
			console.log("ticker fetch failed")
		}

	}
	// progressBar("Tickers Processed", tickers.length, tickers.length)
	return true

}
function dateString(date) {
	return date.toFormat('yyyy-MM-dd')
}

const FullProgressBar = 20
async function processPast(daysToProcess, beginDate) {
	console.log(`Processing the past ${daysToProcess} days`)
	let now = DateTime.now()
	//let marketIsStillOpen = now.hour < 16

	let dateObject = DateTime.local(parseInt(beginDate.year), parseInt(beginDate.month), parseInt(beginDate.day))

	// if (marketIsStillOpen) {
	// 	dateObject = dateObject.minus({ day: 1 })
	// }
	const startOfRange = dateObject.toMillis();
	const increment = 1 / daysToProcess
	const StoringTask = "Storing Days"

	progressBars.addTask(StoringTask, { type: "percentage" })
	// const storingData = []
	const start = Date.now()
	for (let i = 0; i < daysToProcess; dateObject = dateObject.minus({ day: 1 })) {
		if (dateObject.weekday < 6) {
			let date = dateString(dateObject)
			const storing = storeDataFor(dateObject)
			// storingData.push(storing)

			i++
			const elapsed = Date.now()-start
			const s = Math.round((elapsed*daysToProcess/i-elapsed)/1000)
			const m = Math.round(s/60) 
			storing.then(x=>progressBars.incrementTask(StoringTask, {message:`~ ${m} min (${s} s)`, percentage: increment }))	
			await storing		

		}
	}
	// await Promise.all(storingData)
	progressBars.done(StoringTask)
	const endOfRange = dateObject.toMillis();

	await processRange(startOfRange, endOfRange)
}

const numberOfDays =  1
let tparam = process.argv[2]
let param=tparam.split('-')
let beginDate={
	year:param[0],
	month:param[1],
	day:param[2]
}

const programStart = new Date()
processPast(numberOfDays,beginDate).then(() => {
	const time = new Date() - programStart
	console.log(`Processed ${numberOfDays} day(s) in ${time}ms`)
	mongoose.disconnect()
	console.log("Done Disconnecting")
	process.exit()
})
.catch((err)=>{
	console.log(err)
})
console.log("program end")

// {filtersPassed:{$ne:[],$exists:true}}
// {filtersPassed:{$not:{$ne:[],$exists:true}}}