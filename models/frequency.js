const mongoose = require('mongoose')
const Schema = mongoose.Schema

// const frequency = new Schema({
// 	ticker : {
// 		type: String,
// 		required:true
// 	},
// 	price : {
// 		type: Number,
// 		required:true
// 	},
// 	volume: {
// 		type: Number,
// 		required: true
// 	}
// })
const frequency = new Schema({
    ticker: {
        type: String,
        required: true,
    },
    frequencyTable: [
        {
            price: Number,
            volume: Number,
        },
    ],
})

frequency.index({ ticker: 1 }, { unique: true });
mongoose.set('useCreateIndex', true);
module.exports = mongoose.model('frequency',frequency)