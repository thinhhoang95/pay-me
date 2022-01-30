const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");
const reader = require("readline-sync"); //npm install readline-sync

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const checkListTask = [
    {
        "id": "DAILY",
        "checklist": [
            {
                "order": -1,
                "content": "Pens and pencils"
            },
            {
                "order": 0,
                "content": "Laptop, Power adapter, HDMI adapter"
            },
            {
                "order": 6,
                "content": "iPhone XR, Pixel 4a, chargers and headphone"
            },
            {
                "order": 2,
                "content": "Salary stamp"
            },
            {
                "order": 3,
                "content": "Galaxy Watch 4 and charger"
            },
            {
                "order": 4,
                "content": "Wallet: banking card, Tisseo card"
            },
            {
                "order": 5,
                "content": "Hat, glasses, sunglasses, masks, umbrella and alcoholic gel"
            },
            {
                "order": 1,
                "content": "Wear socks, change clothes, jacket up"
            },
            {
                "order": 7,
                "content": "Shopping bag"
            }
        ]
    }
]

const checkListSubTask = [
    {
        "id": "INFO THRY",
        "checklist": [
            {
                "order": 0,
                "content": "Viterbi's book, notes (blue file)"
            },
            {
                "order": 1,
                "content": "Calculator"
            }
        ]
    },
    {
        "id": "PROBA THRY",
        "checklist": [
            {
                "order": 0,
                "content": "Proba Thry Knill book chapters and notes (orange file)"
            },
            {
                "order" : 1,
                "content": "Stirzaker book"
            }
        ]
    }
]

const db = admin.firestore();

checkListTask.forEach((task) => {
    console.log("Process ID " + task.id)
    db.collection("checklist").doc(task.id).set(task)
})

checkListSubTask.forEach((task) => {
    console.log("Process ID " + task.id)
    db.collection("checklist").doc(task.id).set(task)
})