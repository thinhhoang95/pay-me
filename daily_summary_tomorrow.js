const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");
const moment = require("moment-timezone")

const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");

const reader = require("readline-sync")
const path = require("path")

const escpos = require("escpos");
// install escpos-usb adapter module manually
escpos.USB = require("escpos-usb");
const device = new escpos.USB();
const options = { encoding: "GB18030" /* default */ };
const printer = new escpos.Printer(device, options);

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const truncateString = (str, len) => {
  if (str.length > len)
  {
    return str.substring(0, len)
  } else {
    return str
  }
}

const fetch_daily_task = (task_id, tasks) => {
  let task = tasks[task_id];
    // console.log(task);
    console.log("Printing task " + task_id);
  
    let task_compact = {
      id: task.id,
      name: task.name,
      finish: task.finish,
      sn: task.sn,
      expired: task.expired,
    };
  
    let sTaskStr = "";
  
    task.subs.forEach((s) => {
      if (s.hasOwnProperty("time")) {
        // Print [ ]s for tasks with time goals
        sTaskStr += truncateString(s.sname.toUpperCase(), 24) + " ";
        for (let i = 0; i < s.time; i++) {
          //sTaskStr += "[  ]";
        }
        sTaskStr += " (" + s.finish.toFixed(2) + ")\n";
        if (s.hasOwnProperty('subsubs'))
        {
          s.subsubs.forEach((ss) => {
            // For each subsubtask, print the subsubtask
            sTaskStr += "  [ ] " + truncateString(ss.name, 33) + " (" + ss.finish.toFixed(2) + ")\n"
          })
          //sTaskStr = sTaskStr.substring(0, sTaskStr.length - 1);
        }
      } else if (s.hasOwnProperty("countUp")) {
        // Print (x {finish}) for countUp stamps. {finish} is the reward for each timeunit completed
        if (s.countUp == 1)
        {
          sTaskStr += truncateString(s.sname.toUpperCase(), 36) + " (x" + s.finish.toFixed(2) + ")\n";
          if (s.hasOwnProperty('subsubs'))
          {
            s.subsubs.forEach((ss) => {
              // For each subsubtask, print the subsubtask
              sTaskStr += "  [ ] " + truncateString(ss.name, 33) + " (" + ss.finish.toFixed(2) + ")\n"
            })
            //sTaskStr = sTaskStr.substring(0, sTaskStr.length - 1);
          }
        }
      } else {
        // For other stamps (with no time goal or countUp goal)
        sTaskStr += truncateString(s.sname.toUpperCase(), 36) + " (" + Number(s.finish).toFixed(2) + ")\n";
        if (s.hasOwnProperty('subsubs'))
        {
          s.subsubs.forEach((ss) => {
            // For each subsubtask, print the subsubtask
            sTaskStr += "  [ ] " + truncateString(ss.name, 33) + " (" + ss.finish.toFixed(2) + ")\n"
          })
          //sTaskStr = sTaskStr.substring(0, sTaskStr.length - 1);
        }
      }
      // sTaskStr += s.sname + " (" + Number(s.finish).toFixed(2) + "); ";
    });
  
    sTaskStr = sTaskStr.substring(0, sTaskStr.length - 1);
    return sTaskStr
}

const print_daily_task = () => {
  return new Promise((resolve, reject) => {
    console.log('Querying subtasks')
    db.collection('subtasks').listDocuments().then((ref) => {
      const snsFound = ref.map(x => x.id)
      // console.log(snsFound)
      snsFound.forEach((dbSn) => {
          if (dbSn.indexOf('DAILY') != -1)
          {
              console.log('Found SN ' + dbSn)
                // sn = snsFound[0]
                db.collection('subtasks').doc(dbSn).get().then((snapshot) => {
                    let docContent = snapshot.data()
                    let tasks = [docContent]
                    // Filtering out subs with validFromDate > now
                    if (tasks[0].hasOwnProperty('subs'))
                    {
                      tasks[0].subs = tasks[0].subs.filter((t) => {
                        if (!t.hasOwnProperty('validFromDate'))
                        {
                            return true
                        }
                        // if t.validFromDate is a string, convert it to a moment object
                        if (typeof t.validFromDate === 'string')
                        {
                            t.validFromDate = moment(t.validFromDate, 'YYYY-MM-DD HH:mm:ss').toDate()
                            return moment(t.validFromDate).isBefore(moment())
                        } else {
                          return moment(t.validFromDate.toDate()).isBefore(moment())
                        }
                      })
                    }
                    
                    resolve(fetch_daily_task(0, tasks))
                })
          }
      })
  })
  }).catch((err) => {
    reject(err)
  })
}

