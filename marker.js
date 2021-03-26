const reader = require("readline-sync"); //npm install readline-sync
let task_id = reader.question("Please enter task ID on task sheet");
let content = reader.question("Content");

const escpos = require('escpos');
// install escpos-usb adapter module manually
escpos.USB = require('escpos-usb');
// Select the adapter based on your printer type
const device  = new escpos.USB();
// const device  = new escpos.Network('localhost');
// const device  = new escpos.Serial('/dev/usb/lp0');

const options = { encoding: "GB18030" /* default */ }
// encoding is optional

const printer = new escpos.Printer(device, options);

const moment = require('moment')

let date = moment().format('ddd DD/MM/YYYY')


device.open(async (error) => {
    printer
    .font('a')
    .size(0,0)
    .align('CT')
    .text('TASK INFO SHEET')
    .align('LT')
    .text('Task ID: ' + task_id)
    .text('Content: ' + content)
    .text('Date printed: ' + date)
    .newLine()
    .newLine()
    .newLine()
    .cut()
    .close()
    })