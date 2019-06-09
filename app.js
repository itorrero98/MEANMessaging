const express = require('express')
const app = express();
const server = require('http').Server(app);
const port = 3000;
const io = require('socket.io')(server);
const Filter = require('bad-words'), filter = new Filter();
server.listen(port);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/pages/home.html');
});

app.use(express.static(__dirname + '/pages'));

io.on('connection', function (socket) {
    console.log("User has connected");

    /* **************** Built in Socket Events ***************** */

    socket.on('disconnect', () => {
        console.log("User has disconnected");
    });

    /* **************** Our personal Socket Events ***************** */

    socket.on('chatMessage', (message, color) => {
        console.log(`User sent a message: ${message}`);
        //emit to all user's the message that was just sent
        io.emit('message', filter.clean(message), color);
    });
});