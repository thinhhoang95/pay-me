const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
const db = admin.firestore();
const fs = require('fs')

let action = process.argv[2];

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

if (action == 'get')
{
    let sn = process.argv[3]
    db.collection('subtasks').listDocuments().then((ref) => {
        const snsFound = ref.map(x => x.id)
        snsFound.forEach((dbSn) => {
            if (dbSn.indexOf(sn) != -1)
            {
                console.log('Found SN ' + dbSn)
                // sn = snsFound[0]
                db.collection('subtasks').doc(dbSn).get().then((snapshot) => {
                    let docContent = snapshot.data()
                    // Write this docContent to a file
                    let strToWrite = JSON.stringify(docContent)
                    fs.writeFile('edit.json', strToWrite, err => {
                        if (err) {
                        console.error(err)
                        return
                        }
                        console.log('Successfully wrote the stamp content to edit.json.')
                        console.log('Please go ahead, edit this file and call edit_stamp with set option to update')
                    })
                })
            }
        })
        console.log('Search completed.')
    })
} else if (action == 'set')
{
    // TODO: Set stamp here
    // First, loop through all subs to ensure SN is filled in
    fs.readFile('edit.json', 'utf8' , (err, data) => {
        if (err) {
          console.error(err)
          return
        }
        let stamp = JSON.parse(data)
        if (stamp.hasOwnProperty('subs'))
        {
            stamp.subs.forEach((sub) => {
                if (!sub.hasOwnProperty('sn'))
                {
                    sub.sn = make_serial(5,6)
                    console.log('SN adjusted for ' + sub.sname)
                }
                if (sub.hasOwnProperty('sn') && sub.sn == '')
                {
                    sub.sn = make_serial(5,6)
                    console.log('SN adjusted for ' + sub.sname)
                }
                if (sub.hasOwnProperty('subsubs'))
                {
                    sub.subsubs.forEach((subsub) => {
                        if (!subsub.hasOwnProperty('sn'))
                        {
                            subsub.sn = make_serial(5,6)
                            console.log('SN adjusted for ' + subsub.name)
                        }
                        if (subsub.hasOwnProperty('sn') && subsub.sn == '')
                        {
                            subsub.sn = make_serial(5,6)
                            console.log('SN adjusted for ' + subsub.name)
                        }
                    })
                }
            })
        }
        stamp.expiredDate = moment(stamp.expired).toDate()
        delete stamp.totalAmount
        delete stamp.completedAmount
        db.collection('subtasks').doc(stamp.sn).set(stamp).then(() => {
            console.log('Database updated successfully!')
        })
      })
} else {
    console.log('Missing parameter: get or set')
}