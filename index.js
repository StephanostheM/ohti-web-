
// const http = require('http')
// const fs = require('fs')
// const path = require('path');
// var basePath = __dirname;

// const server = http.createServer((req, res) => {
//     var stream = fs.createReadStream(path.join(basePath, req.url));
//     stream.on('error', function() {
//         res.writeHead(404);
//         res.end();
//     });
//     console.log(`Requesting URL:${req.url}`);
//     stream.pipe(res);

// })
// const port = process.env.PORT || 8080;
// server.listen(port)
// console.log(`server listening on localhost:${port}`);

// // List files in folder
// const directoryPath = path.join(__dirname, 'Media');
// fs.readdir(directoryPath, function (err, files) {
//     if (err) {
//         return console.warn('Unable to scan directory: ' + err);
//     }

//     const data = [];
//     files.forEach(function (file) {
//         // Do whatever you want to do with the file
//         console.log(file);
//         let displayname = file.substring(0, file.lastIndexOf("."));
//         let fix = displayname.indexOf("_") > -1 ? displayname.split("_") : [displayname, ""];
//         let format = file.substring(file.lastIndexOf(".")+1);
//         data.push({ name: fix[0], kind: fix[1], filename: file, format: format });
//     });

//     fs.writeFileSync(__dirname + '/mediafiles.json', JSON.stringify(data));
// });


const path = require('path');

const express = require('express');

const app = new express();
//app.use(express.static('/'));
app.use('/static', express.static('static'))
app.use('/Media', express.static('Media'))
app.use('/sounds', express.static('sounds'))
app.use('/IRs', express.static('IRs'))

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.listen(8080, () => {
    console.log('App listening on port 8080')
})