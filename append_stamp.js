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
            fs.readFile(process.argv[3], "utf8", (err, data) => {
              if (err) {
                console.error(err);
                return;
              }
              let fileContent = JSON.parse(data);
              fileContent = fileContent[0];

              // Compare docContent and fileContent
              // 1. Extend the expiry date if necessary
              if (fileContent.expired.indexOf("day") >= 0) {
                let expiresInXDays = Number(fileContent.expired.split(" ")[0]);
                // console.log(expiresInXDays + 'XDAYS')
                let newExpired = moment()
                  .set("hour", 2)
                  .add(expiresInXDays, "day");
                docContent.expired = newExpired.toISOString();
                docContent.expiredDate = newExpired.toDate();
              } else {
                docContent.expired = fileContent.expired;
                docContent.expiredDate = moment(fileContent.expired).toDate();
              }
              // 2. Change the tname and description
              docContent.tname = fileContent.tname;
              docContent.description = fileContent.description;
              docContent.finish = fileContent.finish;
              // 3. Add the subs (if missing)
              if (fileContent.hasOwnProperty("subs")) {
                if (!docContent.hasOwnProperty("subs")) {
                  docContent.subs = [];
                }
                fileContent.subs.forEach((fsub) => {
                  let processThisFSub = true;
                  if (fsub.hasOwnProperty("unselected")) {
                    if (fsub.unselected == 1) {
                      processThisFSub = false;
                      console.log('Skipping fsub ' + fsub.sname)
                    }
                  }
                  if (processThisFSub) {
                    let subExisted = false;
                    docContent.subs.forEach((dsub) => {
                      if (
                        dsub.sname.toLowerCase() == fsub.sname.toLowerCase()
                      ) {
                        // There is a matching sub with the same name
                        console.log("Transfer sub " + fsub.sname);
                        subExisted = true;
                        dsub.finish = fsub.finish; // transfer the finish reward
                        if (fsub.hasOwnProperty("subsubs")) {
                          // Transfer the subsubs
                          if (!dsub.hasOwnProperty("subsubs")) {
                            dsub.subsubs = [];
                          }
                          fsub.subsubs.forEach((fsubsub) => {
                            let subsubExisted = false;
                            dsub.subsubs.forEach((dsubsub) => {
                              if (
                                dsubsub.name.toLowerCase() ==
                                fsubsub.name.toLowerCase()
                              ) {
                                subsubExisted = true;
                                // Transfer the subsub info
                                dsubsub.name = fsubsub.name;
                                dsubsub.finish = fsubsub.finish;
                                console.log(
                                  "  Transfer subsub " + fsubsub.name
                                );
                              }
                            });
                            if (!subsubExisted) {
                              // fsubsub needs to be appended into dsub.subsubs
                              let subsubToAppend = Object.assign({}, fsubsub);
                              subsubToAppend.sn = make_serial(5, 6);
                              dsub.subsubs.push(subsubToAppend);
                              console.log("  Append subsub " + fsubsub.name);
                            }
                          });
                        } // transfer the subsubs
                      } // transfer the sub of same name
                    }); // dsub loop - check for existed subs
                    if (!subExisted) {
                      // append fsub into docContent.subs
                      // fsub needs to be appended to dsub
                      let subToAppend = Object.assign({}, fsub);
                      subToAppend.sn = make_serial(5, 6);
                      if (subToAppend.hasOwnProperty("subsubs")) {
                        subToAppend.subsubs.forEach((ss) => {
                          ss.sn = make_serial(5, 6);
                          console.log("  Making serial for subsub " + ss.name);
                        });
                      }
                      // console.log(docContent.subs)
                      docContent.subs.push(subToAppend);
                      console.log("Append sub " + fsub.sname);
                    }
                  }
                });
              }
              // console.log(docContent)
              db.collection("subtasks")
                .doc(dbSn)
                .set(docContent)
                .then(() => {
                  console.log("Stamp transferred and updated");
                });
            });
          });
      }
    });
    console.log("Search completed.");
  });
