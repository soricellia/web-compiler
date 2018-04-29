var Parser = require('../compiler_resources/parser');
var ASTParser = require('../compiler_resources/ast_parser');
var CodeGenerator = require('../compiler_resources/code_generator.js');

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
					responseMessage[i]['parse'] = {}
					responseMessage[i]['parse']['errs'] = errs;
					responseMessage[i]['parse']['hints'] = hints;
					responseMessage[i]['parse']['verbose'] = verboseMessages;
					responseMessage[i]['parse']['tree'] = parseTree;

					// if there was no errors, go ahead and build an AST
					if(!responseMessage[i]['parse']['errs']){
						parseAST(programs[i], responseMessage[i]);
						if(responseMessage[i]['ast']['errs'].length == 0){
							generateCode(responseMessage[i]['ast']['tree'], 
								responseMessage[i]['ast']['symbolTable'],
								responseMessage[i]);
						}
					}
					// if we're done parsing the last program
					// send it back to the front end
					if((i+1) == programs.length){
						responseMessage[i]['ast']['tree'] = null;
						res.send(JSON.stringify(responseMessage));
					}
				});

				//console.log(responseMessage);
			}else{
				responseMessage[i] = {};
				responseMessage[i]['parse'] = {}
				responseMessage[i]['parse']['errs'] = ["Failed to Lex -- Ignoring Program"];
				responseMessage[i]['parse']['hints'] = null;
				responseMessage[i]['parse']['verbose'] = null;
				responseMessage[i]['parse']['tree'] = null;
			}
		}
	});
};

function parseAST(tokens, responseMessage, ast){
	var astParser = new ASTParser(true);
	astParser.parseTokens(tokens, function(errs, warnings, astToString, symbolTable, ast){
		responseMessage['ast'] = {};
		responseMessage['ast']['errs'] = errs;
		responseMessage['ast']['warnings'] = warnings;
		responseMessage['ast']['treeToString'] = astToString;
		responseMessage['ast']['symbolTable'] = symbolTable;
		responseMessage['ast']['tree'] = ast;
	});
}

function generateCode(AST, symbolTable, responseMessage){
	var codeGenerator = new CodeGenerator();
	codeGenerator.generateCode(AST, symbolTable, function(errs, code){
		responseMessage['codeGen'] = {};
		responseMessage['codeGen']['errs'] = errs;
		responseMessage['codeGen']['code'] = code;
	})
}