const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
const db = admin.firestore();
const fs = require('fs')

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

const truncateString = (str, len) => {
    if (str.length > len)
    {
      return str.substring(0, len)
    } else {
      return str
    }
  }

    let sn = process.argv[2]
    db.collection('subtasks').listDocuments().then((ref) => {
        const snsFound = ref.map(x => x.id)
        snsFound.forEach((dbSn) => {
            if (dbSn.indexOf(sn) != -1)
            {
                console.log('Found SN ' + dbSn)
                // sn = snsFound[0]
                db.collection('subtasks').doc(dbSn).get().then((snapshot) => {
                    let docContent = snapshot.data()
                    if (docContent.subs)
                    {
                        docContent.subs.forEach((s) => {
                            if (s.originalFinish)
                            {
                                s.finish = s.originalFinish
                            } else {
                                console.log('Did not update stamp reward for sub ' + s.sname + ' because the originalFinish field was not found')
                            }
                            if (s.originalTime)
                            {
                                s.time = s.originalTime
                            } else {
                                console.log('Did not update stamp reward for sub ' + s.sname + ' because the originalTime field was not found')
                            }
                        })
                        console.log(docContent.expired)
                        docContent.expiredDate = moment().add(3, 'day').toDate()
                        docContent.expired = moment().add(3, 'day').toISOString()
                        console.log('Extend expiredDate to 3 days from today')
                        docContent.description = "Task plan for " + moment().format("DD/MM/YYYY")
                        db.collection('subtasks').doc(dbSn).set(docContent).then(() => console.log('Database updated for ' + dbSn))
                    } else {
                        console.log('This stamp does not contain any subsubtasks')
                    }
                })
            }
        })
        console.log('Search completed.')
    })
