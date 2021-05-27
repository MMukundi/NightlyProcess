// discover number of up days (closing price > pervious day "open"ing price)

const Ticker = require('../models/tickers')
const Eod = require('../models/eods')
const Experiment = require('../models/experiments')
const Results = require('../models/results')
//const series = require('../pten/pten.json')

let axios = require('axios')

async function putdata(data) {
	console.log("put data ", data.ticker)
	let response = axios({
		method:"post",
		url:`http://localhost:3100/results`,
		data: data,
		config: { headers: {'Content-Type': 'application/json' }}
		})
	return response
}

async function getdata(ticker) {
	//console.log("request: ", request)
	let response = axios({
		method:"get",
		url:`http://localhost:3100/eod/${ticker}`,
		config:{ headers: {'Content-Type': 'application/json' }}
	})
	return response
}

async function getUniverse() {
	let response = await axios({
		method:"get",
		url:"http://localhost:3100/eod/all?date=2021-01-05",
		config:{ headers: {'Content-Type': 'application/json' }}
	})
	console.log("Count :",response.data.length)
	return response
}

async function runExperiment(series) {
	let days = 5

	if (series.data.length < days) {
		return null
	}
	for (let i=series.data.length-1; i>=series.data.length-1; i--) {
		// 3 days up
			if ((series.data[i].c > series.data[i-1].o) && 
					(series.data[i-1].c > series.data[i-2].o) && 
					(series.data[i-2].c > series.data[i-3].o)) {
				// meets condition of the filter
				let result = {
					"name":'3daysup',
					"ticker":series.data[i].T,
					"date":series.data[i].d,
					"close":series.data[i].c, 
					"vol":series.data[i].v
				}
				return result
			}

		// 3 days down

			if ((series.data[i].c < series.data[i-1].o) && 
					(series.data[i-1].c < series.data[i-2].o) && 
					(series.data[i-2].c < series.data[i-3].o)) {
				// meets condition of the filter
				let result = {
					"name":'3daysdown',
					"ticker":series.data[i].T,
					"date":series.data[i].d,
					"close":series.data[i].c, 
					"vol":series.data[i].v
				}
				return result			
			}
	}
	return null
}
// Main Code

async function process() {
	let universe = await getUniverse()
	for (let ticker of universe.data) {
		console.log("Ticker: ", ticker)
		let data = await getdata(ticker)
		//console.log("data: ", data)
		if (data !== null) {
			let result = await runExperiment(data)
			if (result !== null) {
				let putrec = await putdata(result)
			}
		}
	}
	return true
}
process().then(res => console.log(res)).catch((err)=>console.log(err))				