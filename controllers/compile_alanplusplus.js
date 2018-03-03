var Parser = require('../compiler_resources/parser');
exports.post = function(req, res) {
	req.on("data", function(data){
		Parser.parseTokens(data, function(err, parseTree){
			console.log(parseTree);
		});
		res.send(data);
	});
};