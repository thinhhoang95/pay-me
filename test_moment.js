const moment = require("moment-timezone")

let now = moment().tz('Europe/Paris').startOf('day').add(2, 'hour').add(1, 'day')
// let now2 = moment()
console.log(now.format('YYYY-MM-DD HH:mm:ss'))
// console.log(now2.format('YYYY-MM-DD HH:mm:ss'))