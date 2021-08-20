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
    order: 2,
    name: "Take a shower",
    descr: "Take a shower every 2 mornings",
    start: 0,
    increment: 0.1,
    current: 0,
    max: 1.10,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 2
  },
  {
    id: "DINNER",
    order: 7,
    name: "Cook dinner properly: vegetables and meat",
    descr: "Dinners must be prepared properly for the best health",
    start: 0,
    increment: 0.1,
    current: 0,
    max: 1.60,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 1,
  },
  {
    id: "DISHE",
    name: "Do the dishes in the evening",
    order: 8,
    descr: "Wash the dishes every evening",
    start: 0,
    increment: 0.1,
    current: 0,
    max: 1.20,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 1
  },
  {
    id: "DISHA",
    name: "Do the dishes in the afternoon",
    order: 6,
    descr: "Wash the dishes every afternoon",
    start: 0,
    increment: 0.1,
    current: 0,
    max: 1.20,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 1
  },
  {
    id: "BRUSHM",
    order: 1,
    name: "Brush your teeth (morning)",
    descr: "Brush your teeth",
    start: 0,
    increment: 0.1,
    current: 0,
    max: 0.6,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 1
  },
  {
    id: "BRUSHE",
    order: 9,
    name: "Brush your teeth (evening)",
    descr: "Brush your teeth",
    start: 0,
    increment: 0.1,
    current: 0,
    max: 0.6,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 1
  },
  {
    id: "TRASH",
    order: 4,
    name: "Take out the trash",
    descr: "Take out the trash",
    start: 0,
    increment: 0.1,
    current: 0,
    max: 0.8,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 3,
  },
  {
    id: "WASHF",
    order: 3,
    name: "Wash your face 3 times a day",
    descr: "Wash your face 3 times a day",
    start: 0.0,
    increment: 0.1,
    current: 0,
    max: 0.8,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 1,
    count: 0,
    maxCount: 3,
  },
  {
    id: "WASHC",
    order: 10,
    name: "Wash your clothes once a week",
    descr: "Wash your clothes once a week",
    start: 0,
    increment: 0.5,
    current: 0,
    max: 2.5,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 7,
  },
  {
    id: "LUNCH",
    order: 5,
    name: "Carefully prepare lunch",
    descr: "Carefully prepare lunch",
    start: 0,
    increment: 0.1,
    current: 0,
    max: 1.6,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 1,
  },
  {
    id: "RUNNING",
    order: 20,
    name: "Sportive activity",
    descr: "Good health is important for everything!",
    start: 0,
    increment: 0.5,
    current: 0,
    max: 1.5,
    created: new Date(),
    lastDone: new Date(),
    autoReset: 2,
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
