var express = require('express');
var app = express();
var router = express.Router();
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
//coinpayment
var Coinpayments = require("coinpayments");
var keys = require("../key");
var client = new Coinpayments(keys.coinpayment);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
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

// api
//get list of checkouts
router.get('/api/checkout', function(req, res) {
  connection.query(
    'SELECT * FROM users_purchases',
    function(error, results, fields) {
      if (error) throw error;
      res.json(results);
    }
  );
});

//coinpayment
router.post("/checkout", function(req, res) {
  //Inserting to user_purchases table, this doens't mean purchase is successful
  //Need to listen to IPA when payment has recieved and then update payment_recieved to true

  client.createTransaction(
    {
      currency1: "USD",
      currency2: req.body.crypto_name, // The currency the buyer will be sending.
      amount: req.body.amount // Expected amount to pay, where the price is expressed in currency1
    },
    function(err, paymentInfo) {
      if (err) {
        console.log("coinpayment error: ", err);
      } else {
        //send the paymentInfo to the client side
        res.json(paymentInfo);

        connection.query(
        'INSERT INTO users_purchases SET ?',
        {
          user_id: req.body.user_id,
          deal_id: req.body.deal_id,
          crypto_name: req.body.crypto_name,
          amount: paymentInfo.amount,
          txn_id: paymentInfo.txn_id, //coinpayment transaction address
          address: paymentInfo.address, //coinpayment temporary address
          confirms_needed: paymentInfo.confirms_needed,
          timeout: paymentInfo.timeout, //in seconds
          status_url: paymentInfo.status_url,
          qrcode_url: paymentInfo.qrcode_url
        },
        function(err, transactionInitiated) {
          if (err) {
            console.log(err)
          }
        })
      }
    }
  );
});


module.exports = router;