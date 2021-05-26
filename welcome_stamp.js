const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");
const reader = require("readline-sync"); //npm install readline-sync

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

var fs = require("fs");

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

const preprocess = async () => {
  return new Promise(async (resolve, reject) => {
    // Prompt for the number of timeunits
    let timeunits = reader.question("Amount of money: ");
    let content = reader.question("Content: ");
    let stampValue = Number(timeunits)
    console.log('The stamp value is: ' + stampValue.toFixed(2))
    // Add this stamp to the database for claim from the app
    let sn = make_serial(5,5)
    const stampRef = db.collection("salary").doc(sn);
    stampRef.set({
      'sn': sn,
      'content': content + ". Generated at " + moment().toISOString() + '.',
      'claimed': false,
      'value': stampValue
    });
    resolve();
  });
};

preprocess();