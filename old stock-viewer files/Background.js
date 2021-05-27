import { millisIn90MarketDays } from './Common.js'
import { storeAllDailies } from './Databasing.js'
import { floorToNearestDay } from './PolygonUtils.js'

function store() {
    let now = floorToNearestDay(Date.now())
    storeAllDailies(now - millisIn90MarketDays, now)
}
store()