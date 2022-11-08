const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const newTime = moment().add(1, 'day').set('hour', 2).set('minute', 0).set('second', 0).set('millisecond', 0).toDate()

db.collection("habits").get().then((querySnapshot) => {
    querySnapshot.forEach((snapshot) => {
        let doc = snapshot.data()
        console.log('Now updating ' + doc.id)
        db.collection("habits").doc(doc.id).update(
            {
                lastDone: newTime,
                count: 0,
                current: 0
            }
        )
    })
})

console.log('Program completed')