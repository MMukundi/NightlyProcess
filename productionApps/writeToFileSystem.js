var axios = require ('axios')
const assert = require('assert');
var fs = require("fs")

// polygon key
let key =`TGH02yWO2sxsCHI_nwzD4Y7hlCJ0gXz02u6GWy`

// converts milliseconds to the date format polygon api expects
let milliToDate=function(date) {
  date= new Date(date)
  let year = date.getFullYear().toString()
  let month = (date.getMonth()+1).toString()
	let day = date.getDate().toString()
  if ((date.getDay() == 0) || (date.getDay() == 6)) {
		return null
	}
	if (day.length==1) {
		day='0'+day
	}
	if (month.length==1) {
		month='0'+month
	}
	date = `${year}-${month}-${day}`
  return date
}

// get the data from polygon
async function getData (date) {
	try {
		let response = await axios({
		method: 'get',
		url: `https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/${date}?apiKey=${key}`,
		config: { headers: {'Content-Type': 'application/json' }}
		})
		return response.data.results
	} catch (e) {
		alert(e);
	}
}

// wrapper to loop through the dates needed. Process the data returned from getData() and calls update to save it. 
async function getDates (days, startdate) {
	let d=new Date(startdate)
	let dates=[]
	for(let i=0;i<days;i++) {
		date=d-(i*86400000)
		date=milliToDate(date)
		if (date != null) {
			try {
				data = await getData(date)
				.then( (data) => {
					fs.writeFile(`./data/${date}.json`, JSON.stringify(data), (err) => { 
						if (err) { 
							console.log(err); 
						}  
					});
				})
				.catch((err) =>{
					console.log("Error", err)
				})
			} 
			catch {
				console.log("failed")
			}
		}
	}
}

// get number of days of history
console.log("get date array")

// pass number of days, starting day.

let dates = getDates(1,Date.now())
//console.log(Date.now())