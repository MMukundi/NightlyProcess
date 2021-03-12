
const axios = require('axios')
const key = "TGH02yWO2sxsCHI_nwzD4Y7hlCJ0gXz02u6GWy"

async function getTicks(ticker, date, limit = 1000, ticks = [],t = 0) {


    let oddlotVolume = 0; let oddlotCount = 0; let volume = 0; let count = 0; let blockCount = 0; let blockVolume = 0;

    // just so we can copy and paste the url in a browser to check results
    let url = `https://api.polygon.io/v2/ticks/stocks/trades/${ticker}/${date}?timestamp=${t}&limit=${limit}&apiKey=${key}`
    // console.log("url : ", url)
    let resp = await axios({
        method: "get",
        url: url,
        config: { headers: { 'Content-Type': 'application/json' } }
    })

        // if the result set is equal to the limit , check for more records.
        .then((resp) => {
            ticks = ticks.concat(resp.data.results);
            if (resp.data.results_count == limit) {

                // get the timestamp for the last record.
                t = resp.data.results[resp.data.results.length - 1].t
                return getTicks(ticker, date, limit, ticks,t)

                // result count is less than limit so we must have gotten them all
            } else {
                // loop through and crunch the data points
                console.log(ticks)
                let ignore = new Set([15, 16, 38, 17]);	// ignore certain trade conditions
                for (let trade of ticks) {

                    // not all trades have a trade condition, if omitted it is considered a valid trade
                    if (trade.c == undefined) { trade.c = [0] }
                    if (trade.s !== 0) {
                        const found = trade.c.some(r => ignore.has(r)) // check for valid trade conditions
                        if (!found) {  // considered a valid trade 
                            volume += trade.s
                            count += 1
                            if (trade.s < 100) {
                                oddlotVolume += trade.s
                                oddlotCount += 1
                            }
                            if (trade.s >= 5000) {
                                blockCount += 1
                                blockVolume += trade.s
                            }
                        }
                    }
                }
                return ({
                    oddlotVolume,
                    oddlotCount,
                    volume,
                    count,
                    blockCount,
                    blockVolume
                })
            }
        })
        .catch((err) => {
            console.log(err)
            return err
        })
    return resp

}
module.exports = getTicks;

getTicks("PTEN", "2021-03-01").then((data) => { console.log(data) })