const prefixZeroInTimeRep = (x) => {
  if (x<10)
  {
    return "0" + String(x)
  } else {
    return String(x)
  }
}

const ellipsizeString = (str, length) => {
  if (str.length > length)
  {
    return str.substring(0, length) + "..."
  } else {
    return str
  }
}

const dayhourminuteremaining = (dtx) => {
  let dt = moment(dtx)
  let now = moment()
  let remaining = moment.duration(dt.diff(now))
  let days = remaining.days()
  let hours = remaining.hours()
  let minutes = remaining.minutes()
  let seconds = remaining.seconds()
  let message = ""
  if (days > 0)
  {
    message += String(days) + " days "
  }
  
  message += String(hours) + ":"

  message += prefixZeroInTimeRep(minutes)

  // message += String(seconds) + " seconds "
  
  return message
}

const convertMinutesToHHMM = (minutes) => {
  let hour = Math.floor(minutes/60)
  let rMinute = Math.floor(minutes - hour * 60)
  console.log(hour)
  console.log(rMinute)
  console.log(minutes)
  return prefixZeroInTimeRep(hour) + ":" + prefixZeroInTimeRep(rMinute)
}

const getTheNext2am = () => {
    let now = moment().tz('Europe/Paris')
    let next2am = moment().tz('Europe/Paris').startOf('day').add(2, 'hour')
    if (now.isAfter(next2am))
    {
        next2am = next2am.add(1, 'day')
    }
    return next2am.add(1, 'day') // for tomorrow print
    return next2am // for today print
}

const changeTo2am = (dt) => {
    let next2am = moment(dt).tz('Europe/Paris').startOf('day').add(2, 'hour')
    return next2am
}

const compareDates = (dt1, dt2) => {
    return moment(dt1).isSame(moment(dt2).add(1, 'day'), 'day') // for tomorrow print
    return moment(dt1).startOf('day').isSame(moment(dt2).startOf('day'), 'day') // for today print
}

const getTodoToday = () => {
  return new Promise((resolve, reject) => {
    let todos = [] 
      db.collection("todo").doc("default").get().then((snapshot) => {
        if (snapshot.exists)
        {
          todos = snapshot.data().todo
        }
      }).then(() => {
        // Filter keep only today's todo
        todos = todos.filter((x) => {
          const todoDeferUntil = changeTo2am(moment.tz(x.deferUntil.toDate(), 'Europe/Paris'))
          const todayMax = getTheNext2am()
          return todoDeferUntil.isBefore(todayMax)
        })
        let todoMessage = ""
        if (todos.length == 0)
        {
          todoMessage = "No todo today."
        } else {
          todoMessage = todos.map((x) => {
            return "[ ] " + x.content
          }
          ).join("\n")
        }
        resolve(todoMessage)
      }).catch((err) => {
        reject(err)
      }
      )
  })
}

