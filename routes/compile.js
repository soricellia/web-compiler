var express = require('express');
var router = express.Router();

/* route the request the the compile controller */
router.get('/compile', function(req, res) {
	require('controllers/compile.js').get(req,res);  
});

module.exports = router;
