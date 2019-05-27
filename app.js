const express = require('express')
const app = express();
const server = require('http').createServer(app);
const port = 3000;
const io = require('socket.io')(server);
io.on('connection', () => {
    console.log(`Listening on port ${port}`);

});
server.listen(port);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/pages/home.html');
});

app.use(express.static(__dirname + '/pages'));