import moment from "moment";
// const admin = require("firebase-admin");
// const serviceAccount = require("./payme-node-key.json");
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });

import dbx from './SubtaskNewServer.js'

// const dbx = require("./SubtaskNewServer.js")
  
// const db = admin.firestore();
// const fs = require('fs')

const make_serial = (length, terms) => {
    var result = [];
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var charactersLength = characters.length;
    for (let term = 0; term < terms; term++) {
      for (var i = 0; i < length; i++) {
        result.push(
          characters.charAt(Math.floor(Math.random() * charactersLength))
        );
      }
      if (term != terms - 1) result.push("-");
    }
    return result.join("");
};

// const advanceTodos = async () => {
//   db.collection("todo").doc("default").get().then((snapshot) => {
//     if (snapshot.exists)
//     {
//       let docContent = snapshot.data()
//       // console.log(docContent)
//       let todos = docContent.todo
//       let newTodos = []
//       todos.forEach((t) => {
//         if (t.hasOwnProperty('deferUntil'))
//         {
//           // Set deferUntil to 1:59AM of the same day
//           let deferUntil = moment(t.deferUntil.toDate()).hour(1).minute(59).second(0).millisecond(0)
//           if (deferUntil.isBefore(moment())) // because this thing is run at 2AM
//           {
//             // deferUntil is in the past
//             newTodos.push({...t, deferUntil: moment().hour(2).minute(0).second(0).millisecond(0).toDate()})
//           } else {
//             newTodos.push(t)
//           }
//         } else {
//           newTodos.push(t)
//         }
//       })

//       db.collection("todo").doc("default").set({todo: newTodos}).then(() => {
//         console.log('Todo list updated')
//       })
//     } else {
//       console.log('Todo list not found')
//     }
// })
// }

const truncateString = (str, len) => {
    if (str.length > len)
    {
      return str.substring(0, len)
    } else {
      return str
    }
}

    // advance Todos: DO NOT AUTOMATICALLY ADVANCE TODOS
    // advanceTodos()

    let sn = process.argv[2]
    console.log("Searching for SN " + sn)
    dbx().collection('subtasks').get().then((ref) => {
      console.log(ref)
        const snsFound = ref.map(x => x.id)
        snsFound.forEach((dbSn) => {
            if (dbSn.indexOf(sn) != -1)
            {
                console.log('Found SN ' + dbSn)
                // sn = snsFound[0]
                dbx().collection('subtasks').doc(dbSn).get().then((snapshot) => {
                    let docContent = snapshot.data()
                    let totalReward = 0
                    if (docContent.subs)
                    {
                        docContent.subs.forEach((s) => {
                            if (s.hasOwnProperty('originalFinish'))
                            {
                                s.finish = s.originalFinish
                                s.initialFinish = s.originalFinish
                            } else {
                                console.log('Did not update stamp reward for sub ' + s.sname + ' because the originalFinish field was not found')
                            }
                            if (s.hasOwnProperty('originalTime'))
                            {
                                s.time = s.originalTime
                            } else {
                                console.log('Did not update stamp reward for sub ' + s.sname + ' because the originalTime field was not found')
                            }
                            totalReward += s.finish
                        })
                        console.log(docContent.expired)
                        docContent.totalReward = totalReward
                        docContent.expiredDate = moment().add(3, 'day').toDate()
                        docContent.expired = moment().add(3, 'day').toISOString()
                        console.log('Extend expiredDate to 3 days from today')
                        docContent.description = "Task plan for " + moment().format("DD/MM/YYYY")
                        dbx().collection('subtasks').doc(dbSn).set(docContent).then(() => console.log('Database updated for ' + dbSn))
                    } else {
                        console.log('This stamp does not contain any subsubtasks')
                    }
                })
            }
        })
        console.log('Search completed.')
    })
