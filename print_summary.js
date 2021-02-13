// Read the file

const { strict } = require('assert');
const csv = require('csv-parser');
const fs = require('fs');
const moment = require('moment')
const momentDurationFormatSetup = require("moment-duration-format");
const { resolve } = require('path');
const { stringify } = require('querystring');

let sum = 0
let price_per_hour = 2.1

let read_csv = new Promise((resolve) => {
    let data = []
    fs.createReadStream('session.txt')
        .pipe(csv(['Time', 'Duration']))
        .on('data', (row) => {
        let when = moment.unix(row.Time).format('DD/MM HH:mm:ss')
        let duration = moment.duration(-row.Duration, "seconds").format("mm:ss");
        let money = - row.Duration * price_per_hour / 3600
        data.push({'when': when, 'duration': duration, 'minute': row.Duration/60, 'money': money})
        })
        .on('end', () => {
            resolve(data);
        });
})

read_csv.then((data) => {
    let sum = 0 
    let minute = 0
    data.forEach((d) => {
        console.log(d.money)
        sum = sum + d.money
        minute = minute + d.minute
    })
    return([data, sum, minute])
}).then((package) => {
    data = package[0]
    sum = package[1]
    minute = package[2]
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
    // console.log(tasks)
    // console.log(tasks[1])

    let content = ''
    let counted = 0
    data.forEach((d) => {
        counted += 1
        if (counted < 5)
            content += d.when + ' >> ' + d.duration + ' = ' + Number(d.money).toFixed(4) + '\n'
    })

    device.open(async (error) => {
        printer
        .font('a')
        .size(0,0)
        .align('CT')
        .text('SALARY STAMP')
        .align('LT')
        .text('Name: Thinh Hoang')
        .text('ID: 1240000014760')
        .newLine()
        .text('Issued: ' + moment().format('ddd DD/MM/YYYY HH:mm:ss'))
        .text('Price per hour: ' + Number(price_per_hour).toFixed(2))
        .text('Total minute: ' + Number(minute).toFixed(2))
        .text('Total amount: ' + Number(sum).toFixed(2))
        .newLine()
        .text(content)
        .newLine()
        .qrimage(JSON.stringify('1240000014760|' + Number(sum).toFixed(2) + 'XX'), async function(err){
                await this.control('LF');  
                await this.cut();
                await this.close();
        })
    })      
})
