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

const firstOfStatement = new Set(["t_print", "t_while", "t_if" 
						, "t_type", "t_openBrace", "t_char"]);

const firstOfExpr = new Set(["t_digit", "t_string", "t_openParen", "t_char"]);

function Parser(){
	// the parse tree
	this.tree = new Tree();

	//our index for iterating over tokens
	this.index = 0;

	this.tokens = {};
	this.errors = [];

	this.currentToken = null;

// public functions

// called to init the parse program
this.parseTokens = function(tokens, done){

	this.tokens = tokens;
	this.errors.length = 0;
	// start parsing our grammer
	this.parseProgram();

	if(!this.errors.length > 0){
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
	console.log("ParseProgram()");
	this.parseBlock();
	this.kick();
}

this.parseBlock = function(){
	console.log("ParseBlock()");

	// since we're in a recursive mindfuck, we have to do
	// things like this to bubble out of error case recursions
	if(this.errors.length > 0){
		console.log(this.errors);
	}else{
		this.tree.addNode("Block", "branch")

		//using our ll1 grammer, we can look ahead one token.
		this.currentToken = this.getNext(this.tokens);
	
		if(this.currentToken.type == "t_openBrace"){
			// match {
			this.match(this.currentToken);
			this.parseStatementList();
			this.kick();
			this.currentToken = this.getNext();
			if(this.currentToken.type == "t_closeBrace"){
				this.match(this.currentToken);
			}else{
				this.errors.push("Error on line " + this.currentToken.linenumber 
				+ ", expecting close bracket \"}\" character."
				+ " Hint: did you forget a \"}\" character?");
			}
		}else{
			//ERROR CASE
			this.errors.push("Error on line " + this.currentToken.linenumber 
				+ ", expecting open bracket \"{\" character."
				+ " Hint: Try starting your program with a \"{\" character");
		}
	}
}

this.parseStatementList = function(){
	console.log("ParseStatementList()");


	if(this.errors.length == 0){
		this.tree.addNode("StatementList", "branch");	
		
		// get our current token
		this.currentToken = this.getNext(this.tokens);
	
		// check if the current token is in fist of statement
		if(firstOfStatement.has(this.currentToken.type)){
			this.parseStatement();
			this.kick();
			this.parseStatementList();
			this.kick();
		}else{
			// LAMBDA PRODUCTION
		}
	}else{
		// we have errors
		// since this is an lambda production, the error had to
		// have came from somewhere else, so do nothing
	}
}

this.parseStatement = function(){
	console.log("ParseStatement()");

	if(this.errors.length == 0){
		this.tree.addNode("Statement", "branch");
		if(this.currentToken.type == "t_print"){
			this.parsePrintStatement();
			this.kick();
		}
		
		else if(this.currentToken.type == "t_char"){
			this.parseAssignmentStatement();
			this.kick();
		}

		else if(this.currentToken.type == "t_type"){
			this.parseVarDecl();
			this.kick();
		}

		else if(this.currentToken.type == "t_while"){
			this.parseWhileStatement();
			this.kick();
		}

		else if(this.currentToken.type == "t_if"){
			this.parseIfStatement();
			this.kick();
		}

		else if(this.currentToken.type == "t_openBrace"){
			this.parseBlock();
			this.kick();
		}

		else{
			this.errors.push("Error on line " +
					this.currentToken.linenumber +
					". Expecting \"print\", \"int\", \"string\", \"boolean\""
					+ ", \"variable_name\", \"while\", \"if\" or \"{\".");
		}
	}else{
		// preexisting error case, bubble out of recursion
	}
}

this.parsePrintStatement = function(){
	console.log("ParsePrintStatement()");
	if(this.errors.length == 0){
		
		this.tree.addNode("PrintStatement", "branch");

		if(this.nextToken.type == "t_print"){
			// match PRINT
			this.match(this.nextToken);
			this.nextToken = this.getNext();
			if(this.nextToken.type == "t_openParen"){
				// match (
				this.match(this.nextToken);

				this.parseExpr();
				this.kick();

				this.nextToken = this.getNext();
				if(this.nextToken.type == "t_closeParen"){
					// match )
					this.match(this.nextToken);
				}else{
					// error, missing ) after printexpr
					this.errors.push("Error on line " +
						this.currentToken.linenumber +
						". Found " + this.currentToken.tokenValue +
						" Expecting \")\" after print expr." +
						" Hint: a print statement looks like print(expr)");
				}
			}else{
				// error, missing ( after print
				this.errors.push("Error on line " + 
					this.currentToken.linenumber +
					". Found "+ this.currentToken.tokenValue + 
					" Expecting \"(\" after print statement");
			}
		}else{
			this.errors.push("Error expecting print statement");
		}
	}else{
		// preexisting error case, bubble out of recursion	
	}
}

this.parseAssignmentStatement = function(){
	console.log("parseAssignmentStatement()");

	if(this.errors.length == 0){
		this.tree.addNode("AssignmentStatement", "branch");

		if(this.currentToken.type == "t_char"){
			// match ID
			this.match(this.currentToken);

			this.currentToken = this.getNext();

			if(this.currentToken.type == "t_assignment"){
				// match =
				this.match(this.currentToken);
				this.parseExpr();
				this.kick();

			}else{
				// error, missing + 
				this.errors.push("Error on line " +
					this.currentToken.linenumber +
					". Found " + this.currentToken.tokenValue +
					" Expecting \"+\"");
			}
		}
	}else{
		// preexisting error case, bubble out of recursion	
	}
}

this.parseVarDecl = function(){
	console.log("parseVarDecl()");

	if(this.errors.length == 0){
		this.tree.addNode("VarDecl", "branch");

		//match type
		this.match(this.currentToken);

		this.currentToken = this.getNext();

		if(this.currentToken.type == "t_char"){
			this.parseId();
			this.kick();
		}else{
			// error, expecting id
			this.errors.push("Error on line" + 
				this.currentToken.linenumber +
				". Found " + this.currentToken.tokenValue +
				" Expecting Variable ID. Hint: An ID is only one character, lowercase [a-z]");
		}
	}else{
		// preexisting error case, bubble out of recursion	
	}
}

this.parseWhileStatement = function(){
	console.log("parseWhileStatement()");

	if(this.errors.length == 0){
		this.tree.addNode("WhileStatement", "branch");

		// match WHILE
		this.match(this.currentToken);

		this.parseBooleanExpr();
		this.kick();
		this.parseBlock();
		this.kick();
	}else{
		// preexisting error case, bubble out of recursion	
	}	
}

this.parseIfStatement = function(){
	console.log("parseIfStatement()");

	if(this.errors.length == 0){
		this.tree.addNode("IfStatement", "branch");

		// match IF
		this.match(this.currentToken);

		this.parseBooleanExpr();
		this.kick();
		this.parseBlock();
		this.kick();
	}else{
		// preexisting error case, bubble out of recursion	
	}	
}

this.parseExpr = function(){
	console.log("parseExpr()");
	this.currentToken = this.getNext();
	
	if(this.errors.length == 0){
		this.tree.addNode("Expr", "branch");
		if(this.currentToken.type == "t_digit"){
			this.parseIntExpr();
			this.kick();
		}else if(this.currentToken.type == "t_string"){
			this.parseStringExpr();
			this.kick();
		}else if(this.currentToken.type == "t_openParen"){
			this.parseBooleanExpr();
			this.kick();
		}else if(this.currentToken.type == "t_char"){
			this.parseId();
			this.kick();
		}else{
			this.errors.push("Error on line "+ this.currentToken.linenumber
				+ ". Found " + this.currentToken.tokenValue + 
				" Expecting digit, string character \"\"\" , open paren character \")\" or ID character [a-z]");
		}
		
	}else{
		// preexisting error case, bubble out of recursion	
	}	
}

this.parseIntExpr = function(){
	console.log("parseIntExpr()");

	if(this.errors.length == 0){
		this.tree.addNode("IntExpr", "branch");
		// match digit
		this.match(this.currentToken);

		this.currentToken = this.getNext();

		if(this.currentToken.type == "t_intop"){
			// match +
			this.match(this.currentToken);

			this.parseExpr();
			this.kick();

		}else{
			// lambda production
		}
	}else{
		// preexisting error case, bubble out of recursion	
	}	
}

this.parseStringExpr = function(){
	console.log("parseStringExpr()")
	
	if(this.errors.length == 0){
		this.tree.addNode("StringExpr", "branch");
		
		// match " 
		this.match(this.currentToken);
		this.parseCharList();
		this.kick();

		this.currentToken = this.getNext();
		if(this.currentToken.type == "t_string"){
			this.match(this.currentToken);
		}else{
			// error, expecting end of string "
			this.errors.push("Error on line " + 
				this.currentToken.linenumber + 
				". Found " + this.currentToken.tokenValue +
				" Expecting end of string \" character. Hint: \"xyz\" is a string.");	
		}
	}else{
		// preexisting error case, bubble out of recursion	
	}	
}

this.parseBooleanExpr = function(){
	console.log("parseBooleanExpr()");
	if(this.errors.length == 0){
		this.tree.addNode("BooleanExpr", "branch");

		this.currentToken = this.getNext();
		// match (
		this.match(this.currentToken);
		
		this.parseExpr();
		this.kick();

		this.currentToken = this.getNext();

		if(this.currentToken.type == "t_boolop"){
			// match boolop  
			this.match(this.currentToken);

			this.parseExpr();
			this.kick();

			this.currentToken = this.getNext();

			if(this.currentToken.type == "t_closeParen"){
				// match )
				this.match(this.currentToken);
			}else{
				// error, expecting )
				this.errors.push("Error on line " + 
					this.currentToken.linenumber +
					". Found " + this.currentToken.tokenValue +
					" Expecting \")\" character. Hint: BooleanExpr looks like (Expr boolop Expr)");
			}


		}else{
			// error, expecting +
			this.errors.push("Error on line " + 
					this.currentToken.linenumber +
					". Found " + this.currentToken.tokenValue +
					" Expecting \"\" character. Hint: BooleanExpr looks like (Expr boolop Expr)");
		}
	}else{
		// preexisting error case, bubble out of recursion	
	}	
}

this.parseId = function(){
	console.log("parseId()")
	
	if(this.errors.length == 0){
		this.tree.addNode("Id", "branch");
		this.currentToken = this.getNext();
		if(this.currentToken.type == "t_char"){
			// match char
			this.match(this.currentToken);	
		}else{
			// error, expecting char
			this.errors.push("Error on line" + 
					this.currentToken.linenumber +
					". Found " + this.currentToken.tokenValue +
					" Expecting ID. Hint: an ID is a single lowercase character [a-z]");	
		}
		
	}else{
		// preexisting error case, bubble out of recursion	
	}	
}

this.parseCharList = function(){
	if(this.errors.length == 0){
		this.currentToken = this.getNext();

		if(this.currentToken.type = "t_char"){
			// match char
			this.match(this.currentToken);
			this.parseCharList();
		}else{
			// I DONT CARE ABOUT SPACES SO, 
			// LAMBDA PRODUCTION
		}
	}else{
		// preexisting error case, bubble out of recursion	
	}	
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


//kicks the tree one level up
this.kick = function(){
	this.tree.endChildren();
}

}

module.exports = Parser;





























