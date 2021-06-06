const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

var fs = require("fs");
var tasks = JSON.parse(fs.readFileSync("task.txt", "utf8"));

tasks = tasks.filter((t) =>{
  if (t.hasOwnProperty('unselected'))
  {
    if (t.unselected == 1)
    {
      return false
    }
    else
    {
      return true
    }
  } else {
    return true
  }
})

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

const preprocess = async (tasks) => {
  return new Promise(async (resolve, reject) => {
    // Add EACH task to online database
    tasks.forEach((task) => {
      let sn = make_serial(5, 5);
      task.sn = sn;
      task.subs.forEach((stask) => {
        stask.sn = make_serial(5, 5);
      });
      const taskRef = db.collection("subtasks").doc(sn);
      taskRef.set(task);
    });
    resolve(tasks);
  });
};

const print_task = (task_id, tasks) => {
  let task = tasks[task_id];
  console.log("Printing task " + task_id);
  let date = moment().format("ddd DD/MM/YYYY");
  if (task.date != "today") {
    date = moment(task.date).format("ddd DD/MM/YYYY");
  }

  let task_compact = {
    id: task.id,
    name: task.name,
    finish: task.finish,
    sn: task.sn,
    expired: task.expired,
  };

  let sTaskStr = "";
  task.subs.forEach((s) => {
    sTaskStr +=
      "<tr><td>" +
      s.sname +
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
    result = result.replace("$$SUBTASKS$$", sTaskStr);
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
    console.log(result);
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

          for (let i=0; i<tasks.length; i++)
          {
              mailOptions.attachments.push({
                  filename: 'paycheck_' + tasks[i].id + '.pdf',
                  path: "C:/Users/nxf67027/Documents/PayMe/paycheck_" + String(i) + ".pdf"
              })
          }

          console.log(mailOptions.attachments);

          mail.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });
        }
        // Print the next task (this should be in the onComplete of sendMail)
        print_task(task_id + 1, tasks);
      });
    });
  });
  // <<< Generate a digital paycheck (PDF file)
};

preprocess(tasks).then((tasks) => {
  print_task(0, tasks);
});
