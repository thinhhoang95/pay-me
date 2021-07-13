const escpos = require("escpos");
// install escpos-usb adapter module manually
escpos.USB = require("escpos-usb");
// Select the adapter based on your printer type
const device = new escpos.USB();
// const device  = new escpos.Network('localhost');
// const device  = new escpos.Serial('/dev/usb/lp0');

const options = { encoding: "GB18030" /* default */ };
// encoding is optional

const printer = new escpos.Printer(device, options);

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
    'content': 'Welcome to the Stamp Game. Here is some money to get you started.',
    'finish': 20.0,
    'expiryDate': moment().add(14, 'd').toDate()
}
taskRef.set(task);
console.log("Serial added to the database. Printing stamp...")

device.open(async (error) => {
  printer
    .font("a")
    .size(0, 0)
    .align("CT")
    .text("REGULAR VALUE STAMP")
    .align("LT")
    .text("Recipient: Thinh Hoang Dinh")
    .text("ID: 1240000014760")
    .text("=========================================")
    .text(task.content)
    .text("Value: " + task.finish + ' PD.')
    .text("=========================================")
    .text("SN: " + serial_number)
    .text("Expires on: " + moment(task.expiryDate).format("ddd DD/MM/YYYY HH:mm:ss"))
    .newLine()
    .qrimage(
      JSON.stringify({
        regular: 1,
        sn: serial_number,
      }),
      async function (err) {
        await this.control("LF");
        await this.cut();
        await this.close();
      }
    );
});
