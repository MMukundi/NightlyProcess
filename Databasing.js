import { millisIn90MarketDays, millisInADay } from './Common.js'
import mongoose from 'mongoose'

import EODs from './models/eods.js'
import Tickers from './models/tickers.js'
import * as PolygonUtils from './PolygonUtils.js';
import TradeSchema from './models/trade.js'

const ShouldLog = false
// mongoose.connect("mongodb://54.147.196.139:27017",{useNewUrlParser: true, useUnifiedTopology: true },async (e)=>{
//     console.log("Mongo says ", e)
// })
mongoose.set('useCreateIndex', true);
// mongoose.connect("mongodb://localhost/stock-daily", { useNewUrlParser: true, useUnifiedTopology: true }, async (e) => {
//     // if (ShouldLog)
//     //     console.log("Mongo says ", e)
//     // else
//     //     console.log(
//     //         "connected"
//     //     )
// })

// interface StockData {
//     ticker: string
//     date: number
//     close: number
//     high: number
//     low: number
//     open: number
//     vwap: number
//     range: number
//     volume: number
//     count: number
// }
function genStart(end) {
    return end - millisIn90MarketDays - millisInADay - millisInADay
}

export async function storeAllDailies(start, end) {
    // const allTickers = await PolygonUtils.getTickers({})
    // console.log(allTickers)
    for await (const ticker of PolygonUtils.iterateTickers()) {
        // console.log(ticker)
        await storeDailies(ticker.ticker, start, end)
    }
}
export async function storeEODs(eods) {
    // return await EODs.insertMany(eods)
    return new Promise((resolve, reject) => {
        EODs.insertMany(eods, { ordered: false }, (e, d) => {
            if (e) {
                if (e.code != 11000) {
                    if (ShouldLog)
                        console.log("EODError", e)
                    reject(e)
                    return e
                }
                else {
                    if (ShouldLog)
                        console.log("DUPE CAUGHT", e.message)
                }
            }
            resolve()
        })
    })
}
//Returns the distinct values for each provided column in a specific Collection
export async function getDistinct(Collection, filters, optionsToGet) {
    // console.log(filters,optionsToGet)
    const $group = { _id: null }
    const $project = {}
    for (const option of optionsToGet) {
        const optionTag = `$${option}`
        $group[option] = { $addToSet: optionTag }
        $project[option] = optionTag
    }
    const pipeline = [{ $match: filters }, { $group }]
    if (optionsToGet.length) {
        pipeline.push({ $project })
    }
    const options = await Collection.aggregate(pipeline)
    // console.log(options,Collection)
    return options[0] || []
}

export function isInRange(doc, start, end) {
    const minTimestamp = doc.get("minTimestamp")
    const maxTimestamp = doc.get("maxTimestamp")
    // console.log(minTimestamp, maxTimestamp, start, end, minTimestamp <= start && start <= maxTimestamp, minTimestamp <= end && end <= maxTimestamp, minTimestamp <= start && start <= maxTimestamp && minTimestamp <= end && end <= maxTimestamp)
    return { newMin: Math.min(minTimestamp, start), newMax: Math.max(maxTimestamp, end), inRange: (minTimestamp <= start && start <= maxTimestamp && minTimestamp <= end && end <= maxTimestamp) }
}
export async function storeDailies(symbol, start, end) {
    const tickerInfo = await PolygonUtils.getInfo({ ticker: symbol });
    if (tickerInfo.error != undefined) {
        console.log(symbol)
        // return
    }
    const doc = await Tickers.findOneAndUpdate({ symbol: tickerInfo.symbol }, tickerInfo, { upsert: true, new: true, useFindAndModify: false })
    console.log(tickerInfo, doc)
    //If the entire queried range is in range, return
    const rangeInfo = isInRange(doc, start, end)
    if (rangeInfo.inRange) {
        console.log(`We already have the data for ${symbol} from ${start} to ${end}`)
        return doc
    }
    doc.updateOne({ $min: { minTimestamp: start }, $max: { maxTimestamp: end } }, {}, (e, d) => e ? console.log("timestampingError", e) : null)
    // doc=undefined
    start = rangeInfo.newMin
    end = rangeInfo.newMax
    const dailiesPages = await PolygonUtils.iterateDailiesPages(symbol, start, end, millisInADay);
    const tradePages = await PolygonUtils.iterateTradePages(symbol, start);
    for await (let page of dailiesPages) {
        // console.log(page)
        // doc.updateOne({ $push: { daily: { $each: page.results } } }, {}, (e, d) => e ? console.log("DailyError", e) : null)
        await EODs.insertMany(page.results, (e, d) => e ? console.log("DailyError", e) : null)
    }
    // for await(let page of tradePages){
    //     await TradeSchema.updateOne({$push:{trade:{$each:page.results}}},{},(e,d)=>e?console.log("TradeError",e):null)
    // }
    console.log(`Stored new data for ${symbol} from ${start} to ${end}`)
    return doc
}
export function between(data, start, end, key) {
    const values = []
    data = data || []
    let i = data[Symbol.iterator]()
    let lastIterator
    let count
    do {
        lastIterator = i.next()
    } while (!lastIterator.done && +lastIterator.value[key] < start)
    while (!lastIterator.done && +lastIterator.value[key] < end) {
        values.push(lastIterator.value)
        lastIterator = i.next()
    }
    return values
}
// export async function getTrades(symbol, start, end) {
//     return between((await EODs.findOne({ symbol }))?.get("trade"), start, end, "t")
// }

// Retrieves the EODs for a specified ticker in a given range
export async function getDailies(T, start, end) {
    return await EODs.find({ T, t: { $gte: start, $lte: end } }, null, { sort: { t: 1 } })
}

export async function getDailyData(T, date) {
    return await EOD.find({ T, d: date })
}


// export function getData(symbol: string, start: number, end: number, f: Function) {
//     conn.query("SELECT * FROM StockData WHERE ticker=? AND date between FROM_UNIXTIME(?) and FROM_UNIXTIME(?)", [symbol, start / 1000, end / 1000], f)
// }
// function storeData(dailies: StockData[]) {
//     for (let data of dailies) {
//         conn.query(
//             'INSERT INTO StockData (`TICKER`,`DATE`,`CLOSE`,`HIGH`,`LOW`,`OPEN`,`RANGE`,`VOLUME`,`VWAP`)VALUES(' +
//             '?,FROM_UNIXTIME(?),' +
//             'CAST(? AS decimal(5,2)),'+
//             'CAST(? AS decimal(5,2)),'+
//             'CAST(? AS decimal(5,2)),'+
//             'CAST(? AS decimal(5,2)),'+

//             'CAST(? AS double),'+

//             'CAST(? AS decimal(5,2)),'+

//             'CAST(? AS decimal(10,0)),'+

//             'CAST(? AS decimal(5,2)));'
//             ,
//             [
//                 data.ticker, data.date / 1000,
//                 data.close, 
//                 data.high, 
//                 data.low, 
//                 data.open,
//                 data.count,
//                 data.range,
//                 data.volume, 
//                 data.vwap
//             ], (err, res) => {
//                 if (err) console.log("Insert error on:", data)

//             }
//         )

//     }
// }
/*
    let runningTotalTPV=0
    let runningTotalVolume=0
    const TPVs:number[] = []

    for(let period of resp.results){
        TPVs.push(period.v*(period.h+period.l+period.c)/3)
        runningTotalTPV+=period.v*(period.h+period.l+period.c)/3
        runningTotalVolume+=period.v
    }
*/
