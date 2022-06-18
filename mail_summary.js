const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");
const moment = require("moment")

const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");

const reader = require("readline-sync")
const path = require("path")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const composeSummary = () => {
    let timeSummary = []
    let timeSummaryTaskIds = []
    let taskSummary = []
    let datestamp = moment().add(-2, 'hour').format("DD/MM/YYYY")
    db.collection('timerHistory').doc(datestamp).get().then((snapshot) => {
        let timerDoc = {}
        if (snapshot.exists)
        {
            timerDoc = snapshot.data()
            if (timerDoc.report)
            {
                timerDoc.report.forEach((r) => {
                    if (timeSummaryTaskIds.indexOf(r.subsub) > -1)
                    {
                        timeSummary[timeSummary.findIndex((x) => x.subsub == r.subsub)].duration += r.duration
                    } else {
                        timeSummary.push({subsub: r.subsub, duration: r.duration})
                    }
                })
            } else {
                timerDoc.report = []
            }
        }
    }).then(() => {
        db.collection('subsubHistory').doc(datestamp).get().then((snapshot2) => {
            let subDoc = {}
            if (snapshot2.exists)
            {
                subDoc = snapshot2.data()
                taskSummary = Object.assign({}, subDoc.subsubs)
            }
        })
    }).then(() => {
        console.log(timeSummary)
        console.log(taskSummary)
    })
}

composeSummary()