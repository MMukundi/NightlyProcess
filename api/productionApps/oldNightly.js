


// function threeDaysUp(data, i) {
// 	return (
// 		(data[i].c > data[i - 1].o) &&
// 		(data[i - 1].c > data[i - 2].o) &&
// 		(data[i - 2].c > data[i - 3].o)
// 	)
// }
// function threeDaysDown(data, i) {
// 	return (
// 		(series[i].c < series[i - 1].o) &&
// 		(series[i - 1].c < series[i - 2].o) &&
// 		(series[i - 2].c < series[i - 3].o)
// 	)
// }

let convertMillisecondsToDate = function (date) {
	date = new Date(date)
	let year = date.getFullYear().toString()
	let month = (date.getMonth() + 1).toString()
	let day = date.getDate().toString()
	if ((date.getDay() == 0) || (date.getDay() == 6)) {
		return null
	}
	if (day.length == 1) {
		day = '0' + day
	}
	if (month.length == 1) {
		month = '0' + month
	}
	date = `${year}-${month}-${day}`
	return date
}

let getDates = function (days) {
	let d = new Date()
	let dates = []
	for (let i = 1; i < days; i++) {
		date = d - (i * 86400000)
		dates.push(milliToDate(date))
	}
	return dates
}

const putResults = function (data) {
	axios({
		method: "post",
		url: "http://localhost:4000/results",
		data: data,
		config: { headers: { 'Content-Type': 'application/json' } }
	})
}

async function getTicker(ticker) {
	//console.log("request: ", request)
	let response = axios({
		method: "get",
		url: `http://localhost:4000/eod/ticker?ticker=${ticker}`,
		config: { headers: { 'Content-Type': 'application/json' } }
	})
	return response
}

async function getUniverse(date) {

	let response = await axios({
		method: "get",
		url: `http://localhost:4000/eod/all?date=${date}`,
		config: { headers: { 'Content-Type': 'application/json' } }
	})
	console.log("Count :", response.data.length)
	return response
}

async function processEodData(data, date) {
	data.forEach(async (record) => {
		record.d = date
		record.r = record.h - record.l
		let success = await putEod(record)
	})
	return true
}

async function putEod(record) {
	try {
		let response = axios({
			method: 'post',
			url: `http://localhost:4000/eod`,
			config: { headers: { 'Content-Type': 'application/json' } },
			data: record
		})
		return response
	} catch {
		return null
	}
}

async function putDatapoint(data) {
	let response = axios({
		method: "post",
		url: `http://localhost:4000/averages`,
		data: data,
		config: { headers: { 'Content-Type': 'application/json' } }
	})
		.catch((err) => {
			console.log(err)
		})
	return response
}

async function computeDatapoints(data, ticker, date) {
	//console.log(data)
	//console.log("**************************************")
	if (data.length < 90) {
		return null
	}
	let range = data.map(({ h, l }) => (h - l));
	let weighted = data.map(({ vw }) => (vw))
	let volume = data.map(({ v }) => (v))
	let record = {
		"ticker": ticker,
		"date": date,
		"range": {
			"day90": ss.mean(range.slice(0, 89)),
			"day60": ss.mean(range.slice(0, 59)),
			"day30": ss.mean(range.slice(0, 29)),
			"day15": ss.mean(range.slice(0, 14)),
			"day05": ss.mean(range.slice(0, 4))
		},
		"weighted": {
			"day90": ss.mean(weighted.slice(0, 89)),
			"day60": ss.mean(weighted.slice(0, 59)),
			"day30": ss.mean(weighted.slice(0, 29)),
			"day15": ss.mean(weighted.slice(0, 14)),
			"day05": ss.mean(weighted.slice(0, 4))
		},
		"volume": {
			"day90": ss.mean(volume.slice(0, 89)),
			"day60": ss.mean(volume.slice(0, 59)),
			"day30": ss.mean(volume.slice(0, 29)),
			"day15": ss.mean(volume.slice(0, 14)),
			"day05": ss.mean(volume.slice(0, 4))
		},
		"mktcap": {
			"day90": ss.mean(value.slice(0, 89)),
			"day60": ss.mean(value.slice(0, 59)),
			"day30": ss.mean(value.slice(0, 29)),
			"day15": ss.mean(value.slice(0, 14)),
			"day05": ss.mean(value.slice(0, 4))
		}
	}

	putDatapoint(record)
		.then(res => {
			return res
		})
}

