const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const fs = require("fs");

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
        db.collection("subtasks")
          .doc(dbSn)
          .get()
          .then((snapshot) => {
            let docContent = snapshot.data();
            fs.readFile("task_daily_checklist.json", "utf8", (err, data) => {
              if (err) {
                console.error(err);
                return;
              }
              console.log(data)
              let fileContent = JSON.parse(data);
              fileContent = fileContent[0];
              if (fileContent.hasOwnProperty('subs'))
              {
                  fileContent.subs.forEach((fsub) => {
                      if (docContent.hasOwnProperty('subs'))
                      {
                          docContent.subs.forEach((dsub) => {
                              if (dsub.sname == fsub.sname)
                              {
                                  // Matching sub, sync subsubs
                                  if (fsub.hasOwnProperty('subsubs'))
                                  {
                                      fsub.subsubs.forEach((fsubsub) => {
                                          let deleted = true 
                                          dsub.subsubs.forEach((dsubsub) => {
                                              if (dsubsub.name == fsubsub.name)
                                              {
                                                  // Found a match between local and server copies
                                                  deleted = false
                                              }
                                          })
                                          if (deleted)
                                          {
                                              // The subsub is deleted
                                              console.log('Remove subsub ' + fsubsub.name)
                                              fsub.subsubs = fsub.subsubs.filter((x) => x.name != fsubsub.name)
                                          }
                                      })
                                  }
                              }
                          })
                      }
                  })
              }
              // Save the new file
              fs.writeFile('task_daily_checklist.json', JSON.stringify([fileContent]), err => {
                if (err) {
                console.error(err)
                return
                }
                console.log('Successfully wrote the stamp content to task_daily_checklist.json.')
                console.log('Please go ahead, edit this file and call append_stamp with set option to update')
            })
            });
          });
      }
    });
    console.log("Search completed.");
  });
