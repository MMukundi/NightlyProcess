// type Calculation<Input, Output> = (input: Input) => Output
// type CalculationResults<OutputTypes> = { [calculation in keyof OutputTypes]: { [inputsUsed: number]: OutputTypes[calculation] } }
// type IntermediateCalculationResults<OutputTypes> = Partial<CalculationResults<OutputTypes>>
// type CalculationOptions = { runOnAll: boolean, outputAfter: number[] }
// const DefaultOptions: CalculationOptions = { runOnAll: true, outputAfter: [1] }
const DefaultOptions = { runOnAll: true, outputAfter: [1] }
async function* bactchIterator(iterator, batchSize = 10, minBatchSize = batchSize){
    let outputArray = []
    // const iteratorObject= outputArray[Symbol.iterator]()
    let currentIteratorValue =await iterator.next() 
    while(outputArray.length<batchSize&&!currentIteratorValue.done){
        outputArray.push(currentIteratorValue.value)
        currentIteratorValue =await iterator.next() 
    }
    if(outputArray.length>=minBatchSize)
        yield outputArray
    // currentIteratorValue =iterator.next() 
    while(!currentIteratorValue.done){
        outputArray.shift()
        outputArray.push(currentIteratorValue.value)
        yield outputArray
        currentIteratorValue =await iterator.next() 
    }
    while(outputArray.length>minBatchSize){
        outputArray.shift()
        yield outputArray
    }
}
async function runCalculations(inputs, calculations, options){
    // const outputs:CalculationResults<CalculationOutputs> = {}
    const iterator = inputs[Symbol.iterator]()
    return runIteratorCalculations(iterator, calculations, options)
}
async function runIteratorCalculations(inputIterator, calculations,options){
    const Options = Object.assign({}, DefaultOptions, options);
    if (Options.outputAfter.length === 0) {
        //In this case, the iterator wouldn't be consumed or used, and we need to return
        return null
    }
    Options.outputAfter.sort()
    let iteratorResult
    const results= {}
    for (let calculationName in calculations)
        results[calculationName] = {}
    let resultIndex = 0
    let nextResultIndex = Options.outputAfter.shift() 
    let processOthers = Options.runOnAll ? () => {
        for (let calculationName in calculations) {
            calculations[calculationName](iteratorResult.value)
        }
    } : () => { }
    for (iteratorResult = await inputIterator.next(); !(iteratorResult==undefined? false: iteratorResult.done || isNaN(nextResultIndex));iteratorResult = await inputIterator.next(),resultIndex++) {
        // Iterate to the next valid input
        while (resultIndex < nextResultIndex) {
            processOthers()
            resultIndex++
            iteratorResult = await inputIterator.next()
            if (iteratorResult.done) {
                break
            }
        }
        if (iteratorResult.done) break


        //Store the input
        for (let calculationName in calculations) {
            results[calculationName][nextResultIndex ] = calculations[calculationName](iteratorResult.value)
        }
        nextResultIndex = Options.outputAfter.shift() 

    }
    // do {
    //     console.log(`Waiting until index ${nextResultIndex}`)
    //     // Iterate to the next valid input
    //     while (resultIndex != nextResultIndex) {
    //         iteratorResult = await inputIterator.next()
    //         console.log("Skipping over ",iteratorResult)
    //         if (iteratorResult.done) break
    //         processOthers()
    //         resultIndex++
    //     }
    //     if (iteratorResult.done) break
    //     //Store the input
    //     if (resultIndex === nextResultIndex) {
    //         for (let calculationName in calculations) {
    //             results[calculationName][resultIndex + 1] = calculations[calculationName](iteratorResult.value)
    //         }
    //         nextResultIndex = Options.outputAfter.shift() - 1
    //     }

    // }while(!(iteratorResult?.done))
    return results
}
// let total = 0
// let count = 0
// let strings: { [key: number]: string } = { 0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten" }
// let longestStringNumber = 1
// runCalculations([0,1, 2, 3, 4, 5, 6, 7, 8, 9], {
//     avg: (n) => {
//         total += n
//         count++
//         return total / count
//     }, longestString(n) {
//         longestStringNumber = strings[longestStringNumber].length < strings[n].length ? n : longestStringNumber
//         return strings[longestStringNumber]
//     }
//     ,string(n) {
//         return strings[n]
//     }
// }, { outputAfter: [1,9]}).then(console.log)
export { runCalculations, runIteratorCalculations,bactchIterator }