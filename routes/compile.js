/**************************************************************
*	Compile.js
*	
*	Routes all compile requests to the correct compiler controller
**************************************************************/
var express = require('express');
var router = express.Router();

/* route the request to the compile controller */
router.get('/compile', function(req, res) {
	require('controllers/compile_alanplusplus.js').get(req,res);  
});

module.exports = router;
