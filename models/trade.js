import mongoose from "mongoose"
const Schema = mongoose.Schema;

let Trade = new Schema({
		T:{
			type:String
		},
		x: {
			type: Number
		},
		p: {
			type: Number
		},
		i: {
			type: Number
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
	Trade.index({T:1, i: 1,x: 1, r: 1}, { unique: true });
	export default mongoose.model('Trade',Trade);
