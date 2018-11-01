var mysql = require("mysql");
var express = require('express');
var app = express();
var router = express.Router();
var methodOverride = require('method-override');

var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var keys = require("../key");
var verifyToken =  require ("./utils/validation");


app.use(bodyParser.urlencoded({ extended: true }));


app.use(bodyParser.json());

var path = require("path");

app.use(express.static("public"));

app.set('view engine', 'ejs');

app.use(methodOverride('_method'));


var connection = mysql.createConnection({
    host: 'localhost',

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: 'root',

    // Your password
    password: 'password',
    database: 'crypto_db'
});



// function verifyToken (req, res, next) {
//     // check header or url parameters or post parameters for token
//     var token = req.body.token || req.query.token || req.headers['x-access-token'];
//     console.log(token);
//     if (token) {
//         jwt.verify(token, keys.JWT_SECRET, (err, decod) => {
//             if (err) {
//                 res.status(403).json({
//                     message: "Wrong Token"
//                 });
//             } else {
//                 req.decoded = decod;
//                 next();
//             }
//         });
//     } else {
//         res.status(403).json({
//             message: "No Token"
//         });
//         console.log(token);
//     }
//   }

// router.post('/user', verifyToken, function(req, res){
//     // var token = req.body.token || req.query.token;
//     // if (!token) {
//     //     return res.status(401).json({message: 'Must pass token'});
//     // }
//     // var dec = jwt.verify(token, keys.JWT_SECRET);
//     // console.log("this is decoded:", dec);
//     console.log('this is:',  req.decoded._id);
    

// });


router.post('/profile', verifyToken, function (req, res) {
    // var decoded = jwt.decode(token);
    // console.log(decoded);
    var id = req.decoded._id;
    connection.query('SELECT users.id, users.username, users.first_name, users.last_name, users.email, users_profiles.bio, users_profiles.photo, users_profiles.user_location, users_profiles.birthday  FROM users LEFT JOIN users_profiles ON users.id = users_profiles.user_id WHERE users.id = ?;', [id], function (error, results, fields) {
        if (error) throw error;
        res.json(results);
    });
});

router.post('/profile/crypto', verifyToken, function (req, res) {
    var id = req.decoded._id;
    connection.query('SELECT users_cryptos.id, users_cryptos.user_id, users_cryptos.crypto_id, users_cryptos.crypto_address, crypto_info.crypto_metadata_name, crypto_info.crypto_logo, crypto_info.crypto_link, crypto_metadata.crypto_symbol, crypto_metadata.crypto_price   FROM users_cryptos LEFT JOIN crypto_info ON users_cryptos.crypto_id = crypto_info.id LEFT JOIN crypto_metadata ON crypto_info.crypto_metadata_name = crypto_metadata.crypto_name WHERE users_cryptos.user_id = ?;', [id], function (error, results, fields) {
        if (error) throw error;
        res.json(results);
    });
});


router.put('/profile/addAddress', function (req, res) {
    let { id, crypto_address } = req.body
    console.log(id, crypto_address);
    connection.query('UPDATE users_cryptos SET ? WHERE ?', [{ crypto_address }, { id }], function (error, results, fields) {
        if (error) throw error;

        res.json(results);
    });
});

router.post('/profile/friends', verifyToken, function (req, res) {
    var id = req.decoded._id;
    connection.query('SELECT users.id, users.username, users.first_name, users.last_name, users_profiles.photo, users_profiles.user_location FROM users LEFT JOIN users_profiles ON users.id = users_profiles.user_id WHERE users.id IN (SELECT matched_friend_id AS id FROM users_matched_friends WHERE user_id = ? AND both_accepted = 1)', [id], function (error, results, fields) {
        var shuffledfriendsArray = shuffle(results);

        var friendsArray = shuffledfriendsArray.slice(0,11);

        res.json(friendsArray);

    });

});

router.post("/profile/user/transactions", verifyToken, function(req, res) {
    var id = req.decoded._id;
    connection.query(
      'SELECT users_purchases.date_purchased, users_purchases.amount, deals.deal_name, users.username, users_profiles.photo, venues.venue_name, crypto_metadata.crypto_symbol AS crypto_symbol FROM users_purchases LEFT JOIN deals ON users_purchases.deal_id = deals.id LEFT JOIN users ON users_purchases.user_id = users.id LEFT JOIN crypto_info ON users_purchases.crypto_id = crypto_info.id LEFT JOIN crypto_metadata ON crypto_metadata_name = crypto_metadata.crypto_name LEFT JOIN venues ON venue_id = venues.id LEFT JOIN users_profiles ON users_profiles.user_id = users.id WHERE users.id =? AND payment_received = ? ORDER BY users_purchases.date_purchased DESC',
      [id, 1], //1 is true for payment received //community means any user on acceptmycrypto platform
      function(error, results, fields) {
        if (error) throw error;
        res.json(results);
      }
    );
  });


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}



module.exports = router;