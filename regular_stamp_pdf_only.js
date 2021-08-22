const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");

const reader = require("readline-sync"); //npm install readline-sync

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
// console.log(tasks)
// console.log(tasks[1])

var fs = require("fs");
const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");

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

serial_number = make_serial(5, 6);
const taskRef = db.collection("regular").doc(serial_number);

let content = reader.question("Enter the content for the regular stamp: ");
let amountOfMoney = reader.question("Enter amount of money: ");

let task = {
  sn: serial_number,
  content: content,
  finish: Number(amountOfMoney),
  expiryDate: moment().add(14, "d").toDate(),
};
taskRef.set(task);
console.log("Serial added to the database. Printing stamp...");

let today = moment().format("ddd DD/MM/YYYY HH:mm:ss");

// >>> Generate a digital paycheck (PDF file)
fs.readFile("regulars.html", "utf8", function (err, data) {
  if (err) {
    return console.log(err);
  }
  // Fill in the form
  var result = data.replace("$$TODAY$$", today);
  result = result.replace(
    "$$EXPIRES$$",
    moment().add(14, "day").format("ddd DD/MM/YYYY HH:mm")
  );
  result = result.replace(
    "$$CPAY$$",
    Number(amountOfMoney).toFixed(2).toString()
  );
  result = result.replace("$$DESCR$$", content);
  result = result.replace("$$STAMP$$", JSON.stringify({...task, regular: 1}));
  // console.log(result);
  fs.writeFile("regularsd.html", result, "utf8", function (err) {
    if (err) return console.log(err);

    (async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(
        "file://C:/Users/nxf67027/Documents/PayMe/regularsd.html"
      );
      await page.pdf({
        path: "regular.pdf",
        format: "A4",
        margin: {
          top: "40px",
          left: "40px",
          right: "40px",
          bottom: "30px",
        },
      });
      await browser.close();
    })().then(() => {
      // Send the PDF file via email to myself
      var mail = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "thinhhoang.vaccine@gmail.com",
          pass: "Thinh24051995#",
        },
      });

      var mailOptions = {
        from: "thinhhoang.vaccine@gmail.com",
        to: "hdinhthinh@gmail.com",
        subject: "Regular PayMeMobile check generated on " + today,
        text: "Hello \n Please find in the attachment the digital regular check for the content that you requested. \n Kind regards, \n Your correspondent at StampGame Inc.",
        attachments: [],
      };

      mailOptions.attachments.push({
        filename: "regular.pdf",
        path:
          "C:/Users/nxf67027/Documents/PayMe/regular.pdf",
      });
      

      // console.log(mailOptions.attachments);

      mail.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });

      // Print the next task (this should be in the onComplete of sendMail)
      // print_task(task_id + 1, tasks);
    });
  });
});
