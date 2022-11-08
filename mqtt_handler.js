const mqtt = require("mqtt");
const puppeteer = require("puppeteer");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const client = mqtt.connect("ws://82.165.65.202:9001", {
  clientId: "host",
  username: "user",
  password: "Vy011195",
  clean: true,
});

client.on("connect", () => {
  console.log("Connected to WS Broker");
  client.subscribe("goals", (err) => {
    if (err) {
      console.log(err);
    }
  });
});

client.on("message", async (topic, message) => {
  let sTopic = topic.toString();
  let sMessage = message.toString();
  if (sTopic === "goals") {
    // This is a goal topic
    // Create a PDF from the goal
    console.log("Received message: " + sMessage);

    // Parse the sMessage from JSON to an object
    try {
      let goal = JSON.parse(sMessage);
      // Edit the HTML file
      let data = await fs.readFileSync("goal.html", "utf8");
      // Fill in the form
      var result = data.replace("$$TODAY$$", moment().format("ddd DD/MM/YYYY"));
      result = result.replace("$$DESCR$$", goal.description);
      result = result.replace("$$TNAME$$", goal.name);
      result = result.replace("$$TID$$", "DETAILS");
      result = result.replace("$$STAMP$$", sMessage);
      await fs.writeFileSync("goald.html", result, "utf8");
      // Open a HTML file and convert it to PDF
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, "goald.html")}`);
      let goalNameWithoutSpaces = goal.name.replace(/\s/g, "_");
      await page.pdf({
        path: "goal_" + goalNameWithoutSpaces + ".pdf",
        format: "A4",
        margin: {
          top: "40px",
          left: "40px",
          right: "40px",
          bottom: "30px",
        },
      });
      await browser.close();
      // Send an email with the PDF attached
      // ...
      const mail = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "thinhhoang.vaccine@gmail.com",
          pass: "Thinh24051995#",
        },
      });

      var mailOptions = {
        from: "thinhhoang.vaccine@gmail.com",
        to: "hdinhthinh@gmail.com",
        subject: "Goal coupon: " + goal.name,
        text: "Hello \n Please find in the attachment the goal coupon that you have achieved. Congratulations~ \nKind regards, \nYour correspondent at StampGame Inc.",
        attachments: [],
      };

      mailOptions.attachments.push({
        filename: "goal_" + goalNameWithoutSpaces + ".pdf",
        path: `${path.join(
          __dirname,
          "goal_" + goalNameWithoutSpaces + ".pdf"
        )}`,
      });

      // console.log(mailOptions.attachments);

      mail.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      // email should be sent by now
    } catch (e) {
      console.log(e);
    }
  }
});

client.on("error", (err) => {
  console.log(err);
  client.end();
});
