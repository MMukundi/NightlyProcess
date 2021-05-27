const Empty = { value: "Empty" }
const Fail = { value: "Fail" }

const DayBrackets = 
// {
//     left:'[',
//     right:']'
// }
{
    left:'(',
    right:')'
}

function unexpectedCharacter(c,i) {
    const line = new Error().stack.split('\n')[2].split(' ')
    return { message: `${c?`Unexpected Character at index ${i}, '${c},'`:`Unexpected End of Phrase`} in ${line[line.length-2]}`, value: Fail }
}
function matches(stringToMatch, stringIterator){
    const newIterator = stringIterator.clone()
    const matchIterator = stringToMatch[Symbol.iterator]()
    let toMatch= newIterator.next()
    for(const s of matchIterator){
        if(toMatch.value!=s){
            return unexpectedCharacter(toMatch.value,newIterator.index)
        }
        toMatch = newIterator.next()
    }
    return {value:stringToMatch,prev:toMatch}
}
function isAlpha(c){
    return ('a'<=c&&c<='z')||('A'<=c&&c<'Z')
}
function wrap(string,brackets){
    return `${brackets.left}${string}${brackets.right}`
}

function isEmptyString(iteratorValue) {
    return iteratorValue.done && iteratorValue.value == null
}

function parseNumber(stringIterator,iteratorValue = stringIterator.next()) {
    if (isEmptyString(iteratorValue)) return Empty

    let parsedString = ''

    if (iteratorValue.value == '-') {
        parsedString = '-'
        iteratorValue = stringIterator.next()
    }

    if (isNaN(iteratorValue.value)) return unexpectedCharacter(iteratorValue.value,stringIterator.index)
    parsedString += iteratorValue.value

    iteratorValue = stringIterator.next()
    while(!iteratorValue.done){
        const nextChar = iteratorValue.value
        if (isNaN(nextChar)) 
            break
        
        parsedString += nextChar
        iteratorValue = stringIterator.next()
    }

    return {value:+parsedString,prev:iteratorValue}
}
function parseDayIndex(stringIterator,iteratorValue = stringIterator.next()) {
    if (isEmptyString(iteratorValue)) return Empty
    if (iteratorValue.value != DayBrackets.left) return unexpectedCharacter(iteratorValue.value,stringIterator.index)

    let parsedString = DayBrackets.left
    const numberRes = parseNumber(stringIterator)
    const {value:number,prev:afterNumber} = numberRes
    // console.log(numberRes,stringIterator)
    if(number == Fail) return numberRes
    if (afterNumber.value != DayBrackets.right) return unexpectedCharacter(afterNumber.value,stringIterator.index)
    return {value:{dayIndex:number},prev:afterNumber }
}
function parseDayValue(stringIterator,iteratorValue = stringIterator.next()){
    const dayIndex = parseDayIndex(stringIterator,iteratorValue)
    if(dayIndex.value==Fail) return dayIndex
    iteratorValue = stringIterator.next()
    if(iteratorValue.value!='.')return unexpectedCharacter(iteratorValue.value,stringIterator.index)
    const prop = parseProp(stringIterator)
    if(prop.value==Fail) return unexpectedCharacter(prop.prev.value,stringIterator.index)
    return {value:{dayIndex:dayIndex.value.dayIndex,prop:prop.value}, prev:prop.prev}
}
function parseProp(stringIterator,iteratorValue = stringIterator.next()){
    let prop=''
    while(isAlpha(iteratorValue.value)){
        prop+=iteratorValue.value
        iteratorValue = stringIterator.next()
    }
    if(prop=='')return unexpectedCharacter(iteratorValue.value,stringIterator.index)
    return {value:prop,prev:iteratorValue}
}
function parseValue(stringIterator,iteratorValue = stringIterator.next()) {
    if (isEmptyString(iteratorValue)) return Empty
    if (iteratorValue.value == DayBrackets.left) return parseDayValue(stringIterator,iteratorValue)
    return parseNumber(stringIterator,iteratorValue)
}

function setupIterator(iterator,string){
    const defaultNext = iterator.next.bind(iterator)
    iterator.index = -1
    iterator.next=()=>{
        iterator.index++
        return defaultNext()
    }
    iterator.clone=()=>{
        const newIterator = string[Symbol.iterator]()
        setupIterator(newIterator)
        while(newIterator.index!=iterator.index){
            newIterator.next()
        }
        return newIterator
    }
}

function parse(string) {
    const iterator = string[Symbol.iterator]()
    setupIterator(iterator,string)
    console.log(parseValue(iterator))
}

// String Tests
parse("")
parse("s")
parse("sky")
parse("ski")
parse("skybox")
parse("sk")

// Number Tests
// parse("-")
// parse("-s")
// parse("-s")
// parse("12")
// parse("123")
// parse("-123")

// Index Tests
parse(wrap('-',DayBrackets))
parse(wrap('-s',DayBrackets))
parse(wrap('s-',DayBrackets))
parse(wrap('12',DayBrackets))
parse(wrap('123',DayBrackets))
parse(wrap('-123',DayBrackets))
parse(`${wrap('-123',DayBrackets)}.j`)
parse("1")
parse("-1")