const getTodayCalendar = () => {
  // fetch from https://paymemobile.fr/hdinhthinh
  return new Promise((resolve, reject) => {
    const url = "https://paymemobile.fr/hdinhthinh"
    fetch(url).then((response) => {
      return response.json()
    }).then((calenda) => {
      let todayCalendar = []

      // Filter keep only today's calendar
      calenda.forEach((x) => {
        const calendaMax = getTheNext2am().add(1, 'day') // for tomorrow print
        // There are two kinds of time representation: start and startDate. The latter does not include time!
        // We do not include the all day event in this event
        if (x.hasOwnProperty('start'))
        {
          if (x.start.hasOwnProperty('dateTime'))
          {
            eventStart = moment.tz(x.start.dateTime, 'Europe/Paris').tz('UTC') // Convert to UTC
            if (eventStart.isBefore(calendaMax))
            {
              todayCalendar.push(x)
            }
          } else if (x.start.hasOwnProperty('date'))
          {
            eventStart = moment.tz(x.start.date, 'Europe/Paris').tz('UTC') // Convert to UTC
            if (eventStart.isBefore(calendaMax))
            {
              todayCalendar.push(x)
            }
          }
        }
      }
      )
      // Compose the message
      let calendarMessage = ""
      if (todayCalendar.length == 0)
      {
        calendarMessage = "No calendar today."
      } else {
        calendarMessage = todayCalendar.map((x) => {
          // console.log('x.start', x.start)
          if (x.start.hasOwnProperty('dateTime'))
          {
            // if x.start.dateTime's date is today
            let asterisk = ''
            //console.log(moment.tz(x.start.dateTime, 'Europe/Paris').tz('UTC'))
            //console.log(moment().tz('Europe/Paris').startOf('day').tz('UTC'))
            if (compareDates(moment.tz(x.start.dateTime, 'Europe/Paris'), moment().tz('Europe/Paris')))
            {
                asterisk = '*'
            }
            /* if (moment.tz(x.start.dateTime, 'Europe/Paris').startOf('day').tz('UTC').isSame(moment().tz('Europe/Paris').startOf('day').tz('UTC')))
            {
              asterisk = '*'
            } */
            return "- " + ellipsizeString(x.summary, 12) + " on " + moment.tz(x.start.dateTime, 'Europe/Paris').format("ddd D, HH[h]mm") + asterisk
          } else {
            return "- " + ellipsizeString(x.summary, 12) + " on " + moment.tz(x.start.date, 'Europe/Paris').format("ddd D, HH[h]mm") + asterisk
          }
        }).join("\n")
      }
      resolve(calendarMessage)
    }).catch((err) => {
      reject(err)
    })
  })
}

const getAlmostExpireSubTasks = () => {
  return new Promise((resolve, reject) => {
    db.collection("subtasks").get().then((snapshot) => {
      let subtasks = []
      snapshot.forEach((doc) => {
        subtasks.push(doc.data())
      })
      return subtasks
    }).then((subtasks) => {
      // expires in 7 days tasks
      let almostExpireSubtasks = subtasks.filter((x) => {
        const taskExpiryDate = moment.tz(x.expired, 'Europe/Paris').tz('UTC') // Convert to UTC
        const todayMax = moment().add(-2, 'hour').add(7, 'day').startOf('day')
        return taskExpiryDate.isBefore(todayMax)
      })
      
      let message = ""
      almostExpireSubtasks.forEach((x) => {
        let asterisk = ''
        if (compareDates(moment.tz(x.expired, 'Europe/Paris'), moment().tz('Europe/Paris')))
        {
            asterisk = '*'
        }
        /* if (moment.tz(x.expired, 'Europe/Paris').startOf('day').tz('UTC').isSame(moment().tz('Europe/Paris').startOf('day').tz('UTC')))
        {
          asterisk = '*'
        } */
        message += "- " + x.id + " exp. " + moment.tz(x.expired, 'Europe/Paris').format("ddd DD") + asterisk + "\n"
      })
  
      // scourge the subtasks 
      subtasks.forEach((x) => {
        // console.log(x)
        let almostExpireSubSubTasks = []
        if (x.hasOwnProperty('subs'))
        {
          x.subs.forEach((y) => {
            // console.log(y)
            if (y.hasOwnProperty('expiryDate'))
            {
              
              const subtaskExpiryDate = changeTo2am(moment.tz(y.expiryDate.toDate(), 'Europe/Paris'))
              const todayMax = changeTo2am(moment().tz('Europe/Paris').add(7, 'day'))
              if (subtaskExpiryDate.isBefore(todayMax))
              {
                almostExpireSubSubTasks.push({...y, parent: x.id})
              }
            }
          })
        }
    
        almostExpireSubSubTasks.forEach((x) => {
          let asterisk = ''
          if (compareDates(moment.tz(x.expiryDate.toDate(), 'Europe/Paris'), moment().tz('Europe/Paris')))
          {
            asterisk = '*'
          }
          /* if (moment.tz(x.expiryDate.toDate(), 'Europe/Paris').startOf('day').tz('UTC').isSame(moment().tz('Europe/Paris').startOf('day').tz('UTC')))
          {
            asterisk = '*'
          } */
          message += "- " + x.parent + " / " + x.sname + " exp. " +  moment.tz(x.expiryDate.toDate(), 'Europe/Paris').format("ddd DD") + asterisk + "\n"
        })
      })
      

      resolve(message)
  
  
    }).catch((err) => {
      reject(err)
    })
  })
}

