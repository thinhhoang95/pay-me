const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
const db = admin.firestore();
let now = moment().toDate();

const removeExpiredTasks = () => {
    db.collection('subtasks').get().then((snapshot) => {
        snapshot.forEach((docSnapshot) => {
            let task = docSnapshot.data()
            let taskExpiryDate = task.expiredDate.toDate()
            if (taskExpiryDate<now)
            {
                // Remove these tasks safely
                let snToRemove = task.sn
                db.collection('subtasks').doc(snToRemove).delete().then(() => {
                    console.log('Removed sn: ', snToRemove)
                })
            }
        })
    })
}

const fixHabits = (param) => {
    let now = moment().set('hour', 2).set('minute', 0).set('second', 0).set('millisecond', 0).toDate()
    if (param == 'tomorrow')
    {
        now = moment().set('hour', 2).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day').toDate()
    } else if (param == 'yesterday')
    {
        now = moment().set('hour', 2).set('minute', 0).set('second', 0).set('millisecond', 0).add(-1, 'day').toDate()
    }
    db.collection('habits').get().then((snapshot) => {
        snapshot.forEach((docSnapshot) => {
            let habit = docSnapshot.data()
            let id = habit.id
            habit.start = habit.max * 0.25
            habit.current = habit.max * 0.5
            habit.count = 0
            habit.lastDone = admin.firestore.Timestamp.fromDate(now)
            delete habit.lastReset
            delete habit.lastStreakLoss
            delete habit.nextReset
            delete habit.tomorrow
            db.collection('habits').doc(id).set(habit).then(() => {
                console.log('Habit ID ' + id + ' updated. New start: ' + habit.start.toFixed(2) + ', new current: ' + habit.current.toFixed(2))
            })
        })
    })
}

removeExpiredTasks()
fixHabits('today')