
const http = require('http')
const fs = require('fs')
const path = require('path');
var basePath = __dirname;

const server = http.createServer((req, res) => {
    var stream = fs.createReadStream(path.join(basePath, req.url));
    stream.on('error', function() {
        res.writeHead(404);
        res.end();
    });
    console.log(`Requesting URL:${req.url}`);
    stream.pipe(res);

})
const port = process.env.PORT || 8080;
server.listen(port)
console.log(`server listening on localhost:${port}`);