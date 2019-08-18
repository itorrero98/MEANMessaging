const express = require("express");
const multer = require("multer");
const dbUtils = require("./db/mongoUtils");

const app = express();
const server = require("http").Server(app);
const port = 3000;
const io = require("socket.io")(server);
const Filter = require("bad-words"),
  filter = new Filter();
const bodyParser = require("body-parser");

const fs = require("fs-extra");

var ObjectId = require("mongodb").ObjectId;
var db;

dbUtils.connectToServer(function(err, client) {
  if (err) console.log(err);
  // start the rest of your app here
  server.listen(port);
  db = dbUtils.getDb;
});

app.use(express.static(__dirname + "/pages"));
app.use(bodyParser.urlencoded({ extended: true }));

// SET STORAGE
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads");
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  }
});

//a place for us to store our photos locally
var upload = multer({ storage: storage });

//Upload a photo to our database, wherever the server is running from, a local version of the file will be saved
app.post("/", upload.single("picture"), (req, res) => {
  var img = fs.readFileSync(req.file.path);
  var encode_image = img.toString("base64");
  // Define a JSONobject for the image attributes for saving to database

  var finalImg = {
    contentType: req.file.mimetype,
    image: new Buffer(encode_image, "base64")
  };

  dbUtils.uploadPhoto(finalImg, (error, photoID) => {
    if (error) return console.log(error);

    res.end(photoID);
  });
});

//When a client makes a get request to our root page, send them back our home html page
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/pages/User.html");
});

//Used if we ever need to get all photos, currently isn't being used
app.get("/photos", (req, res) => {
  dbUtils.getAllPhotos((err, imgArray) => {
    if (err) return console.log(err);
    res.send(imgArray);
  });
});

//Whenever the client makes a request to this url with the proper photo id, we will send the image back to them
//We use this to display images on the user side whenever a client uploads one.
app.get("/photo/:id", (req, res) => {
  var imgID = req.params.id;
  //Find the image in our collection that has this ID
  dbUtils.getImageWithID(imgID, (err, image) => {
    if (err) return console.log(err);

    res.contentType("image/jpeg");
    res.send(image);
  });
});

io.on("connection", function(socket) {
  console.log("User has connected");

  /* **************** Built in Socket Events ***************** */

  socket.on("disconnect", () => {
    console.log("User has disconnected");
  });

  /* **************** Our personal Socket Events ***************** */

  socket.on("chatMessage", (message, color) => {
    console.log(`User sent a message: ${message}`);
    //emit to all user's the message that was just sent
    io.emit("message", filter.clean(message), color);
  });
  //send imageID to all clients
  socket.on("imageMessage", id => {
    io.emit("imageSent", id);
  });
});

module.exports = {
  db
};
