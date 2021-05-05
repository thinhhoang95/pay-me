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

var fs = require('fs');
var tasks = JSON.parse(fs.readFileSync('task.txt', 'utf8'));

const moment = require('moment')

// console.log(tasks)
// console.log(tasks[1])

const make_serial = (length, terms) => {
    var result           = [];
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (let term = 0; term<terms; term++) {
        for ( var i = 0; i < length; i++ ) {
            result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
        }
        if (term!=terms-1)
            result.push('-')
    }
   return result.join('');
}

const print_task = (task_id, tasks) => {
    let task = tasks[task_id]
    console.log(tasks)
    console.log(task)
    console.log(task_id)
    let date = moment().format('ddd DD/MM/YYYY')
    if (task.date != 'today')
    {
        date = moment(task.date).format('ddd DD/MM/YYYY')
    }

    

    let serial_number = make_serial(5,5) // 20 characters for the serial number

    let task_compact = {
        'id': task.id,
        'name': task.name,
        'finish': task.finish,
        'sn': serial_number,
        'expired': task.expired
    }

    device.open(async (error) => {
        printer
        .font('a')
        .size(0,0)
        .align('CT')
        .text('RESEARCH PAY CHECK')
        .align('LT')
        .text('Name: Thinh Hoang Dinh')
        .text('ID: 1240000014760')
        .newLine()
        .text('Task: ' + task.id)
        .text('Name: ' + task.name)
        .text('Descr: ' + task.description)
        .newLine()
        .text('Completement pay: ' + parseFloat(task.finish).toFixed(2))
        .text('SN: ' + serial_number)
        .newLine()
        .text('Task expires on: ' + moment(task.expired).format('ddd DD/MM/YYYY HH:mm'))
        .qrimage(JSON.stringify(task_compact), async function(err){
                await this.control('LF');  
                await this.cut();
                await this.close();
                if (task_id + 1 < tasks.length)
                {
                    // console.log(tasks)
                    setTimeout(() => {console.log('Print task_id ' + task_id + 1); print_task(task_id + 1, tasks)}, 2000)
                }
              })
        })
        
        
}

print_task(0, tasks)