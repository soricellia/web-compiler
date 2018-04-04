var Parser = require('../compiler_resources/parser');
exports.post = function(req, res) {
	req.on("data", function(data){
		// data is a json string
		// convert json string to array
		var programs = JSON.parse(data);
		var responseMessage = {};

		// we init the parser with verbose on
		var parser = new Parser(true);
		
		// parse each program

		var i;
		for(i = 0 ; i < programs.length ; i++){
			// if there was no program then that means there is a lex error
			if(programs[i]){
				parser.parseTokens(programs[i], function(errs, hints, verboseMessages, parseTree){
					responseMessage[i] = {};
					responseMessage[i]['errs'] = errs;
					responseMessage[i]['hints'] = hints;
					responseMessage[i]['verbose'] = verboseMessages;
					responseMessage[i]['tree'] = parseTree;

					// if we're done parsing the last program
					// send it back to the front end
					if((i+1) == programs.length){
						res.send(JSON.stringify(responseMessage));
					}
				});

				//console.log(responseMessage);
			}else{
				responseMessage[i] = {};
				responseMessage[i]['errs'] = ["Failed to Lex -- Ignoring Program"];
				responseMessage[i]['hints'] = null;
				responseMessage[i]['verbose'] = null;
				responseMessage[i]['tree'] = null;
			}
		}
	});
};