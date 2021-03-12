import { millisIn90MarketDays } from './Common.mjs'
import { storeAllDailies } from './Databasing.mjs'
import { floorToNearestDay } from './PolygonUtils.mjs'

function store() {
    let now = floorToNearestDay(Date.now())
    storeAllDailies(now - millisIn90MarketDays, now)
}
store()