const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Habits to be rewarded
const habits = [
    {
        'id': 'SHOWER',
        'name': 'Take a shower',
        'descr': 'Take a shower every 2 mornings',
        'start': 1.00,
        'increment': 0.25,
        'current': 1.00,
        'max': 3.00,
        'created': new Date(),
        'lastDone': new Date(),
        'autoReset': 52
    },
    {
        'id': 'DISHES',
        'name': 'Do the dishes',
        'descr': 'Wash the dishes every evening',
        'start': 1.50,
        'increment': 0.30,
        'current': 1.00,
        'max': 4.00,
        'created': new Date(),
        'lastDone': new Date(),
        'autoReset': 25
    }
]

// Delete all habits
db.collection('habits').get().then((snapshot) => {
    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
    })
    batch.commit()
    console.log('All old habits deleted')
}).then(() => {
    // Add new habits into the database
    habits.forEach((habit) => {
        const docRef = db.collection('habits').doc(habit.id)
        docRef.set(habit)
    })
    console.log('Habits collection updated')
})


