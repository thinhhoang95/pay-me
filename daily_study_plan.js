const reader = require("readline-sync"); //npm install readline-sync
let last_response = '';
let task_name = '';
let allocated_time = 0;
let task_description = '';
let content = '';
while (true)
{
    console.log('Print daily plan with this application. Press q when done')
    task_name = reader.question('Task name: ')
    last_response = task_name
    if (last_response == 'q')
        break
    allocated_time = reader.question('Allocated time (number): ')
    task_description = reader.question('Description for this task: ')
    content += "Task: " + task_name + "\n Allocated TUs: " + allocated_time + "\n " + "Descr: " + task_description + "\n"
    last_response = task_name
}

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

let date = moment().format('ddd DD/MM/YYYY HH:mm:ss')


device.open(async (error) => {
    printer
    .font('a')
    .size(0,0)
    .align('CT')
    .text('DAILY STUDY PLAN')
    .align('LT')
    .text('Time: ' + date)
    .text(content)
    .newLine()
    .cut()
    .close()
})