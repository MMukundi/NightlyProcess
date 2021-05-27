// import Eod from './Eod'
// import Trade from './Trade'
// import Averages from './Averages'
import mongoose from "mongoose"
import EOD from "./eods.js"
const Schema = mongoose.Schema;

let Tickers = new Schema({
	logo: {
			type: String
	},
	
	exchange: {
			type: String,
			required: true
	},
	name: {
			type: String,
			required: true
	},
	symbol: {
			type: String,
			required: true
	},
	cik: {
			type: String
	},
	bloomberg: {
			type: String
	},
	lei: {
			type: String
	},
	sic: {
			type: String
	},
	country: {
			type: String
	},
	industry: {
			type: String
	},
	sector: {
			type: String
	},
	marketcap: {
			type: String
	},
	employees: {
			type: String
	},
	phone: {
			type: String
	},
	ceo: {
			type: String
	},
	url: {
			type: String
	},
	desctiption: {
			type: String
	},
	similar: {
			type: Array
	},
	tags: {
			type: Array
	},
	minTimestamp: {
			type: Schema.Types.Number,
			default: Infinity
	},    
	maxTimestamp: {
			type: Schema.Types.Number,
			default: -Infinity
	},
	averages:{
		volume : Number,
		range : Number,
		weighted: Number,
		count : Number
	}
});
export default mongoose.model('Tickers', Tickers);