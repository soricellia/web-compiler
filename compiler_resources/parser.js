/****************************************************************
	Parser.js
	Input: 
		List of tokens 
	Purpose:
		parses list of tokens using alan++ language grammer
	output:
		a Syntax tree with the parsed tokens
		or
		a list of errors if the parse failed
***************************************************************/
var tree = require('./tree');

//we use to figure where were at while iterating over our tokens
var index; 
//constructor
function Parser(){
	// the parse tree
	this.tree = new Tree();

	//our index for iterating over tokens
	this.index = 0;
}

Parser.parseTokens = function(tokens, done){
	
	//first we make a root node in the tree
	tree.addNode("Root", "branch");

	// start parsing our grammer
	parseProgram(tokens, done);

	console.log(tree.toString());
	// we made it here therefore we can just return the completed tree
	done(null, this.tree); 
}

function parseProgram(tokens, done){
	//using our ll1 grammer, we can look ahead one token.
	var currentToken = getNext(tokens);

	console.log(currentToken);

	if(currentToken.type == "t_openBrace"){
		tree.addNode("t_openBrace", "leaf");
		match();
	}
}

function parseStatementList(tokens, done){

}

function parseStatement(tokens, done){

}

function parsePrintStatement(tokens, done){

}

function parseAssignmentStatement(tokens, done){

}

function parseVarDecl(tokens, done){
	
}

function parseWhileStatement(tokens, done){
	
}

function parseIfStatement(tokens, done){
	
}

function parseExpr(tokens, done){
	
}

function parseIntExpr(tokens, done){
	
}

function parseStringExpr(tokens, done){
	
}

function parseBooleanExpr(tokens, done){
	
}

function parseId(tokens, done){
	
}

function parseCharList(tokens, done){
	
}

function getNext(tokens){
	if(tokens.length > index)
		return tokens[i];
	else
		return false;
}
function match(){
	this.index++;
}
module.exports = Parser;





