async function getPolygonEod(date) {
	let url = `http://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/${date}?apiKey=${key}`
	try {
		let response = await axios({
			method: 'get',
			url: url,
			config: { headers: { 'Content-Type': 'application/json' } }
		})
		return response.data.results
	} catch (e) {
		console.log(e);
	}
}

async function exp3daysupdown(series) {
	let days = 4
	if (series.length < days) {
		return null
	}
	for (let i = series.length - 1; i >= series.length - 1; i--) {
		// 3 days up
		if ((series[i].c > series[i - 1].o) &&
			(series[i - 1].c > series[i - 2].o) &&
			(series[i - 2].c > series[i - 3].o)) {
			// meets condition of the filter
			let result = {
				"name": '3daysup',
				"ticker": series[i].T,
				"date": series[i].d,
				"close": series[i].c,
				"volume": series[i].v
			}
			putResults(result)
			return true
		}

		// 3 days down

		if ((series[i].c < series[i - 1].o) &&
			(series[i - 1].c < series[i - 2].o) &&
			(series[i - 2].c < series[i - 3].o)) {
			// meets condition of the filter
			let result = {
				"name": '3daysdown',
				"ticker": series[i].T,
				"date": series[i].d,
				"close": series[i].c,
				"volume": series[i].v
			}
			putResults(result)
			return true
		}
	}
	return null
}

async function gapupdown(series) {
	let days = 2
	if (series.length < days) {
		console.log("new ticker", series.T)
	} else {
		for (let i = series.length - 1; i >= series.length - 1; i--) {
			if ((series[i].l > series[i - 1].h)) {
				let result = {
					"name": 'gapup',
					"ticker": series[i].T,
					"date": series[i].d,
					"close": series[i].c,
					"volume": series[i].v
				}
				putResults(result)
				return true
			}

			if (series[i].h < (series[i - 1].l)) {
				// meets condition of the filter
				let result = {
					"name": 'gapdown',
					"ticker": series[i].T,
					"date": series[i].d,
					"close": series[i].c,
					"volume": series[i].v
				}
				putResults(result)
				return true
			}
		}
	}
	return null
}

async function exp2daysupdown(series) {
	let days = 3
	if (series.length < days) {
		console.log("no Joy")
	} else {
		for (let i = series.length - 1; i >= series.length - 1; i--) {
			// 3 days up
			if ((series[i].c > series[i - 1].h) &&
				(series[i - 1].c > series[i - 2].o)) {
				// meets condition of the filter
				let result = {
					"name": '2daysup',
					"ticker": series[i].T,
					"date": series[i].d,
					"close": series[i].c,
					"volume": series[i].v
				}
				putResults(result)
				return true
			}

			// 3 days down

			if ((series[i].c < series[i - 1].l) &&
				(series[i - 1].c < series[i - 2].o)) {
				// meets condition of the filter
				let result = {
					"name": '2daysdown',
					"ticker": series[i].T,
					"date": series[i].d,
					"close": series[i].c,
					"volume": series[i].v
				}
				putResults(result)
				return true
			}
		}
	}
	return null
}

// let vals = [
// 	{isValue:true,dayIndex:1,propertyName:'c'},
// 	{isValue:false,operator:'*'},
// 	{isValue:true,dayIndex:-1,propertyName:'vw'},
// ]
/**
 * (series.data[i].c < series.data[i-1].o) &&
					(series.data[i-1].c < series.data[i-2].o) &&
					(series.data[i-2].c < series.data[i-3].o)
 */
/**
 * const _3daysDown = [
 * {day:0,prop:'c'},
 * {op:'<'},
 * {day:-1,prop:'o'},
 *
 * {op:'&'},
 *
 * {day:-1,prop:'c'},
 * {op:'<'},
 * {day:-2,prop:'o'},
 *
 * {op:'&'},
 *
 * {day:-2,prop:'c'},
 * {op:'<'},
 * {day:-3,prop:'o'},
 * ]
 *
 * const _3daysDownFunc = tokensToFunction(_3daysDown, series.data)
 * _3daysDownFunc(i)
 */
// let a ={
// 	isValue:Boolean,
// 	value:{dayIndex:number,propertyName:property}|('*'|'/'|'+'|'-'),
// 	args: [] // For Operation
// 	} 