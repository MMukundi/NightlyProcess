import fetch from 'node-fetch'
import * as poly from './PolygonUtils'
import * as Databasing from './Databasing'
import path from 'path'
import express from 'express'
import { millisIn90Days, millisIn90MarketDays, millisInADay } from './Common'
import { runCalculations } from './Calculation'
import TickerSchema from './TickerSchema'
import * as PolygonUtils from './PolygonUtils'
import { ITickers } from 'polygon.io/src/rest/reference/tickers'
const app = express()
const ports = process.env.PORTS ? JSON.parse(process.env.PORTS) : {}
const buildDirectory = process.env.pm_cwd ? path.join(process.env.pm_cwd, '..', 'build') : "."

app.listen(ports[process.env.NODE_ENV], () => {
    console.log(`Server running on port ${ports[process.env.NODE_ENV]} in ${process.env.NODE_ENV} mode`)
})

// Databasing.storeDailies("AAPL", new Date().getTime() - millisIn90Days, new Date().getTime())
app.use("/api/:symbol/:start/:end/:step", async (request, response) => {
    const symbol = request.params.symbol
    const end = +((request.params.end === undefined) ? (
        (request.params.start === undefined) ? request.params.start + millisIn90MarketDays : Date.now()
    ) : request.params.end)
    const start = +((request.params.start === undefined) ? +request.params.end - millisIn90MarketDays : request.params.start)
    const step = +((request.params.step === undefined) ? millisInADay : request.params.step)

    const date = Date.now()

    //Will add data if necessary
    await Databasing.storeDailies(symbol,start,end);
    console.log(`Getting the dailies for ${symbol} from ${start} to ${end}`)
    const dailies = await Databasing.getDailies(symbol, date-millisIn90MarketDays, date)
    const info = await PolygonUtils.getInfo({ticker:symbol})
    // const tickData = await Databasing.getTicks(symbol, date-millisIn90MarketDays, date)
    const tickData = []
    response.json({ dailies, info, tickData })
})
app.use("/api/tickers",async  (request, response) => {
    const res = []
    for await(const t of poly.iterateTickers()){
        res.push(t)
    }
    response.json(res)
    // response.json([... await ])
})
app.use("/api/:symbol", async (request, response) => {
    const now = Date.now()
    response.redirect(`/api/${request.params.symbol}/${now-millisIn90Days}/${now}/${millisInADay}`)
})

app.use("/api/*", (request, response) => {
    console.log(`API general endpoint, even though you *wanted* ${request.url}`)
    response.json({ message: "Welcome to the api!" })
})
// app.use("/*", (request, response) => {
//     console.log(`General endpoint, even though you *wanted* ${request.url}`)
//     response.json({ message: "Welcome!" })
// })

// if (true) {
if (process.env.NODE_ENV === "production") {
    // Implement Production React serving
    app.use(express.static(buildDirectory));
    app.use('/', function (req, res) {
        res.sendFile(path.join(buildDirectory, 'index.html'));
    });
    app.use('/*', function (req, res) {
        console.log(`General endpoint`)
        res.sendFile(path.join(buildDirectory, 'index.html'));
    });
}

// app.use("/api/test/:symbol", async (request, response) => {
//     const symbol = request.params.symbol
//     const tickData = poly.iterateTickPages(symbol, new Date().getTime() - millisInADay)
//     console.log("Begin count!", console.time(symbol))
//     let total = 0
//     let i = await tickData.next()
//     do {
//         total += i.value.results_count
//         console.log(total, (i.value as any).results[0].t)
//         i = await tickData.next()
//     }
//     while (!(await i).done)
//     console.log("End count!", console.timeLog(symbol))
//     response.send(i.value)
// })