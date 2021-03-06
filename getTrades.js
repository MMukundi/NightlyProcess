const key = process.env.API_KEY
import * as PolygonUtils from './PolygonUtils.js'
// import mongoose from "mongoose"
import Frequency from "./models/frequency.js"
import mongoose from "mongoose"
import config from "./config.js"

mongoose.connect(config.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })

function getFrequency(trades){
    return trades.reduce((frequencies, trade) => {
        const price = formatPriceString(trade.p);
        if (frequencies[price] == null) frequencies[price] = 0;
        frequencies[price]+=(trade.s);
        return frequencies;
    }, {});
} 
function formatPriceString(price){
    return parseFloat(price).toFixed(2);
}
async function storeFrequencies(ticker, trades) {
    const frequency = getFrequency(trades)
    const tickerRecord = await Frequency.findOne({ticker})||await Frequency.create( {ticker, frequencyTable: []});;
    
    for (const [priceString, volume] of Object.entries(frequency)) {
        const price = +(priceString)

        const freqTableItem = tickerRecord.frequencyTable.find(
            (tableItem) => tableItem.price === price,
        );

        if (!freqTableItem) {
            tickerRecord.frequencyTable.push({
                price,
                volume,
            });
        } else {
            freqTableItem.volume += volume;
        }
    }
    await tickerRecord.save()
    return 'done';
}

export async function getTrades(ticker, date, invalidConditions = [15, 16, 38, 17], limit = 50000) {
    // Initialization of all the values we want to store
    let oddlotVolume = 0; let oddlotCount = 0; let volume = 0; let count = 0; let blockCount = 0; let blockVolume = 0;

    // The set of invalid trade condition
    const conditionsToIgnore = new Set(invalidConditions)

    // The data as returned from polygon
    let data;

    // The timestamp offset of the current page of trade data
    let t = 0;

    do {

        data = await PolygonUtils.getTradesPage({ timestamp: t, limit, date, ticker })
        if (data.results.length == 0) break;

        t = data.results[data.results_count - 1].t
        // loop through and crunch the data points as they come in
        for (let trade of data.results) {
            // not all trades have a trade condition, if omitted it is considered a valid trade
            if (trade.c == undefined) { trade.c = [0] }
            if (trade.s !== 0) {
                const found = trade.c.some(c => conditionsToIgnore.has(c)) // check for valid trade conditions
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
        storeFrequencies(ticker, data.results)
    }
    while (data.results_count == limit);
    // if the result set is equal at the limit there are more records, so check for more.

    // Once the result count is less than limit, we must have gotten them all
    const tradeSummary = {
        oddlotVolume,
        oddlotCount,
        volume,
        count,
        blockCount,
        blockVolume
    }
    return tradeSummary
}

