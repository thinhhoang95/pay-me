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
    id: "SHOWER",
    name: "Take a shower",
    descr: "Take a shower every 2 mornings",
    start: 1.0,
    increment: 0.25,
    current: 1.25,
    max: 3.0,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 2,
  },
  {
    id: "DINNER",
    name: "Cook dinner properly: vegetables and meat",
    descr: "Dinners must be prepared properly for the best health",
    start: 2.0,
    increment: 0.25,
    current: 2.0,
    max: 4.0,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 1,
  },
  {
    id: "DISHES",
    name: "Do the dishes",
    descr: "Wash the dishes every evening",
    start: 1.5,
    increment: 0.3,
    current: 1.8,
    max: 4.0,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 1,
  },
  {
    id: "BRUSHM",
    name: "Brush your teeth",
    descr: "Brush your teeth",
    start: 0.5,
    increment: 0.08,
    current: 0.5,
    max: 1.0,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 1,
    count: 0,
    maxCount: 2,
  },
  {
    id: "TRASH",
    name: "Take out the trash",
    descr: "Take out the trash",
    start: 0.75,
    increment: 0.12,
    current: 0.75,
    max: 1.6,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 3,
  },
  {
    id: "WASHF",
    name: "Wash your face 3 times a day",
    descr: "Wash your face 3 times a day",
    start: 0.5,
    increment: 0.18,
    current: 0.5,
    max: 1.6,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 1,
    count: 0,
    maxCount: 3,
  },
  {
    id: "WASHC",
    name: "Wash your clothes once a week",
    descr: "Wash your clothes once a week",
    start: 2.5,
    increment: 0.35,
    current: 2.5,
    max: 5.5,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 7,
  },
];

// Delete all habits
db.collection("habits")
  .get()
  .then((snapshot) => {
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    batch.commit().then(() => {
      console.log("All old habits deleted");
      // Add new habits into the database
      habits.forEach((habit) => {
        const docRef = db.collection("habits").doc(habit.id);
        docRef.set(habit);
      });
      console.log("Habits collection updated");
    });
  })
  .then(() => {
    console.log("First GET promise done");
  });
