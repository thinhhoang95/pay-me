const escpos = require("escpos");
// install escpos-usb adapter module manually
escpos.USB = require("escpos-usb");
// Select the adapter based on your printer type
const device = new escpos.USB();
const options = { encoding: "GB18030" /* default */ };
const printer = new escpos.Printer(device, options);
const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");

const path = require('path');

const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const truncateString = (str, len) => {
  if (str.length > len)
  {
    return str.substring(0, len)
  } else {
    return str
  }
}

var fs = require("fs");
let sn = process.argv[2]; // file name for the day
var goals = JSON.parse(fs.readFileSync('goals.json', "utf8"));

const print_task = (task_id, tasks) => {
    let task = tasks[task_id];
    // console.log(task);
    console.log("Printing task " + task_id);
  
    let task_compact = {
      id: task.id,
      name: task.name,
      finish: task.finish,
      sn: task.sn,
      expired: task.expired,
    };
  
    let sTaskStr = "";
  
    task.subs.forEach((s) => {
      if (s.hasOwnProperty("time")) {
        // Print [ ]s for tasks with time goals
        sTaskStr += truncateString(s.sname.toUpperCase(), 24) + " ";
        for (let i = 0; i < s.time; i++) {
          sTaskStr += "[  ]";
        }
        sTaskStr += " (" + s.finish.toFixed(2) + ")\n";
        if (s.hasOwnProperty('subsubs'))
        {
          s.subsubs.forEach((ss) => {
            // For each subsubtask, print the subsubtask
            sTaskStr += "  [ ] " + truncateString(ss.name, 33) + " (" + ss.finish.toFixed(2) + ")\n"
          })
          //sTaskStr = sTaskStr.substring(0, sTaskStr.length - 1);
        }
      } else if (s.hasOwnProperty("countUp")) {
        // Print (x {finish}) for countUp stamps. {finish} is the reward for each timeunit completed
        if (s.countUp == 1)
        {
          sTaskStr += truncateString(s.sname.toUpperCase(), 36) + " (x" + s.finish.toFixed(2) + ")\n";
          if (s.hasOwnProperty('subsubs'))
          {
            s.subsubs.forEach((ss) => {
              // For each subsubtask, print the subsubtask
              sTaskStr += "  [ ] " + truncateString(ss.name, 33) + " (" + ss.finish.toFixed(2) + ")\n"
            })
            //sTaskStr = sTaskStr.substring(0, sTaskStr.length - 1);
          }
        }
      } else {
        // For other stamps (with no time goal or countUp goal)
        sTaskStr += truncateString(s.sname.toUpperCase(), 36) + " (" + Number(s.finish).toFixed(2) + ")\n";
        if (s.hasOwnProperty('subsubs'))
        {
          s.subsubs.forEach((ss) => {
            // For each subsubtask, print the subsubtask
            sTaskStr += "  [ ] " + truncateString(ss.name, 33) + " (" + ss.finish.toFixed(2) + ")\n"
          })
          //sTaskStr = sTaskStr.substring(0, sTaskStr.length - 1);
        }
      }
      // sTaskStr += s.sname + " (" + Number(s.finish).toFixed(2) + "); ";
    });
  
    sTaskStr = sTaskStr.substring(0, sTaskStr.length - 1);
  
    let sTaskStrPDF = "";
    task.subs.forEach((s) => {
      let subTaskTimeSuffix = ''
      if (s.hasOwnProperty("time")) {
        // Time goals
        subTaskTimeSuffix = '[' + String(Math.round(s.time)) + ']'
      } else if (s.hasOwnProperty("countUp")) {
        // Count up stamp
        if (s.countUp == 1)
        {
          subTaskTimeSuffix += " (x" + s.finish.toFixed(2) +")";
        }
      }
      let subsubTaskSuffix = ''
      if (s.hasOwnProperty('subsubs'))
      {
        s.subsubs.forEach((ss) => {
          subsubTaskSuffix += '<br/> [ ] ' + ss.name + ' (' + ss.finish.toFixed(2) + ') '  
        })
      }
      sTaskStrPDF +=
        "<tr><td>" +
        s.sname + ' ' + subTaskTimeSuffix + subsubTaskSuffix +
        "</td><td>" +
        Number(s.finish).toFixed(2) +
        "</td></tr>";
    });
  
    let today = moment().format("ddd DD/MM/YYYY HH:mm:ss");
  
    // >>> Generate a digital paycheck (PDF file)
    fs.readFile("paycheck.html", "utf8", function (err, data) {
      if (err) {
        return console.log(err);
      }
      // Fill in the form
      var result = data.replace("$$TODAY$$", today);
      result = result.replace("$$SUBTASKS$$", sTaskStrPDF);
      result = result.replace(
        "$$EXPIRES$$",
        moment(task.expired).format("ddd DD/MM/YYYY HH:mm")
      );
      result = result.replace(
        "$$CPAY$$",
        Number(task.finish).toFixed(2).toString()
      );
      result = result.replace("$$DESCR$$", task.description);
      result = result.replace("$$TNAME$$", task.tname);
      result = result.replace("$$TID$$", task.id);
      result = result.replace("$$STAMP$$", JSON.stringify(task_compact));
      // console.log(result);
      fs.writeFile("paycheckd.html", result, "utf8", function (err) {
        if (err) return console.log(err);
  
        (async () => {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.goto(
            `file:${path.join(__dirname, 'paycheckd.html')}`
          );
          await page.pdf({
            path: "paycheck_" + String(task_id) + ".pdf",
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
          if (task_id + 1 == tasks.length) {
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
              subject: "Digital paycheck generated on " + today,
              text: "Hello \n Please find in the attachment the digital paychecks for the tasks that you requested. \n Kind regards, \n Your correspondent at StampGame Inc.",
              attachments: [],
            };
  
            for (let i = 0; i < tasks.length; i++) {
              mailOptions.attachments.push({
                filename: "paycheck_" + tasks[i].id + ".pdf",
                path:
                  path.join(__dirname, 'paycheck_' + String(i) + '.pdf')
              });
            }
  
            // console.log(mailOptions.attachments);
  
            mail.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log(error);
              } else {
                console.log("Email sent: " + info.response);
              }
            });
            // enable sending email
          }
          // Print the next task (this should be in the onComplete of sendMail)
          // print_task(task_id + 1, tasks);
        });
      });
    });
  
    device.open(async (error) => {
      printer
        .font("a")
        .size(0, 0)
        .align("CT")
        .text("RESEARCH PAY CHECK")
        .align("LT")
        .text("Name: Thinh Hoang Dinh")
        .text("ID: 1240000014760")
        .text("================================================")
        .text("Task: " + task.id)
        .text("Name: " + task.tname)
        .text("Descr: " + task.description)
        .text("================================================")
        .text(sTaskStr)
        .text("================================================")
        .text("Completement pay: " + parseFloat(task.finish).toFixed(2))
        .text("Goal: " + Number(goals.tu).toFixed(1) + " time units")
        .text("SN: " + task.sn)
        .newLine()
        .text(
          "Task expires on: " +
            moment(task.expired).format("ddd DD/MM/YYYY HH:mm")
        )
        .qrimage(JSON.stringify(task_compact), async function (err) {
          await this.control("LF");
          await this.cut();
          await this.close();
          if (task_id + 1 < tasks.length) {
            // console.log(tasks)
            setTimeout(() => {
              console.log("Print task_id " + task_id + 1);
              print_task(task_id + 1, tasks);
            }, 2000);
          }
        });
    });
  };
  
db.collection('subtasks').listDocuments().then((ref) => {
    const snsFound = ref.map(x => x.id)
    // console.log(snsFound)
    snsFound.forEach((dbSn) => {
        if (dbSn.indexOf(sn) != -1)
        {
            console.log('Found SN ' + dbSn)
              // sn = snsFound[0]
              db.collection('subtasks').doc(dbSn).get().then((snapshot) => {
                  let docContent = snapshot.data()
                  let tasks = [docContent]
                  print_task(0, tasks)
              })
        }
    })
})