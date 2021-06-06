const reader = require("readline-sync"); //npm install readline-sync
let task_name = reader.question("Task name: ");
let mission = reader.question("Mission: ");

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
    .align('LT')
    .text('Task name: ' + task_name)
    .text('Mission: ' + mission)
    .newLine()
    .cut()
    .close()
})