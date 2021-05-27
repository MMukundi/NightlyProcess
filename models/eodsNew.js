const mongoose = require('mongoose')
const Schema = mongoose.Schema

const eod = new Schema({
	
	filtersPassed:[String],
	T:{
		type:String,
		required:true
	},
	t: {
		type:Number,
		required:true
	},
	o:{
		type:Number,
		required:true
	},
	h:{
		type:Number,
		required:true
	},
	l:{
		type:Number,
		required:true
	},
	c:{
		type:Number,
		required:true
	},
	v:{
		type:Number,
		required:true
	},
	vw:{
		type:Number
	},
	n:{
		type:Number
	},
	r:{
		type:Number
	},
	d:{
		type:String,
		required:true
	},
	oddlotVolume: {
		type:Number
	},
    oddlotCount: {
		type:Number
	},
    volume: {
		type:Number
	},
    count:{
		type:Number
	},
    blockCount:{
		type:Number
	},
    blockVolume: {
		type:Number
	},
	count_day90: {
		type:Number
	},
		count_day60: {
			type:Number
		},
		count_day30: {
			type:Number
		},
		count_day15: {
			type:Number
		},
		count_day05: {
			type:Number
		},
		blockCount_day90: {
			type:Number
		},
		blockCount_day60: {
			type:Number
		},
		blockCount_day30: {
			type:Number
		},
		blockCount_day15: {
			type:Number
		},
		blockCount_day05: {
			type:Number
		},
		oddLotCount_day90: {
			type:Number
		},
		oddLotCount_day60: {
			type:Number
		},
		oddLotCount_day30: {
			type:Number
		},
		oddLotCount_day15: {
			type:Number
		},
		oddLotCount_day05: {
			type:Number
		},
		blockVolume_day90: {
			type:Number
		},
		blockVolume_day60: {
			type:Number
		},
		blockVolume_day30: {
			type:Number
		},
		blockVolume_day15: {
			type:Number
		},
		blockVolume_day05: {
			type:Number
		},
		oddLotVolume_day90: {
			type:Number
		},
		oddLotVolume_day60: {
			type:Number
		},
		oddLotVolume_day30: {
			type:Number
		},
		oddLotVolume_day15: {
			type:Number
		},
		oddLotVolume_day05: {
			type:Number
		},
		range_day90: {
			type:Number
		},
		range_day60: {
			type:Number
		},
		range_day30: {
			type:Number
		},
		range_day15: {
			type:Number
		},
		range_day05: {
			type:Number
		},
		weighted_day90: {
			type:Number
		},
		weighted_day60: {
			type:Number
		},
		weighted_day30: {
			type:Number
		},
		weighted_day15: {
			type:Number
		},
		weighted_day05: {
			type:Number
		},
		volume_day90: {
			type:Number
		},
		volume_day60: {
			type:Number
		},
		volume_day30: {
			type:Number
		},
		volume_day15: {
			type:Number
		},
		volume_day05: {
			type:Number
		}
})
eod.index({ T: 1, t: 1}, { unique: true });
mongoose.set('useCreateIndex', true);
module.exports = mongoose.model('eod',eod)