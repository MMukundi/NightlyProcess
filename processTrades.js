import { parentPort } from 'worker_threads'
import { getTrades } from './getTrades.js'

parentPort.on('message', async (eodInfo) => {
    // parentPort.postMessage({})
    const data = await getTrades(eodInfo.ticker, eodInfo.date)
    parentPort.postMessage(data)
});
parentPort.on('close', async (eodInfo) => {
    parentPort.close();
});

parentPort.on('exit', async (eodInfo) => {
    parentPort.close();
});