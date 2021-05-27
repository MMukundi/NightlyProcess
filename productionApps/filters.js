const Filters = [
	{ name: "ALL PASS", min: 0, max: 0, filter: () => true },
	{ name: "ALL PASS2", min: 0, max: 0, filter: () => true },
	nDaysUp(3),
	nDaysDown(3),
	{ name: "Gap Up", min: -1, max: 0, filter: gapUp },
	{ name: "Gap Down", min: -1, max: 0, filter: gapDown },
]
Filters.forEach(calcDays)
function calcDays(filter) {
	filter.minIndex = Math.min(filter.min, 0)
	filter.maxIndex = Math.max(filter.max, 0)
	filter.days = filter.maxIndex - filter.minIndex + 1
	return filter.days
}
async function setFilter(doc, filter) {
	await doc.updateOne({ $addToSet: { filtersPassed: filter.name } })
}
function nDaysUp(n) {
	return {
		name: `${n} Days Up`,
		// days: n + 1,
		min: - n, max: 0,
		filter: (data, i) => {
			const start = i - n;
			for (let day = start; day < i; day++) {
				if (data[day + 1].c <= data[day].o)
					return false;
			}
			return true;
		}
	}
}
function nDaysDown(n) {
	return {
		name: `${n} Days Down`,
		// days: n + 1,
		min: - n, max: 0,
		filter: (data, i) => {
			const start = i - n;
			for (let day = start; day < i; day++) {
				if (data[day + 1].c >= data[day].o)
					return false;
			}
			return true;
		}
	}
}
function gapUp(series, i) {
	return series[i].l > series[i - 1].h
}
function gapDown(series, i) {
	return series[i].h < (series[i - 1].l)
}

module.exports = {Filters,setFilter}