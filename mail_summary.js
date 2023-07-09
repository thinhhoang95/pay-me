const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");
const moment = require("moment")

const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");

const reader = require("readline-sync")
const path = require("path")

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const prefixZeroInTimeRep = (x) => {
  if (x<10)
  {
    return "0" + String(x)
  } else {
    return String(x)
  }
}

const convertMinutesToHHMM = (minutes) => {
  let hour = Math.floor(minutes/60)
  let rMinute = Math.floor(minutes - hour * 60)
  console.log(hour)
  console.log(rMinute)
  console.log(minutes)
  return prefixZeroInTimeRep(hour) + ":" + prefixZeroInTimeRep(rMinute)
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
          const todoDeferUntil = moment(x.deferUntil.toDate())
          const todayMax = moment().add(-2, 'hour').add(1, 'day').startOf('day')
          return todoDeferUntil.isBefore(todayMax)
        })
        let todoMessage = ""
        if (todos.length == 0)
        {
          todoMessage = "No todo today."
        } else {
          todoMessage = todos.map((x) => {
            return x.content
          }
          ).join(", ")
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
        const calendaMax = moment().add(-2, 'hour').add(7, 'day').startOf('day')
        // There are two kinds of time representation: start and startDate. The latter does not include time!
        // We do not include the all day event in this event
        if (x.hasOwnProperty('start'))
        {
          if (x.start.hasOwnProperty('dateTime'))
          {
            eventStart = moment(x.start.dateTime)
            if (eventStart.isBefore(calendaMax))
            {
              todayCalendar.push(x)
            }
          } else if (x.start.hasOwnProperty('date'))
          {
            eventStart = moment(x.start.date)
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
          if (x.start.hasOwnProperty('dateTime'))
          {
            return x.summary + " at " + moment(x.start.dateTime).format("DD/MM/YYYY HH:mm")
          } else {
            return x.summary + " at " + moment(x.start.date).format("DD/MM/YYYY")
          }
        }).join("\n")
      }
      resolve(calendarMessage)
    }).catch((err) => {
      reject(err)
    })
  })
}

const composeSummary = () => {
    let timeSummary = []
    let timeSummaryTaskIds = []
    let taskSummary = []
    let datestamp = moment().add(-2, 'hour').format("YYYY-MM-DD")
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
            // Start to compose an email
            var mail = nodemailer.createTransport({
                service: "gmail",
                auth: {
                  user: "thinhhoang.vaccine@gmail.com",
                  pass: "myclutvuwumcfwez",
                },
              });

              let timeJoint = ""
              timeSummary.forEach((x) => {
                timeJoint += "\nTask: " + x.subsub + ". Duration: " + convertMinutesToHHMM(Number(x.duration/(60*1000))) + "."
              })

              let taskJoint = ""
              taskSummary.forEach((x) => {
                taskJoint += "\nTask: " + x.sname + ". Completed at: " + x.time + "."
              })

              let message = "Dear Thinh,\n\nThis is the summary of your work day of " + moment().add(-2, 'hour').format("ddd DD/MM/YYYY") + ". \n" + timeJoint + "\n" + taskJoint + "\n\n"+ "Todo(s): " + xx.todo + "\n\n" + "Calendar events:\n\n" + xx.calendar + "\n\n" + "Your work speaks volumes of the kind of person you are - efficient, organized, and result-oriented. Your devotion is deeply appreciated.\n\nYours sincerely,\nThe PayMeMobile Team."
    
              var mailOptions = {
                from: "thinhhoang.vaccine@gmail.com",
                to: "hdinhthinh@gmail.com",
                subject: "Performance Summary for " + moment().add(-2, 'hour').format("ddd DD/MM/YYYY"),
                text: message,
                attachments: [],
              };

              console.log(message)

              // Mail away!
              mail.sendMail(mailOptions, function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log("Email sent: " + info.response);
                }
              });
              
        })
    })
}

composeSummary()
