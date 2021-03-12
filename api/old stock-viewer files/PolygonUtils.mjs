// import StockData from "../src/StockViewer";
import { config } from 'dotenv'
import fetch from 'node-fetch'
import { millisInADay, millisIn90Days, millisIn90MarketDays} from './Common.mjs'
// import {ITickerDetailsFormatted as TickerResponse} from 'polygon.io/lib/rest/reference/tickerDetails'
config()
export const keyQuery = `apiKey=${process.env.API_KEY}`

//https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/${date}?apiKey=${key}
//
function toQueryString(t){
    let qString = ""
    for(let key in t){
        qString+=`${key}=${t[key]}&`
    }
    return qString
}
function replaceInUrl(apiString){
    return (t)=>{
        let s = apiString
        for(let key in t){
            s=s.replace(`{${key}}`,t[key].toString())
        }
        return s
    }
}
// type PolygonResponse<T> = ({error?:string}&T)
function apiRequest(apiURL, baseReturnValue={}){
    const replacer = replaceInUrl(apiURL)
    // type ResponseOptions = URLOptions&QueryOptions
    return (apiOptions)=>
        fetch(`https://api.polygon.io/${replacer(apiOptions)}?${toQueryString(apiOptions)}${keyQuery}`).then(resp=>resp.json())
        // .then(d=>{console.log(`https://api.polygon.io/${replacer(apiOptions)}?${toQueryString(apiOptions)}${keyQuery}`,d);return d})
        .then((data)=>({...baseReturnValue,...data}))
        // .catch((error:ErrorType)=>({...baseReturnValue,...error}))
}
//<{page:number},{},{page:number,perPage:number,count:number,tickers:TickersInfo[]}>
export const getTickerPage = apiRequest("v2/reference/tickers",{tickers:[]})
//<{ticker:string,multiplier:number,timespan:string,from:number,to:number},{},AggregateResponse>
export const getDailies = apiRequest("v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{from}/{to}",{results:[]})
//<{ticker:string,date:string},{limit:number,timestamp:number},HistorcTradesResponse>
export const getTicksPage = apiRequest("v2/ticks/stocks/trades/{ticker}/{date}",{results:[]})
//<{ticker:string},{},TickerInfo>
export const getInfo = apiRequest("v1/meta/symbols/{ticker}/company")
//<{date:string},{},{results:{T,v,o,c,h,l,t}[]}>
export const getGroupedDaily = apiRequest("v2/aggs/grouped/locale/us/market/stocks/{date}",{results:[]})
// export const client = restClient(process.env.API_KEY)



export async function* iterateTickers(){
    let total = 0
    let data
    let resp
    let page = 1
    do {
        let polyResp = await getTickerPage({page})
        // count = count===undefined?polyResp.count:count
        resp=polyResp
        total+=polyResp.tickers.length
        for(let data of polyResp.tickers){
            yield data
        }
        page++
    } while (total<resp.count)
    return null
}

// export function* getTickers(){
//     let nextPageTime = date
//     const dateString = toUTCString(nextPageTime)
//     let bufferSize: number
//     // As long as this isn't the last call (the buffer was maxed out)
//     // Or the pointer is still within range, there is more data so keep looping
//     let data: HistorcTradesResponse
//     do {
//         data = await getTicksPage({ticker:symbol,date:dateString,limit:pageSize,timestamp:nextPageTime})
//         bufferSize = data.results_count
//         if (bufferSize > 0)
//             nextPageTime = data.results[bufferSize - 1].t
//         yield data
//     } while (bufferSize >= pageSize)
//     return data
// }

export const pageSize = 50000

