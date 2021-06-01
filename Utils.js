import fetch from 'node-fetch'

function toQueryString(t) {
    let qString = ""
    for (let key in t) {
        qString += `${key}=${t[key]}&`
    }
    return qString
}
function replaceInUrl(apiString) {
    return (t) => {
        let s = apiString
        for (let key in t) {
            s = s.replace(`{${key}}`, t[key] ? t[key].toString() : "")
        }
        return s
    }
}

const attemptLimit = 10
export function wait(ms){
    return new Promise((res,rej)=>{
        setTimeout(res,ms,true)
    })
}
export async function exponentialBackoff(getData) {
    const errors = []
    for(let attempt = 0,delay = 1; attempt < attemptLimit;attempt++,delay*=2){
        try {
            const data = await getData()
            return data;
        } catch (error) {
            errors.push(error)
            await wait(delay)
        }
    }
    throw ({
        message: `Unsuccessful after ${errors.length} attempts`,
        errors
    })
}
// type PolygonResponse<T> = ({error?:string}&T)
export function apiRequester(baseUrl,baseOptions = {}){
    return function (endpoint, baseReturnValue = {}) {
        const replacer = replaceInUrl(endpoint)
        // type ResponseOptions = URLOptions&QueryOptions
        return (apiOptions) => {
            const fullOptions = {...baseOptions,...apiOptions,}
            const makeRequest = () => fetch(`${baseUrl}/${replacer(fullOptions)}?${toQueryString(fullOptions)}`).then(resp => resp.json())
            // .then(d=>{console.log(`https://api.polygon.io/${replacer(apiOptions)}?${toQueryString(apiOptions)}${keyQuery}`,d);return d})
    
            return exponentialBackoff(makeRequest).then((data) => ({ ...baseReturnValue, ...data }))
    
                // .catch((error:ErrorType)=>({...baseReturnValue,...error}))
                .catch(console.log)
        }
    }
}
// export function exponentialBackoff(getData) {
//     async function attempt(errors = []) {
//         return new Promise(
//             (resolve, reject) => {
//                 if (errors.length < attemptLimit) {
//                     getData().then(resolve).catch(
//                         (e) => {
//                             errors.push(e)
//                             setTimeout(() =>
//                                 attempt(errors).then(resolve).catch(reject)
//                                 , 1 << errors.length)
//                         })
//                 } else {
//                     const error = {
//                         message: `Unsuccessful after ${errors.length} attempts`,
//                         errors
//                     }
//                     reject(error)
//                 }
//             }
//         )
//     }
//     return attempt()
// }
