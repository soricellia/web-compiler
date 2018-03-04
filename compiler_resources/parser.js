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
var Tree = require('./tree');

function Parser(){
	// the parse tree
	this.tree = new Tree();

	//our index for iterating over tokens
	this.index = 0;

	this.tokens = {};
	this.errors = [];


// public functions

// called to init the parse program
this.parseTokens = function(tokens, done){

	this.tokens = tokens;
	console.log("tokens: ", tokens)
	this.errors.length = 0;
	// start parsing our grammer
	this.parseProgram();

	if(!this.errors.length > 0){
		console.log("here");
		console.log(this.tree.toString());

		// we made it here therefore we can just return the completed tree
		done(null, this.tree.toString());
	}else{
		// process our errors
		console.log(this.errors);
	} 
}

this.parseProgram = function(){
	// add the root node
	this.tree.addNode("Program", "branch");

	//using our ll1 grammer, we can look ahead one token.
	var currentToken = this.getNext(this.tokens);
	
	console.log("current token: ", currentToken);

	if(currentToken.type == "t_openBrace"){
		this.match(currentToken);
	}else{
		this.errors.push("Error on line " + currentToken.linenumber 
			+ ", expecting open bracket \"{\" character."
			+ " Hint: Try starting your program with a \"{\" character");
	}
}

this.parseBlock = function(){
	// since we're in a recursive mindfuck, we have to do
	// things like this to bubble out of error case recursions
	if(this.errors){
		console.log(this.errors);
	}else{

	}
}

this.parseStatementList = function(tokens, done){

}

this.parseStatement = function(tokens, done){

}

this.parsePrintStatement = function(tokens, done){

}

this.parseAssignmentStatement = function(tokens, done){

}

this.parseVarDecl = function(tokens, done){
	
}

this.parseWhileStatement = function(tokens, done){
	
}

this.parseIfStatement = function(tokens, done){
	
}

this.parseExpr = function(tokens, done){
	
}

this.parseIntExpr = function(tokens, done){
	
}

this.parseStringExpr = function(tokens, done){
	
}

this.parseBooleanExpr = function(tokens, done){
	
}

this.parseId = function(tokens, done){
	
}

this.parseCharList = function(tokens, done){
	
}


// returns the next token in our list
// or false if there are no more tokens
this.getNext = function(){
	if(this.tokens.length > this.index)
		return this.tokens[this.index];
	else
		return false;
}

// increments the token counter 
// adds the token as a leaf to the tree
this.match = function(token){
	this.tree.addNode(JSON.stringify(token.tokenValue), "leaf");
	this.index++;
}
}

module.exports = Parser;





























