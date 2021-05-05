const reader = require("readline-sync"); //npm install readline-sync
let file_name = reader.question("Enter your file name: ");
let file_description = reader.question("Description: ");

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
    .text('Name: HOANG Dinh Thinh')
    .text('Email: hdinhthinh@gmail.com')
    .text('Mobile: 07 75 23 46 66')
    .text('File name: ' + file_name)
    .text('Description: ' + file_description)
    .newLine()
    .newLine()
    .newLine()
    .cut()
    .close()
    })