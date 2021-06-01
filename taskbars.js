import cliProgress from 'cli-progress'
import _colors from "colors"
export const progressBars = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format:`[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | {task}`

}, cliProgress.Presets.shades_grey);

export const Tasks = {}
// function format(options, params, payload){
//     // bar grows dynamically by current progress - no whitespaces are added
//     const bar = options.barCompleteString.substr(0, Math.round(params.progress*options.barsize));

//     // end value reached ?
//     // change color to green when finished
//     if (params.value >= params.total){
//         return `# ${params.eta}s ${_colors.grey(payload.task)}   ${_colors.green(params.value + '/' + params.total)} --[${bar}]--`;
//     }else{
//         return `# ${params.eta}s ${payload.task}   ${_colors.yellow(params.value + '/' + params.total)} --[${bar}]--`;
//     }
// }
export function beginTask(taskName, totalCount){
    const bar = progressBars.create(totalCount,0, {task:taskName})
    Tasks[taskName] = {
        start: Date.now(),
        bar,
        progress:0,
        progressDelta:1/totalCount,
    }
}
export function incrementTask(taskName){
    const task = Tasks[taskName]
    if(task==undefined){
        throw new Error(`Task ${taskName} does not exist`)
    }
    task.bar.increment()
    // task.progress+=task.progressDelta
    // const elapsed = Date.now()-task.start
    // const secondsRemaining = Math.round((elapsed/task.progress-elapsed)/1000)
    // const minutesRemaining = Math.round(secondsRemaining/60) 
    // progressBars.incrementTask(taskName, {message:`~ ${minutesRemaining} min (${secondsRemaining} s)`, percentage: task.progressDelta })
}

export function endTask(taskName){
    const {bar} = Tasks[taskName]
    bar?.stop()
    progressBars.remove(bar)
    delete Tasks[taskName]
    // progressBars.done(taskName)
}
export function closeTasks(){
    progressBars.stop()
}


// ! Old code, with multi-progress-bars library
// import { MultiProgressBars } from 'multi-progress-bars'

// export const progressBars = new MultiProgressBars({ anchor: "bottom", border: true, persist: false });

// export const Tasks = {}

// export function beginTask(taskName, totalCount) {
//     progressBars.addTask(taskName, { type: "percentage" })
//     Tasks[taskName] = {
//         start: Date.now(),

//         progress: 0,
//         progressDelta: 1 / totalCount,
//     }
// }
// export function incrementTask(taskName) {
//     const task = Tasks[taskName]
//     task.progress += task.progressDelta
//     const elapsed = Date.now() - task.start
//     const secondsRemaining = Math.round((elapsed / task.progress - elapsed) / 1000)
//     const minutesRemaining = Math.round(secondsRemaining / 60)
//     progressBars.incrementTask(taskName, { message: `~ ${minutesRemaining} min (${secondsRemaining} s)`, percentage: task.progressDelta })
// }

// export function endTask(taskName) {
//     if (Tasks[taskName]) {
//         delete Tasks[taskName]
//         progressBars.done(taskName)
//     }
// }
// export function closeTasks() {
//     // progressBars.cleanup()
//     process.exit()
// }


// ! Expirimental

// export const Tasks = {}
// let newTasks = 0
// export function beginTask(taskName, totalCount){
//     newTasks++
//     Tasks[taskName] = {
//         start: Date.now(),
//         count:0,
//         totalCount
//     }
// }
// export function incrementTask(taskName){
//     Tasks[taskName].count++
//     // console.log()
// }

// export function endTask(taskName){
//     const task = Tasks[taskName]
//     console.log(taskName,Date.now()-task.start)
//     delete Tasks[taskName]
// }
// export function closeTasks(){
//     // progressBars.cleanup()
//     process.exit()
// }

// function showTasks(){
//     const toClear = Object.keys(Tasks).length-newTasks+1
//     for(let i = 0; i < toClear;i++){
//         console.log("\x1B[F\x1B[F\x1B[K")
//     }
//     console.log(newTasks,toClear)
//     for(const taskName in Tasks){
//         const task = Tasks[taskName]
//         const elapsed = Date.now()-task.start
//         const percent = task.count/task.totalCount
//         const secondsRemaining = Math.round((elapsed/percent-elapsed)/1000)
//         const minutesRemaining = Math.round(secondsRemaining/60) 
//         console.log(`${taskName} | ${Math.round(percent*100)}% | ${minutesRemaining} min (${secondsRemaining} s) ${elapsed}`)

//     }
//     newTasks = 0
//     setTimeout(showTasks,166)
// }
// showTasks()