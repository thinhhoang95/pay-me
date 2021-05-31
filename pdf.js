
var fs = require('fs')
var moment = require('moment')

var today = moment().format("ddd DD/MM/YYYY HH:mm:ss")

const make_serial = (length, terms) => {
  var result = [];
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var charactersLength = characters.length;
  for (let term = 0; term < terms; term++) {
    for (var i = 0; i < length; i++) {
      result.push(
        characters.charAt(Math.floor(Math.random() * charactersLength))
      );
    }
    if (term != terms - 1) result.push("-");
  }
  return result.join("");
};

const preprocess = async () => {
  return new Promise(async (resolve, reject) => {
    // Prompt for the number of timeunits
    let units = reader.question("Total units: ");
    let maxStreak = reader.question("Max Streak: ");
    let minStreak = reader.question("Min Streak: ");
    let stampValue = Number(units) * 1.8
    console.log('The stamp value is: ' + stampValue.toFixed(2))
    // Add this stamp to the database for claim from the app
    let sn = make_serial(5,5)
    const stampRef = db.collection("salary").doc(sn);
    stampRef.set({
      'sn': sn,
      'content': content + ". Generated at " + moment().toISOString() + '.',
      'claimed': false,
      'value': stampValue
    });
    // Edit the PDF template
    fs.readFile('weekly.html', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      // Fill in the form
      var result = data.replace('$$TODAY$$', today);
      result = result.replace('$$UNITS$$', units)
      result = result.replace('$$MAXSTREAK', maxStreak)
      result = result.replace('$$MINSTREAK', minStreak)
    
      fs.writeFile('weeklyd.html', result, 'utf8', function (err) {
         if (err) return console.log(err);
      });
    });
    resolve();
  });
};

preprocess();