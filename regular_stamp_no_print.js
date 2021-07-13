const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
// console.log(tasks)
// console.log(tasks[1])

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

serial_number = make_serial(5, 5);
const taskRef = db.collection("regular").doc(serial_number);
let task = {
    'sn': serial_number,
    'content': 'Challenge 1: get at least 12 P$ per day',
    'finish': 10.0,
    'expiryDate': moment().add(28, 'd').toDate()
}
taskRef.set(task);
console.log("Serial added to the database: ", serial_number)
console.log('Generate a QR code with the following content: {"regular": "1", "sn": "' + serial_number + '"}')
