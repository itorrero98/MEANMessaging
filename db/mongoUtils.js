const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const url = "mongodb://localhost:27017";

var _db;

var connectToServer = function(callback) {
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
    _db = client.db("RealTimeMessaging");
    return callback(err);
  });
};

var getDb = function() {
  return _db;
};

var uploadPhoto = (imgObject, callback) => {
  if (imgObject == null) callback("Empty object, couldn't add to database");

  _db.collection("photos").insertOne(imgObject, (err, result) => {
    console.log(result);

    if (err) return callback(err);
    callback(null, `${result["ops"][0]._id}`);
  });
};

var getAllPhotos = callback => {
  _db
    .collection("photos")
    .find()
    .toArray((err, result) => {
      const imgArray = result.map(element => element._id);
      console.log(imgArray);

      if (err) return callback(err);
      callback(null, imgArray);
    });
};

var getImageWithID = (imgID, callback) => {
  _db.collection("photos").findOne({ _id: ObjectID(imgID) }, (err, result) => {
    if (err) return callback(err);
    //send it back
    callback(null, result.image.buffer);
  });
};

module.exports = {
  connectToServer,
  getDb,
  uploadPhoto,
  getAllPhotos,
  getImageWithID
};
