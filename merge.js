const fs = require('fs');
const readline = require('readline');
var logger = fs.createWriteStream('session.txt', {
    flags: 'a' // 'a' means appending (old data will be preserved)
})
async function readFiles(dirname) {
  fs.readdir('.', function(err, filenames) {
    
    filenames.forEach(async function(filename) {
      if (filename.indexOf('session')==-1){
          return;
      }  
      const fileStream = fs.createReadStream(filename);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        // console.log(rl)

        // Note: we use the crlfDelay option to recognize all instances of CR LF
        // ('\r\n') in input.txt as a single line break.

        for await (const line of rl) {
            // Each line in input.txt will be successively available here as `line`.
            console.log('Filename' + filename)
            console.log(`Line from file: ${line}`);
            await logger.write(line+'\n')
        }
       /*fs.readFile(filename, 'utf-8', function(err, content) {
        console.log(content)
      });*/
    });
  });
}

readFiles()