const composeSummary = () => {
    let timeSummary = []
    let timeSummaryTaskIds = []
    let taskSummary = []
    let datestamp = moment().tz('Europe/Paris').add(-2, 'hour').add(-1, 'day').add(2, 'hour').format("YYYY-MM-DD")
    db.collection('timerHistory').doc(datestamp).get().then((snapshot) => {
        let timerDoc = {}
        if (snapshot.exists)
        {
            timerDoc = snapshot.data()
            if (timerDoc.report)
            {
                timerDoc.report.forEach((r) => {
                    if (timeSummaryTaskIds.indexOf(r.subsub) > -1)
                    {
                        timeSummary[timeSummary.findIndex((x) => x.subsub == r.subsub)].duration += r.duration
                    } else {
                        timeSummary.push({subsub: r.subsub, duration: r.duration})
                        timeSummaryTaskIds.push(r.subsub)
                    }
                })
            } else {
                timerDoc.report = []
            }
        }
    }).then(() => {
        db.collection('subsubHistory').doc(datestamp).get().then((snapshot2) => {
            let subDoc = []
            if (snapshot2.exists)
            {
                subDoc = snapshot2.data()
                if (subDoc.subsubs)
                {
                    subDoc.subsubs.forEach((s) => {
                        s.time = moment(s.time.toDate()).format("HH:mm:ss")
                    })
                }
                taskSummary = [...subDoc.subsubs]
            }
        }).then(() => {
          // Get todos
          return new Promise((resolve, reject) => {
            getTodoToday().then((x) => {
              resolve({todo: x})
            }).catch((err) => {
              reject(err)
            })
          })
        }).then((x)=>{
          // Get calendar
          return new Promise((resolve, reject) => {
            getTodayCalendar().then((y) => {
              resolve({...x, calendar: y})
            }).catch((err) => {
              reject(err)
            })
          })
        }).then((xx) => {
          // Get soon to expire tasks
          return new Promise((resolve, reject) => {
            getAlmostExpireSubTasks().then((y) => {
              resolve({...xx, soonExpire: y})
            }).catch((err) => {
              reject(err)
            })
          })
        }).then((xx) => {
          return new Promise((resolve, reject) => {
            print_daily_task().then((y) => {
              resolve({...xx, dailyTaskStr: y})
            }).catch((err) => {
              reject(err)
            })
        })}).then((xx) => {

              let timeJoint = ""
              timeSummary.forEach((x) => {
                timeJoint += "\n- Task: " + x.subsub + ". Duration: " + convertMinutesToHHMM(Number(x.duration/(60*1000))) + "."
              })

              let taskJoint = ""
              taskSummary.forEach((x) => {
                taskJoint += "\n- Task: " + x.sname + ". Completed at: " + x.time + "."
              })

              device.open(async (error) => {
                printer
                  .font("a")
                  .size(0, 0)
                  .align("CT") // Center text
                  .text("Summary for " + moment().add(1, 'day').startOf('day').format("ddd DD MMM YYYY"))
                  .align("LT")
                  .text("Name: Thinh Hoang Dinh")
                  .text("================================================")
                  .text(xx.dailyTaskStr)
                  .text("================================================")
                  .text(xx.todo)
                  .text(xx.calendar)
                  .text(xx.soonExpire)
                  .text("================================================")
                  .text("")
                  .text("")
                  .text("")
                  .cut()
                  .close();
                  /*.qrimage(JSON.stringify(task_compact), async function (err) {
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
                  }); */
              });
               

              
              
        })
    })
}

composeSummary()