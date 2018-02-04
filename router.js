var express = require('express');
var router = express.Router();
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('pages/index');
});

/* Compile API post request */
router.post('/compile', function(req, res) {
  require('./controllers/compile_alanplusplus').post(req,res);  
});

/* matches all get program API reuests */
router.get('/programs/:programid', function(req, res) {
	console.log(__dirname);
	console.log(process.cwd());
	fs.readFile(__dirname+'/views/pages/'+req.param('programid'), 'utf8', function(err, data){
		if(err) throw err;

		res.send(data);
	});	
});
module.exports = router;