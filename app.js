const express = require('express')
const MongoClient = require('mongodb').MongoClient;
const myURL = 'mongodb://localhost:27017';
const app = express();
const server = require('http').Server(app);
const port = 3000;
const io = require('socket.io')(server);
const Filter = require('bad-words'), filter = new Filter();
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs-extra')

var ObjectId = require('mongodb').ObjectId
var db;

// SET STORAGE
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
})

app.use(express.static(__dirname + '/pages'));
app.use(bodyParser.urlencoded({ extended: true }));

//Connect to our mongoclient 
MongoClient.connect(myURL, { useNewUrlParser: true }, (err, client) => {
    if (err) return console.log(err)
    db = client.db('RealTimeMessaging')
    server.listen(port);
});


//a place for us to store our photos locally
var upload = multer({ storage: storage });
//Upload a photo to our database, wherever the server is running from, a local version of the file will be saved
app.post('/', upload.single('picture'), (req, res) => {
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');
    // Define a JSONobject for the image attributes for saving to database

    var finalImg = {
        contentType: req.file.mimetype,
        image: new Buffer(encode_image, 'base64')
    };
    db.collection('photos').insertOne(finalImg, (err, result) => {
        console.log(result);

        if (err) return console.log(err);
        //If we are successful, send the image id back to the client that made the request
        console.log('saved to database');
        res.end(`${result['ops'][0]._id}`);
    });
});
//When a client makes a get request to our root page, send them back our home html page 
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/pages/home.html');
});

//Used if we ever need to get all photos, currently isn't being used
app.get('/photos', (req, res) => {

    console.log("Getting all images");
    db.collection('photos').find().toArray((err, result) => {

        const imgArray = result.map(element => element._id);
        console.log(imgArray);

        if (err) return console.log(err);
        res.send(imgArray);

    });
});

//Whenever the client makes a request to this url with the proper photo id, we will send the image back to them
//We use this to display images on the user side whenever a client uploads one.
app.get('/photo/:id', (req, res) => {
    var filename = req.params.id;
    //Find the image in our collection that has this ID
    db.collection('photos').findOne({ '_id': ObjectId(filename) }, (err, result) => {

        if (err) return console.log(err)
        //send it back
        res.contentType('image/jpeg');
        res.send(result.image.buffer);
    });
});


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
    //send imageID to all clients
    socket.on('imageMessage', id => {
        io.emit('imageSent', id);
    });
});