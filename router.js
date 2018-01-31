var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('pages/index');
});

/* Compile API post request */
router.post('/compile', function(req, res) {
  require('./controllers/compile_alanplusplus').post(req,res);  
});

module.exports = router;