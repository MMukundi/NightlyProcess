const mongoose = require('mongoose')
const Schema = mongoose.Schema

const results = new Schema({
	name: {
		type:String,
		required:true
	},
	date: {
		type: String,
		required:true
	},
	ticker: {
		type: String,
		required:true
	},
	close: {
		type: Number
	},
	vol: {
		type: Number
	}
})
mongoose.set('useCreateIndex', true);
results.index({ ticker: 1, date: 1}, { unique: true });
module.exports = mongoose.model('results',results)