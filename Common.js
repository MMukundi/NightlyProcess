// import {IV2HistoricTradesResultFormatted,ITradeV2Formatted} from 'polygon.io/src/rest/stocks/v2HistoricTrades'
// export type {IAggResponseFormatted as AggregateResponse,IAggV2Formatted as AggregateData} from 'polygon.io/src/rest/stocks/aggregates'
// export type {ITradeV2Formatted as HistorcTradesData} from 'polygon.io/src/rest/stocks/v2HistoricTrades'
// export type {ITickerDetailsFormatted as TickerInfo} from 'polygon.io/src/rest/reference/tickerDetails'
// export type {ITickers as TickersInfo} from 'polygon.io/src/rest/reference/tickers'
// export type HistorcTradesResponse= (IV2HistoricTradesResultFormatted& { results: ITradeV2Formatted[]})
// The number of milliseconds in a day
const millisInADay = 86400000
//The number of milliseconds in 90 days
const millisIn90Days = 7776000000
// 90 *     Days
// 24 *     Hours/Day
// 60 *     Minutes/Hour
// 60 *     Seconds/Minute
// 1000     Millis/Second
const millisIn90MarketDays = 10886400000
// 86400000 *   Millis/Day
// (7/5) *      Days/MarketDay
// 90           MarkeyDays
export {millisIn90Days,millisInADay,millisIn90MarketDays}