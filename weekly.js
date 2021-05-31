var fs = require("fs");
var moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");
const reader = require("readline-sync"); //npm install readline-sync
const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

var today = moment().format("ddd DD/MM/YYYY HH:mm:ss");

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
    let units = reader.question("Total units: ");
    let maxStreak = reader.question("Max Streak: ");
    let minStreak = reader.question("Min Streak: ");
    let stampValue = Number(units) * 1.8;
    console.log("The stamp value is: " + stampValue.toFixed(2));
    // Add this stamp to the database for claim from the app
    serial_number = make_serial(5, 5);
    const taskRef = db.collection("regular").doc(serial_number);
    let task = {
      sn: serial_number,
      content: "Weekly salary pay: " + today + ".",
      finish: stampValue,
      expiryDate: moment().add(7, "d").toDate(),
    };
    taskRef.set(task);
    console.log("Serial added to the database. Now generating PDF...");
    // Edit the PDF template
    let stampContent = JSON.stringify({
      regular: 1,
      sn: serial_number,
    });
    console.log("Stamp Content: ", stampContent);
    fs.readFile("weekly.html", "utf8", function (err, data) {
      if (err) {
        return console.log(err);
      }
      // Fill in the form
      var result = data.replace("$$TODAY$$", today);
      result = result.replace("$$UNITS$$", units);
      result = result.replace("$$MAXSTREAK$$", maxStreak);
      result = result.replace("$$MINSTREAK$$", minStreak);
      result = result.replace("$$STAMP$$", stampContent);
      console.log(result);
      fs.writeFile("weeklyd.html", result, "utf8", function (err) {
        if (err) return console.log(err);

        (async () => {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.goto(
            "file://C:/Users/nxf67027/Documents/PayMe/weeklyd.html"
          );
          await page.pdf({
            path: "weekly.pdf",
            format: "A4",
            margin: {
              top: "20px",
              left: "20px",
              right: "20px",
              bottom: "20px",
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
            subject: "Weekly report generated on " + today,
            text: "Hello \n Please find in the attachment the report for the work of your last week. \n Kind regards, \n Your correspondent at StampGame Inc.",
            attachments: [
              {
                filename: "weekly_report.pdf",
                path: "C:/Users/nxf67027/Documents/PayMe/weekly.pdf",
              },
            ],
          };

          mail.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });
        });
      });
    });
    resolve();
  });
};

preprocess();
