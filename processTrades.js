import { parentPort } from 'worker_threads'
import { getTrades } from './getTrades.js'
import mongoose from "mongoose"
import config from "./config.js"

parentPort.on('message', async (eodInfo) => {
    await mongoose.connect(config.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(async (e) => {
        // parentPort.postMessage({})
        const data = await getTrades(eodInfo.ticker, eodInfo.date)
        parentPort.postMessage(data)
    })
});
