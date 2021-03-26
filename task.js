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

    let task_compact = Object.assign({}, task)
    delete task_compact.description

    device.open(async (error) => {
        printer
        .font('a')
        .size(0,0)
        .align('CT')
        .text('TASK INFO SHEET')
        .align('LT')
        .text('Name: Thinh Hoang')
        .text('ID: 1240000014760')
        .newLine()
        .text('Task: ' + task.id)
        .text('Name: ' + task.name)
        .text('Descr: ' + task.description)
        .newLine()
        .text('Commence pay: 0.00')
        .text('Per-hour pay: PER REGULATION')
        .text('Completement pay: ' + parseFloat(task.finish).toFixed(2))
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