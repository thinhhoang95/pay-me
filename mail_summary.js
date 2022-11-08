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

const prefixZeroInTimeRep = (x) => {
  if (x<10)
  {
    return "0" + String(x)
  } else {
    return String(x)
  }
}

const convertMinutesToHHMM = (minutes) => {
  let hour = Math.floor(minutes/60)
  let rMinute = Math.floor(minutes - hour * 60)
  console.log(hour)
  console.log(rMinute)
  console.log(minutes)
  return prefixZeroInTimeRep(hour) + ":" + prefixZeroInTimeRep(rMinute)
}

const composeSummary = () => {
    let timeSummary = []
    let timeSummaryTaskIds = []
    let taskSummary = []
    let datestamp = moment().add(-2, 'hour').format("YYYY-MM-DD")
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
                        timeSummaryTaskIds.push(r.subsub)
                    }
                })
            } else {
                timerDoc.report = []
            }
        }
    }).then(() => {
        db.collection('subsubHistory').doc(datestamp).get().then((snapshot2) => {
            let subDoc = []
            if (snapshot2.exists)
            {
                subDoc = snapshot2.data()
                if (subDoc.subsubs)
                {
                    subDoc.subsubs.forEach((s) => {
                        s.time = moment(s.time.toDate()).format("HH:mm:ss")
                    })
                }
                taskSummary = [...subDoc.subsubs]
            }
        }).then(() => {
            // Start to compose an email
            var mail = nodemailer.createTransport({
                service: "gmail",
                auth: {
                  user: "thinhhoang.vaccine@gmail.com",
                  pass: "myclutvuwumcfwez",
                },
              });

              let timeJoint = ""
              timeSummary.forEach((x) => {
                timeJoint += "\nTask: " + x.subsub + ". Duration: " + convertMinutesToHHMM(Number(x.duration/(60*1000))) + "."
              })

              let taskJoint = ""
              taskSummary.forEach((x) => {
                taskJoint += "\nTask: " + x.sname + ". Completed at: " + x.time + "."
              })

              let message = "Dear Thinh,\n\nThis is the summary for your work performance for the day of " + moment().add(-2, 'hour').format("ddd DD/MM/YYYY") + ". \n" + timeJoint + "\n" + taskJoint + "\n\nYou are punching it! Keep up the good work!\n\nYours sincerely,\nThe PayMeMobile Team."
    
              var mailOptions = {
                from: "thinhhoang.vaccine@gmail.com",
                to: "hdinhthinh@gmail.com",
                subject: "Performance Summary for " + moment().add(-2, 'hour').format("ddd DD/MM/YYYY"),
                text: message,
                attachments: [],
              };

              console.log(message)

              // Mail away!
              mail.sendMail(mailOptions, function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log("Email sent: " + info.response);
                }
              });
              
        })
    })
}

composeSummary()