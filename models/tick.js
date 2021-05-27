const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Tick = new Schema({
		T:{
			type:String
		},

		I: {
			type: String
		},
		x: {
			type: Number
		},
		p: {
			type: Number
		},
		i: {
			type: String
		},
		e: {
			type: Number
		},
		r: {
			type: Number
		},
		t: {
			type: Number
		},
		y: {
			type: Number
		},
		f: {
			type: Number
		},
		q: {
			type: Number
		},
		c: {
			type: Array
		},
		s: {
			type: Number
		},
		z: {
			type: Number
		}
	})
	Tick.index({T:1, i: 1,x: 1, r: 1}, { unique: true });
	module.exports = mongoose.model('Tick',Tick);
