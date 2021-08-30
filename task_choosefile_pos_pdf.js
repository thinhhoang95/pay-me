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

const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

var fs = require("fs");
let taskFileName = process.argv[2]; // file name for the day
let autoDateUpdate = process.argv[3]; // print stamp for today or tomorrow
let autoTimePayUpdate = process.argv[4]; // auto update the pay for each subtask in the daily paycheck
console.log("Reading file ", taskFileName);
var tasks = JSON.parse(fs.readFileSync(taskFileName, "utf8"));

tasks = tasks.filter((t) => {
  if (t.hasOwnProperty("unselected")) {
    if (t.unselected == 1) {
      return false;
    } else {
      return true;
    }
  } else {
    return true;
  }
});

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

const preprocess = async (tasks) => {
  return new Promise(async (resolve, reject) => {
    // Add EACH task to online database
    tasks.forEach((task) => {
      // Filter out unselected subtasks
      task.subs = task.subs.filter((t) => {
        if (t.hasOwnProperty("unselected")) {
          if (t.unselected == 1) {
            return false;
          } else {
            return true;
          }
        } else {
          return true;
        }
      });

      // Modify subtask parameters according to the program's arguments
      task.subs.forEach((s) => {
        if (autoTimePayUpdate == "auto") {
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
      });

      if (autoDateUpdate == "today") {
        let newExpiryDate = moment().add(2, "d");
        newExpiryDate.set("hour", 2);
        newExpiryDate.set("minute", 0);
        task.expired = newExpiryDate.toISOString();
        task.description =
          "Daily time stamp for " +
          moment().format("ddd DD/MM/YYYY")
        console.log(
          "Description changed to today and expiry date changed to " +
            task.expired
        );
      }
      else if (autoDateUpdate == "todaytoday") {
        let newExpiryDate = moment();
        newExpiryDate.add(1, "d");
        newExpiryDate.set("hour", 2);
        newExpiryDate.set("minute", 0);
        task.expired = newExpiryDate.toISOString();
        task.description =
          "Daily time stamp for " +
          moment().format("ddd DD/MM/YYYY")
        console.log(
          "Description changed to today and expiry date changed to " +
            task.expired
        );
      }
      else if (autoDateUpdate == "tomorrow") {
        let newExpiryDate = moment().add(3, "d");
        newExpiryDate.set("hour", 2);
        newExpiryDate.set("minute", 0);
        task.expired = newExpiryDate.toISOString();
        task.description =
          "Daily time stamp for " +
          moment().add(1, "d").format("ddd DD/MM/YYYY")
        console.log(
          "Description changed to today and expiry date changed to " +
            task.expired
        );
      } else if (autoDateUpdate == "tomorrowtomorrow") {
        let newExpiryDate = moment().add(2, "d");
        newExpiryDate.set("hour", 2);
        newExpiryDate.set("minute", 0);
        task.expired = newExpiryDate.toISOString();
        task.description =
          "Daily time stamp for " +
          moment().add(1, "d").format("ddd DD/MM/YYYY")
        console.log(
          "Description changed to today and expiry date changed to " +
            task.expired
        );
      } else if (autoDateUpdate == "nextweek") {
        let newExpiryDate = moment().add(8, "d");
        newExpiryDate.set("hour", 2);
        newExpiryDate.set("minute", 0);
        task.expired = newExpiryDate.toISOString();
        console.log(
          "Description changed to today and expiry date changed to " +
            task.expired
        );
      }
      task.expiredDate = moment(task.expired).toDate();
      let snPrefix = task.id.substring(0,5).padEnd(5, 'X').toUpperCase();
      let sn = snPrefix + "-" + make_serial(5, 6);
      const taskRef = db.collection("subtasks").doc(sn);
      task.sn = sn;
      task.subs.forEach((stask) => {
        stask.sn = make_serial(5, 6);
      });
      taskRef.set(task);
    });
    resolve(tasks);
  });
};

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
      sTaskStr += s.sname + " (" + s.time + ") ";
      for (let i = 0; i < s.time; i++) {
        sTaskStr += "[  ] ";
      }
      sTaskStr += "(" + Number(s.finish).toFixed(2) + "); ";
    } else if (s.hasOwnProperty("countUp")) {
      if (s.countUp == 1)
      {
        sTaskStr += s.sname + " (x" + s.finish + ")";
      }
    } else {
      sTaskStr += s.sname + " (" + Number(s.finish).toFixed(2) + "); ";
    }
    // sTaskStr += s.sname + " (" + Number(s.finish).toFixed(2) + "); ";
  });

  let sTaskStrPDF = "";
  task.subs.forEach((s) => {
    let subTaskTimeSuffix = ''
    if (s.hasOwnProperty("time")) {
      subTaskTimeSuffix = '[' + String(Math.round(s.time)) + ']'
    } else if (s.hasOwnProperty("countUp")) {
      if (s.countUp == 1)
      {
        subTaskTimeSuffix += " (x" + s.finish +")";
      }
    }
    sTaskStrPDF +=
      "<tr><td>" +
      s.sname + ' ' + subTaskTimeSuffix +
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
          "file://C:/Users/nxf67027/Documents/PayMe/paycheckd.html"
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
                "C:/Users/nxf67027/Documents/PayMe/paycheck_" +
                String(i) +
                ".pdf",
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

preprocess(tasks).then((tasks) => {
  print_task(0, tasks);
});
