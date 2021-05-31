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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

var fs = require("fs");
var tasks = JSON.parse(fs.readFileSync("task.txt", "utf8"));

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
      const taskRef = db.collection("subtasks").doc(sn);
      task.sn = sn;
      task.subs.forEach((stask) => {
        stask.sn = make_serial(5, 5);
      });
      taskRef.set(task);
    });
    resolve(tasks)
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
    sTaskStr += s.sname + " (" + Number(s.finish).toFixed(2) + "); ";
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
  print_task(0, tasks)
})
