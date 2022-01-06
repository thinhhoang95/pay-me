require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const fs = require("fs");
const moment = require("moment")
const reader = require("readline-sync")

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

let sn = process.argv[2];
let autoTimePayUpdate = process.argv[4];
let dayToWriteInDescription = Number(reader.question("What shall I write in description? 0 for today, 1 for tomorrow, etc..."))

db.collection("subtasks")
  .listDocuments()
  .then((ref) => {
    const snsFound = ref.map((x) => x.id);
    // console.log(snsFound)
    snsFound.forEach((dbSn) => {
      if (dbSn.indexOf(sn) != -1) {
        console.log("Found SN " + dbSn);
        // sn = snsFound[0]
        fs.readFile(process.argv[3], "utf8", (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          let fileContent = JSON.parse(data);
          fileContent = fileContent[0];
          // Change the description
          if (String(sn).toLowerCase() == 'daily')
          {
            // Daily stamp, auto update the description!
            fileContent.description = "Plan for " + moment().add(dayToWriteInDescription, 'day').format("DD/MM/YYYY")
            // Make the stamp valid from today
            fileContent.validFrom = moment().add(dayToWriteInDescription, 'day').set('hour', 2).set('minute', 0).set('second', 0).toDate()
          }
          // Extend the expiry date if necessary
          if (fileContent.expired.indexOf("day") >= 0) {
            let expiresInXDays = Number(fileContent.expired.split(" ")[0]);
            // console.log(expiresInXDays + 'XDAYS')
            let newExpired = moment()
              .set("hour", 2)
              .add(expiresInXDays, "day");
            fileContent.expired = newExpired.toISOString();
            fileContent.expiredDate = newExpired.toDate();
          } else {
            fileContent.expired = fileContent.expired;
            fileContent.expiredDate = moment(fileContent.expired).toDate();
          }
          // Delete all subs with status unselected
          fileContent.subs = fileContent.subs.filter(item => item.unselected != '1')
          // Update the reward
          // Update finish reward if param auto is set:
          autoTimePayUpdate = "auto"
          fileContent.subs.forEach((s) => 
          {
            if (autoTimePayUpdate == "auto") {
              console.log('Adjusting finish reward for sub ' + s.sname)
              if (s.hasOwnProperty('time'))
              {
                s.finish = s.time * 0.5;
              }
              if (s.hasOwnProperty('countUp'))
              {
                if (s.countUp == 1)
                {
                  s.finish = 0.5
                }
              }
            }
            // Add SN to subs
            s.sn = make_serial(5,6)
            // Add SN to subsubs
            if (s.hasOwnProperty('subsubs'))
            {
              s.subsubs.forEach((ss) => {
                ss.sn = make_serial(5,6)
              })
            }
          })
          db.collection("subtasks").doc(dbSn).update(fileContent).then((writeResult) => {
            console.log("Stamp " + dbSn + " has been replaced successfully!")
          })
        })
      }
    })
  })
