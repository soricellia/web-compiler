exports.post = function(req, res) {
	req.on("data", function(data){
		var dataString = String(data);
		res.send(data);
	});
};