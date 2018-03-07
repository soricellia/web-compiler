var Parser = require('../compiler_resources/parser');
exports.post = function(req, res) {
	req.on("data", function(data){
		// data is a json string
		// convert json string to array
		var tokens = JSON.parse(data);
		var responseMessage = [];

		// we init the parser with verbose on
		var parser = new Parser(true);
		
		parser.parseTokens(tokens, function(errs, hints, verboseMessages, parseTree){
			// build a response message through an array
			responseMessage.push(errs);
			responseMessage.push(hints);
			responseMessage.push(verboseMessages);
			responseMessage.push(parseTree);

			// now we make the array into a json string and
			// send it back to the front end
			res.send(JSON.stringify(responseMessage));
		});

		//res.send(tree);
	});
};