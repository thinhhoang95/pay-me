const xlsx = require('xlsx2json')
const path = require('path');

// const csv_path = path.join(__dirname, 'task.xlsx')
const csv_path = path.join("/Users/thinhhoang/Library/CloudStorage/OneDrive-Personal/", "task.xlsx")
const fs = require('fs')

xlsx(csv_path, {
    'sheet': 'Tasks',
    'dataStartingRow': 2,
    'keysRow': 1
}).then((jArr)=>{
    afterParsingHandler('tasks', jArr)
})

xlsx(csv_path, {
    'sheet': 'Subs',
    'dataStartingRow': 2,
    'keysRow': 1
}).then((jArr)=>{
    afterParsingHandler('subs', jArr)
})

xlsx(csv_path, {
    'sheet': 'Subsubs',
    'dataStartingRow': 2,
    'keysRow': 1
}).then((jArr)=>{
    afterParsingHandler('subsubs', jArr)
})

let allData = {
    'tasks': null,
    'subs': null,
    'subsubs': null
}

const afterParsingHandler = (key, data) => {
    allData[key] = data
    if (allData.tasks && allData.subs && allData.subsubs)
    {
        // All parsing code completed
        let obj = []
        allData.tasks.forEach((task) => {
            // Create a task 
            let jTask = Object.assign({}, task)
            console.log(task)
            jTask.finish = Number(task.finish)
            jTask.unselected = Number(task.unselected)
            // Find all jTask's subs
            let jSubs = allData.subs.filter(s => s.id == jTask.id)
            if (jSubs.length > 0)
            {
                jSubs.forEach((sub) => {
                    delete sub.id
                    sub.finish = Number(sub.finish)
                    sub.unselected = Number(sub.unselected)
                    if (sub.countUp == '1')
                    {
                        sub.countUp = 1
                        if (sub.hasOwnProperty('time'))
                        {
                            delete sub.time
                        }
                    } else {
                        delete sub.countUp
                    }
                    if (sub.hasOwnProperty('time'))
                    {
                        sub.time = Number(sub.time)
                    }
                    // For each sub, find all subsubs
                    let jSubSubs = allData.subsubs.filter(ss => ss.sname == sub.sname)
                    if (jSubSubs.length > 0)
                    {
                        jSubSubs.forEach(jss => {
                            delete jss.sname
                            jss.finish = Number(jss.finish)
                        })
                        sub.subsubs = jSubSubs
                    }
                })
                jTask.subs = jSubs
            }
            console.log(jTask)
            console.log('---')
            obj.push(jTask)
        })
        // Write to file
        let strToWrite = JSON.stringify(obj)
        fs.writeFile('csv_tasks.json', strToWrite, err => {
            if (err) {
            console.error(err)
            return
            }
            console.log('Successfully wrote the stamp content to csv_tasks.json.')
            console.log('Call task_choosefile_pos_pdf_checklist or append_stamp to update the database')
        })
    } else {
        console.log('Waiting for other parsing threads...')
    }
}