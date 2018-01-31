var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('pages/index', { title: 'Express' });
});

/* GET home page. */
router.get('/compile', function(req, res) {
  require('./controllers/compile_alanplusplus.js').get(req,res);  
});

module.exports = router;
