var Parser = require('../compiler_resources/parser');
exports.post = function(req, res) {
	req.on("data", function(data){
		// data is a json string
		// convert json string to array
		var tokens = JSON.parse(data);
		var tree;
		var parser = new Parser();
		parser.parseTokens(tokens, function(err, parseTree){
			if(err){
				console.log(err);
			}
			else{
				tree = parseTree;
			}

		});

		res.send(tree);
	});
};