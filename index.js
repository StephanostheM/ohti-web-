
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
    stream.pipe(res);

})

server.listen(process.env.PORT || 8080)
