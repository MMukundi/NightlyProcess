import { parentPort } from 'worker_threads'
import { getTicks } from '../functions/getTicks.js'
import mongoose from "mongoose"
import config from "../config.js"

parentPort.on('message', async (eodInfo) => {
    await mongoose.connect(config.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(async (e) => {
        const data = await getTicks(eodInfo.ticker, eodInfo.date)
        parentPort.postMessage(data)
    })
});
