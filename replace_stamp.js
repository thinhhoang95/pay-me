require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const fs = require("fs");
const moment = require("moment")

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
            if (moment().get("hour") >=0 && moment().get("hour") <= 2)
            {
              // The time is now between 0AM and 2AM, description will be made for today
              fileContent.description = "Plan for " + moment().add(0, 'day').format("DD/MM/YYYY")
            } else {
            fileContent.description = "Plan for " + moment().add(1, 'day').format("DD/MM/YYYY")
            }
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
          })
          db.collection("subtasks").doc(dbSn).update(fileContent).then((writeResult) => {
            console.log("Stamp " + dbSn + " has been replaced successfully!")
          })
        })
      }
    })
  })
