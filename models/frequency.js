import mongoose from "mongoose"
const Schema = mongoose.Schema

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
export default mongoose.model('frequency',frequency)