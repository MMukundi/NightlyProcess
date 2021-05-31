import { beginTask, incrementTask, endTask, closeTasks } from "./taskbars.js"
import * as Polygon from './PolygonUtils.js'
import * as Databasing from './Databasing.js'
import Workers from './WorkerPool.js'
import lux from 'luxon';
import mongoose from 'mongoose';
import config from "./config.js"
import eods from "./models/eods.js"
import { Filters, setFilter } from "./filters.js"
import path from "path"
import CSVWriter, { createObjectCsvWriter as createCsvWriter } from "csv-writer"

import('intl')

const { DateTime, Settings } = lux;
const { WorkerPool } = Workers

Settings.defaultZoneName = "America/New_York"

// const StoringTask = "Storing to DB"
const workerPool = new WorkerPool('./processTrades.js', 50)

function dateToString(date) {
    return date.toFormat('yyyy-MM-dd')
}
function runWorker(data) {
    return new Promise((resolve, reject) => {
        workerPool.run(data, resolve, reject)
    })
}

async function withTradeData(eod, dateString) {
    const tradeData = await runWorker({ ticker: eod.T, date: dateString }).catch(console.log)
    tradeData.d = dateString // dateToString(DateTime.fromMillis(eod.t))
    tradeData.r = eod.h - eod.l
    const withTrades = { ...eod, ...tradeData }
    return withTrades
}

async function getEodsWithTrades(date) {
    const dateString = dateToString(date)
    const eods = (await Polygon.getGroupedDaily({ date: dateString }))?.results
    if (eods == null) {
        return
    }
    const DateTask = `${dateString}`
    beginTask(DateTask, eods.length)
    function incrementDateTask(data) {
        incrementTask(DateTask)
        return data
    }
    const withTradesPromise = eods.map(eod => withTradeData(eod, dateString).then(incrementDateTask).catch(console.log))
    return Promise.all(withTradesPromise).then(withTrades => {
        endTask(DateTask)
        return withTrades
    })
}

async function storeDate(date) {
    if (date.weekday < 6) {
        const eodsWithTrades = await getEodsWithTrades(date)
        await Databasing.storeEODs(eodsWithTrades)
        return eodsWithTrades
    }
    return []
}
const baseURI =
    path.join(
        decodeURIComponent
            (path.dirname(import.meta.url))
            .replace("file:/", ``))
const CSVheader = ['T', 'oddlotVolume', 'oddlotCount', 'volume', 'count', 'blockCount', 'blockVolume'].map(key => ({ id: key, title: key }))
function getFileFor(date) {
    return path.join(baseURI, `csv/${dateToString(date)}.csv`)
}

function last(list) {
    return list[list.length - 1]
}
async function storeDates(start, end) {

    // Ensure the dates are in the correct order ...
    if (end.startOf("day") <= start.startOf("day")) {
        const temp = end
        end = start
        start = temp
    }

    // ... and aren't past today
    const today = DateTime.now().startOf("day")
    if (today <= start.startOf("day")) {
        start = today
    }
    if (today <= end.startOf("day")) {
        end = today
    }

    const totalDays = end.diff(start).as("days")
    const StoringTask = `Storing ${dateToString(start)} - ${dateToString(end)} [${totalDays}]`

    beginTask(StoringTask, totalDays)
    for (let date = start.toLocal(), days = 0; days < totalDays; days++, date = date.plus({ day: 1 })) {
        const CSVpath = getFileFor(date)
        const csvTask = last(CSVpath.split(path.sep))
        const withTrades = await storeDate(date)
        if (withTrades != undefined) {
            beginTask(csvTask, 1)
            const writer = createCsvWriter({
                path: CSVpath,
                header: CSVheader
            });
            await writer
                .writeRecords(withTrades)
                .then(() => {
                    incrementTask(csvTask)
                    endTask(csvTask)
                });

        }
        incrementTask(StoringTask)
    }

    await runCalculations(start.toMillis(), end.toMillis())
    endTask(StoringTask)
}
async function runCalculations(start, end) {
    const CalculationsTask = "Calculations"
    const allTickers = (await Databasing.getDistinct(eods, {}, ['T']))[0].T || []

    beginTask(CalculationsTask, allTickers.length)
    for (const ticker of allTickers) {
        const eodsForTicker = await Databasing.getDailies(ticker, start, end)
        if (eodsForTicker == null) {
            console.log("ticker fetch failed")
            continue
        }
        const FiltersToCheck = Filters.filter(f => f.days <= eodsForTicker.length)
        //Iterates over every filter
        beginTask(ticker, FiltersToCheck.length)
        for (const filter of FiltersToCheck) {
            const daysToProcess = eodsForTicker.length - filter.maxIndex
            for (let i = -filter.minIndex; i < daysToProcess; i++) {
                const eod = eodsForTicker[i]
                if (filter.filter(eodsForTicker, i)) {
                    await setFilter(eod, filter)
                }
            }
            incrementTask(ticker)
        }
        endTask(ticker)
        for (const daily of eodsForTicker) {
            await daily.save()
        }

        incrementTask(CalculationsTask)

    }
    endTask(CalculationsTask)
    // progressBar("Tickers Processed", tickers.length, tickers.length)
    return true
}
// async function runCalculationsFor(eod) {

// }

const totalErrors = 30
let currentError = totalErrors
function nErrors() {
    if (0 < (currentError--)) {
        return new Promise((res, rej) => { rej(`Error Number ${totalErrors - currentError}`) })
    }
    return new Promise((res, rej) => { res('Safe!') })
}


async function mainProgram() {
    const extraArg = process.argv[4]
    if (extraArg) {
        switch (extraArg) {
            case "t": {
                return Polygon.exponentialBackoff(nErrors).catch(console.log)
            }
        }
    } else {
        const startDate = DateTime.fromSQL(process.argv[2])
        const endDate = DateTime.fromSQL(process.argv[3])
        mongoose.set('useCreateIndex', true);
        return mongoose.connect(config.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(async (e) => {
            console.log(`Connected to Database at ${config.DATABASE_URL}`)
            storeDates(startDate, endDate).then(() => {
                closeTasks()
                console.log("Complete")
                mongoose.disconnect()
                console.log("Closing!", startDate, endDate)
            }).catch(console.log)
        })
    }
}

mainProgram()
.then(_ => workerPool.drain())