export function roundToNearestMultiple(n, m) {
    return Math.round(n / m) * m
}
export function floorToNearestMultiple(n, m) {
    return Math.floor(n / m) * m
}
export function cielToNearestMultiple(n, m) {
    return Math.floor(n / m) * m
}
export function roundToNearestDay(timestamp) {
    return roundToNearestMultiple(timestamp, millisInADay)
}
export function cielToNearestDay(timestamp) {
    return cielToNearestMultiple(timestamp, millisInADay)
}
export function floorToNearestDay(timestamp) {
    return floorToNearestMultiple(timestamp, millisInADay)
}
export function toUTCString(date) {
    const dateObject = new Date(date)
    const month = dateObject.getUTCMonth() + 1
    const day = dateObject.getUTCDate()
    return `${dateObject.getUTCFullYear()}-${month > 9 ? month : `0${month}`}-${day > 9 ? day : `0${day}`}`
}
// export async function getInfo(symbol: string): Promise<TickerInfo> {
//     try {
//         return client.reference.tickerDetails(symbol) as Promise<TickerInfo>
//     } catch {
//         return null
//     }
// }
// export async function getTickers(): Promise<{ tickers: TickersInfo[] }> {
//     return client.reference.tickers()
// }
// export async function getDailies(symbol: string, start: number, end: number, step: number): Promise<AggregateResponse> {
//     console.log("HIUHUJASEFD")
//     try {
        // return client.stocks.aggregates(symbol, 1, "day", start, end, { limit: pageSize }) as Promise<AggregateResponse>
//     } catch (e) {
//         console.log("E", e)
//         return {results:[]} as AggregateResponse
//     }
// }
/**
 * 
  logo?: string;
  exchange: string;
  name: string;
  symbol: string;
  listdate?: string;
  cik?: string;
  bloomberg?: string;
  figi?: string;
  legalEntityIdentifier?: string;
  standardIndustryClassification?: number;
  country?: string;
  industry?: string;
  sector?: string;
  marketcap?: number;
  employees?: number;
  phone?: string;
  ceo?: string;
  url?: string;
  description?: string;
  similar?: string[];
  tags?: string[];
  updated?: string;
 */
export function genStart(end) {
    return end - millisIn90MarketDays - millisInADay - millisInADay
}
export function genEnd(start) {
    return start + millisIn90MarketDays
}
export async function* iterateDailiesPages(symbol, start, end, step) {
    let pageStart = start
    let pageEnd = pageStart + pageSize * millisInADay
    let bufferSize
    // As long as this isn't the last call (the buffer was maxed out)
    // Or the pointer is still within range, there is more data so keep looping
    let data
    do {
        // console.log("HI!",symbol, pageStart, pageEnd, step)
        data = await getDailies({ticker:symbol, from:pageStart, to:pageEnd, multiplier:1,timespan:"day"})
        // console.log("HI2")
        bufferSize = data.resultsCount
        pageStart = pageEnd
        pageEnd = pageStart + pageSize * millisInADay
        yield data
    } while (bufferSize >= pageSize && pageStart<end)
    return data
}
export async function* iterateDailies(symbol, start, end, step) {
    for await (let page of iterateDailiesPages(symbol, start, end, step)) {
        for (let daily of page.results) {
            yield daily
        }
        // yield* page.results
    }
    return null
}
/**
 * Returns an iterator of the tick data
 * @param symbol 
 * @param date 
 */
export async function* iterateTickData(symbol, date) {
    for await (let page of iterateTickPages(symbol, date)) {
        for (let tick of page.results) {
            yield tick
        }
    }
    return null
}
export async function* iterateTickPages(symbol, date){
    let nextPageTime = date
    const dateString = toUTCString(nextPageTime)
    let bufferSize
    // As long as this isn't the last call (the buffer was maxed out)
    // Or the pointer is still within range, there is more data so keep looping
    let data
    do {
        data = await getTicksPage({ticker:symbol,date:dateString,limit:pageSize,timestamp:nextPageTime})
        bufferSize = data.results_count
        if (bufferSize > 0)
            nextPageTime = data.results[bufferSize - 1].t
        yield data
    } while (bufferSize >= pageSize)
    return data
}
// export default {roundToNearestDay,roundToNearestMultiple,getDailies, iterateDailies,iterateDailiesPages, getInfo, iterateTickData,iterateTickPages, getTickers, millisInADay, millisIn90Days, millisIn90MarketDays }

// The aggregates method expects the following values:
// ticker: string,
// multiplier: number,
// timespan: string,
// from: string,
// to: string,
// query?: IAggregateQuery

//Type of data:
// export interface IAggResponseFormatted {
//   ticker: string;
//   status: string;
//   adjusted: boolean;
//   queryCount?: number;
//   resultsCount?: number;
//   results: IAggV2Formatted[];
// }