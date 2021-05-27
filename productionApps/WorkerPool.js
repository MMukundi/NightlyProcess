const { combinationsReplacement } = require('simple-statistics')
const { Worker, SHARE_ENV } = require('worker_threads')
function mod(m, n) {
    return ((m % n) + n) % n
}
class Queue {
    constructor(size) {
        this.data = new Array(size)
        this.front = 0
        this.rear = 0

        this.count = 0
        this.size = size
    }
    add(item) {
        if (this.count < this.size) {
            this.data[this.rear] = item
            this.rear = mod((this.rear + 1), this.size)
            this.count++
            return true
        }
        return false
    }
    remove() {
        if (this.count) {
            const item = this.data[this.front]
            this.front = mod((this.front - 1), this.size)
            this.count--
            return item
        }
        return null
    }
}
class EQNode {
    constructor(data, next) {
        this.data = data
        this.next = next
    }
}
class DynamicQueue {
    constructor() {
        this.head = null
        this.tail = null
    }
    add(item) {
        const newNode = new EQNode(item, null)
        if (this.tail) {
            this.tail.next = newNode
            this.tail = newNode
        } else {
            this.head = this.tail = newNode
        }
    }
    remove() {
        if (this.head) {
            const removed = this.head
            this.head = this.head.next
            // this.tail = newNode
            if (this.head == null) {
                this.tail = null
            }
            return removed.data
        }
    }
    empty() {
        return this.head == null
    }
}
class WorkerPool {
    constructor(path, capacity = 10) {
        this.path = path

        // this.taskQueue = []
        this.tasks = new DynamicQueue()
        this.idleWorkers = []

        for (let i = 0; i < capacity; i++) {
            this.addWorker()
        }
    }
    returnToPool(worker) {
        if (!this.tasks.empty()) {
            const {data,callback,error} = this.tasks.remove()
            this.runWorker(worker,data,callback,error)
        } else {
            if(!this.idleWorkers.includes(worker))
            this.idleWorkers.push(worker)
        }
    }
    runWorker(worker,data,callback,error){
        // console.log(data,callback,error)
        worker.callback = callback
        worker.error = error
        worker.postMessage(data)
    }
    addWorker() {
        const worker = new Worker(this.path, { env: SHARE_ENV });
        this.idleWorkers.push(worker)
        // console.log(`Now there are ${this.idleWorkers.length}`)
        worker.on('message', (data) => {
            if (worker.callback) {
                worker.callback(data)
                worker.callback = null
            }
            this.returnToPool(worker)
        })
        worker.on('error', (error) => {
            if (worker.error) {
                worker.error(error)
                worker.error = null
            }
            this.returnToPool(worker)
        })

    }
    run(data, callback,error) {
        if (this.idleWorkers.length == 0) {
            this.tasks.add({data,callback,error})
            return
        }
        const workerToUse = this.idleWorkers.pop()

        this.runWorker(workerToUse,data,callback,error)
    }
}

class WorkerBee {
    constructor(path) {
        this.path = path

        this.tasks = new DynamicQueue()
        
        this.running = false

        const worker = new Worker(this.path, { env: SHARE_ENV });
        
        worker.on('message', (data) => {
            if (worker.callback) {
                worker.callback(data)
                worker.callback = null
            }
            this.returnToPool()
        })
        worker.on('error', (error) => {
            if (worker.error) {
                worker.error(error)
                worker.error = null
            }
            this.returnToPool()
        })
        this.worker = worker
    }
    returnToPool() {
        if (!this.tasks.empty()) {
            const {data,callback,error} = this.tasks.remove()
            this.runWorker(data,callback,error)
        }else{
            this.running = false
        }
    }
    runWorker(data,callback,error){
        this.worker.callback = callback
        this.worker.error = error
        this.worker.postMessage(data)
        this.running = true
    }
    run(data, callback,error) {
        if (this.running) {
            this.tasks.add({data,callback,error})
            return
        }
        this.runWorker(data,callback,error)
    }
}
module.exports = {WorkerPool,WorkerBee}