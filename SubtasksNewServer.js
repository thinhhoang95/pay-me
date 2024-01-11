const moment = require('moment')
const fetch = require('node-fetch')

const firestorex = () => {
    let res = {
        "collectionName": "",
        "collection": (name) => {
            res.collectionName = name;
            return res;
        },
        "docName": null,
        "doc": (name) => {
            res.docName = name;
            return res;
        },
        "get": async () => {
            if (res.docName != null && res.docName != "") {
                // Get a specific subtask from the collection
                return new Promise(async (resolve, reject) => {
                    try {
                        let querySnapshot = await getSubtaskById(res.collectionName, res.docName)
                        resolve(querySnapshot)
                    } catch (error) {
                        reject(error)
                    }
                })
            } else {
                // Get all subtasks from the collection
                return new Promise(async (resolve, reject) => {
                    try {
                        let querySnapshots = await getSubtasks(res.collectionName)
                        resolve(querySnapshots)
                    } catch (error) {
                        reject(error)
                    }
                })
            }
        },
        "set": async (data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    await saveSubtask(res.docName, data) // practicalId is res.docName
                    resolve()
                } catch (error) {
                    reject(error)
                }
            })
        },
        "update": async (data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    await saveSubtask(res.docName, data) // practicalId is res.docName
                    resolve()
                } catch (error) {
                    reject(error)
                }
            })
        },
        "delete": async () => {
            return new Promise(async (resolve, reject) => {
                try {
                    await deleteSubtask(res.docName) // practicalId is res.docName
                    resolve()
                } catch (error) {
                    reject(error)
                }
            })
        }
    }
    return res;
}

const getQuerySnapshots = async (dataJson) => {
    // dataJson is an array of objects
    let result = {
        size: dataJson.length
    }
    for(let i = 0; i < dataJson.length; i++) {
        result[i] = {
            data: () => dataJson[i],
            id: dataJson[i].practicalId,
            exists: true
        }
    }
    result.forEach = (callback) => {
        for(let i = 0; i < dataJson.length; i++) {
            callback(result[i])
        }
    }
    result.map = (callback) => {
        let mappedResult = []
        for(let i = 0; i < dataJson.length; i++) {
            mappedResult.push(callback(result[i]))
        }
        return mappedResult
    }
    // console.log(result)
    // Object.setPrototypeOf(result, Array.prototype);
    // console.log(result)
    return result
}

const getQuerySnapshot = async (dataJson) => {
    // dataJson is an object
    let result = {
        data: () => dataJson,
        id: dataJson.practicalId,
        exists: true
    }
    // console.log(result)
    // Object.setPrototypeOf(result, Array.prototype);
    // console.log(result)
    return result
}

const dateWrapper = (dateStr) => {
    return {
        toDate: () => moment(dateStr).toDate(),
        toString: () => {
            if (dateStr == null) {
                return null
            }
            if (dateStr == "") {
                return ""
            }
            return moment(dateStr).toISOString()
        },
        toJSON: () => moment(dateStr).toISOString()
        // date: moment(dateStr).toDate()
    }
}

const parseDateForSubtasks = (jsonObject) => {
    // convert jsonObject.expiredDate to a Date object
    if (jsonObject.hasOwnProperty('expiredDate')) {
        jsonObject.expiredDate = dateWrapper(jsonObject.expiredDate)
    }
    // convert jsonObject.validFrom to a Date object
    if (jsonObject.hasOwnProperty('validFrom')) {
        jsonObject.validFrom = dateWrapper(jsonObject.validFrom)
    }
    if (jsonObject.hasOwnProperty('subs')) {
        jsonObject.subs.forEach((sub) => {
            // convert sub.validFromDate to a Date object
            if (sub.hasOwnProperty('validFromDate')) {
                sub.validFromDate = dateWrapper(sub.validFromDate)
            }
            // convert sub.expiryDate to a Date object
            if (sub.hasOwnProperty('expiryDate')) {
                sub.expiryDate = dateWrapper(sub.expiryDate)
            }
            // convert sub.tuCountedDate to a Date object
            if (sub.hasOwnProperty('tuCountedDate')) {
                sub.tuCountedDate = dateWrapper(sub.tuCountedDate)
            }
            // convert sub.tuUpdatedDate to a Date object
            if (sub.hasOwnProperty('tuUpdatedDate')) {
                sub.tuUpdatedDate = dateWrapper(sub.tuUpdatedDate)
            }
        })
    }
    return jsonObject
}

const getSubtasks = async (collectionName) => {
    if (collectionName == null)
    {
        throw new Error("Collection name is null");
    }
    if (collectionName == "subtasks")
    {
        // perform fetch https://paymemobile.fr/subtasks
        const response = await fetch('https://paymemobile.fr/subtasks')
        console.log("Response", response)
        const data = await response.json()
        console.log("JSON Response", data)
        // console.log(data)
        let parsedDateForData = data.map((jsonObject) => {
            parseDateForSubtasks(jsonObject)
            return jsonObject
        })
        console.log(parsedDateForData)
        return await getQuerySnapshots(parsedDateForData)
    }
}

const getSubtaskById = async (collectionName, docName) => {
    if (collectionName == null)
    {
        throw new Error("Collection name is null");
    }
    if (collectionName == "subtasks")
    {
        // perform fetch https://paymemobile.fr/subtasks
        const response = await fetch('https://paymemobile.fr/subtask?practicalId=' + docName)
        const data = await response.json()
        console.log("JSON Response")
        console.log(data)
        let parsedDateForData = parseDateForSubtasks(data)
        console.log("parsedDateForData", parsedDateForData)
        return await getQuerySnapshot(parsedDateForData)
    }
}

const saveSubtask = async (practicalId, data) => {
    data.practicalId = practicalId
    if (data.hasOwnProperty("_id"))
    {
        delete data._id
    }
    console.log(JSON.stringify(data))
    // perform post https://paymemobile.fr/subtasks
    const response = await fetch('https://paymemobile.fr/saveSubtask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: "data=" + JSON.stringify(data)
    })
    const responseData = await response.json()
    console.log(responseData)
}

const deleteSubtask = async (practicalId) => {
    // perform post https://paymemobile.fr/subtasks
    const response = await fetch('https://paymemobile.fr/deleteSubtask?practicalId=' + practicalId)
    const responseData = await response.json()
    console.log(responseData)
}

module.exports = firestorex;