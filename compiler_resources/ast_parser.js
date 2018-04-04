/****************************************************************
	Parser.js
	Input: 
		Constructor: parser(verbose)
					-verbose outputs the stack trace made during the 
					 recursive decent parse
		parseTokens: parseTokens(tokens, done)
					-tokens is a list of valid tokens for a++ grammer
					-done is a callback function
	Purpose:
		parses list of tokens using alan++ language grammer
	output:
		return(errors, hints, verboseMessages, parseTree)
***************************************************************/
var Tree = require('./tree');

const firstOfStatement = new Set(["t_print", "t_while", "t_if" 
						, "t_type", "t_openBrace", "t_char"]);

const firstOfExpr = new Set(["t_digit", "t_string", "t_openParen", "t_boolval", "t_char"]);

function ASTParser(verbose){
	// the parse tree
	this.tree = new Tree();

	//our index for iterating over tokens
	this.index = 0;

	this.tokens = {};
	this.errors = [];

	this.currentToken = null;
	this.warnings = [];
	this.verboseMessages = []
	this.verbose = verbose;
	this.symbolTable = [];
	this.charList = "";

/******************
 public functions
******************/

// called to init the parse program
this.parseTokens = function(tokens, done){
	this.tokens = tokens;
	this.clearParser();

	// start parsing our grammer
	this.parseProgram();

	if(!this.errors.length > 0){
		// we made it here therefore we can just return the completed tree
		done(null, this.warnings, this.tree.toString());
		
		// this is for ease of grading
		console.log(this.tree.toString());
		console.log("Symbol Table wannbe thingy", this.symbolTable);
	}
	
	else{
		console.log(this.tree.toString());
		console.log(this.errors);
		// process our errors
		done(this.errors, this.hints, this.verboseMessages, null);

	} 
}

/************************
	clears the parser
***********************/
this.clearParser = function(){
	this.tree = new Tree();
	//this.errors.length = 0;

	//our index for iterating over tokens
	this.index = 0;
	this.errors = [];
	this.currentToken = null;
	this.hints = [];
	this.verboseMessages = []
	this.verbose = verbose;
	this.symbolTable = [];

}

/*************************
	starts the parsing sequence 
**************************/
this.parseProgram = function(){
	if(this.verbose){
		this.verboseMessages.push("ParseProgram()");
	}
	this.parseBlock();
	this.kick();

	var notDone = this.getNext();

	//if we're not done processing tokens and we dont already have errors
	// this means there is still more code, but there shouldnt be
	if(notDone && this.errors.length == 0){
		this.errors.push("Error on line " + notDone.linenumber + ". Expecting End of Program (EOP) marker \$, found " + notDone.tokenValue);
		this.hints.push("Hint: A valid program looks like { Statement }\$ -- Note the EOP marker.")
	}
}

/*
	Block ::== { StatementList } 
*/
this.parseBlock = function(){
	// since we're in a recursive mindfuck, we have to do
	// things like this to bubble out of error case recursions
	if(this.errors.length > 0){
		// preexisting error case, used to bubble our of recursion

	}else{
		this.tree.addNode("Block", "branch")

		//using our ll1 grammer, we can look ahead one token.
		this.currentToken = this.getNext(this.tokens);
	
		if(this.currentToken.type == "t_openBrace"){
			// match {
			this.match(this.currentToken);
			
			this.parseStatementList();
			
			this.currentToken = this.getNext();
			
		if(this.currentToken.type == "t_closeBrace"){
				this.match(this.currentToken);

			}

			else{
				// THIS IS A 'SMART' HINT :D
				if(this.currentToken.tokenValue == "="){
					 this.errors.push("Error on line " + this.currentToken.linenumber 
						+ ". Found \"" + this.currentToken.tokenValue +
						"\", expecting close bracket \"}\" character.");
					 
					 this.hints.push("Hint: Assignment Statements must be seperate from Variable Declarations."
						+ " Ex. int a a = 6");

				}else{
					this.errors.push("Error on line " + this.currentToken.linenumber 
					+ ". Found \""+ this.currentToken.tokenValue +
					"\", expecting close bracket \"}\" character.");
					if(this.currentToken.tokenValue == "+"){
						this.hints.push("Hint: an IntExpr look like digit + Expr."
							+ "<br /> Ex. int a = 7 + a is valid <br />  &nbsp;&nbsp;&nbsp; int a = a + 7 is not valid");
					}

				}

			}
		}else{
			//ERROR CASE
			this.errors.push("Error on line " + this.currentToken.linenumber 
				+ ". Found " + this.currentToken.tokenValue +", expecting open bracket \"{\" character.");

			this.hints.push("Hint: Try starting your program with a \"{\" character");
		}

	}

}

/*
	StatementList ::== Statement StatementList
				  ::== ε
*/
this.parseStatementList = function(){
	if(this.errors.length == 0){

		// get our current token
		this.currentToken = this.getNext(this.tokens);
	
		// check if the current token is in fist of statement
		if(firstOfStatement.has(this.currentToken.type)){
			this.parseStatement();
			this.parseStatementList();
		}else{
			// LAMBDA PRODUCTION
		
		}
	
	}else{
		console.log("i got an error here");
		// we have errors
		// since this is an lambda production, the error had to
		// have came from somewhere else, so do nothing
	}
}

/**
	Statement ::== PrintStatement
			  ::== AssignmentStatement
			  ::== VarDecl
			  ::== WhileStatement
   			  ::== IfStatement
			  ::== Block 
**/
this.parseStatement = function(){
	if(this.verbose){
		this.verboseMessages.push("ParseStatement()");
	}

	if(this.errors.length == 0){
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

/*
	PrintStatement ::== print ( Expr )
*/
this.parsePrintStatement = function(){
	if(this.verbose){
		this.verboseMessages.push("ParsePrintStatement()");
	}

	if(this.errors.length == 0){
		this.tree.addNode("Print", "branch");

		this.nextToken = this.getNext();
		if(this.nextToken && this.nextToken.type == "t_print"){
			// match PRINT
			this.match(this.nextToken);
			this.nextToken = this.getNext();
			if(this.nextToken.type == "t_openParen"){
				// match (
				this.match(this.nextToken);

				this.parseExpr();

				this.nextToken = this.getNext();
				if(this.nextToken.type == "t_closeParen"){
					// match )
					this.match(this.nextToken);
				}else{
					// ERROR, missing ) after printexpr

					this.errors.push("Error on line " +
						this.currentToken.linenumber +
						". Found " + this.currentToken.tokenValue +
						" Expecting \")\" after print expr.");

					//smart hint detection
					if(this.currentToken.type == "t_char"){
						this.hints.push("Hint: an a print statement looks like print(Expr)."
							+ "<br /> Ex. print(7 + a) is valid <br />  &nbsp;&nbsp;&nbsp; print(a + 7) is not valid");
					
					}
					else{
						this.hints.push("Hint: a print statement looks like print(Expr)");
					
					}

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

/*
	AssignmentStatement ::== Id = Expr 
*/
this.parseAssignmentStatement = function(){
	if(this.errors.length == 0){
		this.tree.addNode("Assignment Statement", "branch");

		if(this.currentToken.type == "t_char"){
			// match ID
			this.match(this.currentToken);

			this.currentToken = this.getNext();

			if(this.currentToken.type == "t_assignment"){
				// match =
				this.match(this.currentToken);
				this.parseExpr();

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

/*
	VarDecl ::== type Id 
*/
this.parseVarDecl = function(){
	if(this.errors.length == 0){
		this.tree.addNode("Variable Declaration", "branch");

		// used for symbol table stuff
		var scopeMan =  this.getNext().tokenValue;
		
		//match type
		this.match(this.currentToken);

		this.currentToken = this.getNext();

		if(this.currentToken.type == "t_char"){
			this.parseId();

			// add the type and ID to the symbol table 
			scopeMan = scopeMan + ' ' + this.currentToken.tokenValue;
			this.symbolTable.push(scopeMan);

		}else{
			// error, expecting id
			this.errors.push("Error on line" + 
				this.currentToken.linenumber +
				". Found " + this.currentToken.tokenValue +
				" Expecting Variable ID.");

			this.hints.push(" Hint: An ID is only one character, lowercase [a-z]");
		
		}

	}else{
		// preexisting error case, bubble out of recursion	
	}

}

/**
	WhileStatement ::== while BooleanExpr Block 
*/
this.parseWhileStatement = function(){
	if(this.errors.length == 0){
		this.tree.addNode("While Statement", "branch");

		// match WHILE
		this.match(this.currentToken);

		this.parseBooleanExpr();
		this.parseBlock();

		// new scope

		// pop scope back
		this.kick();
	
	}else{
		// preexisting error case, bubble out of recursion	
	
	}	
}

/*
	IfStatement ::== if BooleanExpr Block
*/
this.parseIfStatement = function(){
	if(this.errors.length == 0){
		this.tree.addNode("If Statement", "branch");

		// match IF
		this.match(this.currentToken);

		this.parseBooleanExpr();
		this.parseBlock();
		// new scope

		this.kick();
	}else{
		// preexisting error case, bubble out of recursion	
	}	
}

/*
	Expr ::== IntExpr
		 ::== StringExpr
		 ::== BooleanExpr
		 ::== Id 
*/
this.parseExpr = function(){
	this.currentToken = this.getNext();
	
	if(this.errors.length == 0){
		if(this.currentToken.type == "t_digit"){
			this.parseIntExpr();
		}

		else if(this.currentToken.type == "t_string"){
			this.parseStringExpr();
		
		}

		else if(this.currentToken.type == "t_openParen"){
			this.parseBooleanExpr();
		
		}

		else if(this.currentToken.type == "t_char"){
			this.parseId();
		
		}

		else if(this.currentToken.type == "t_boolval"){
			this.parseBooleanExpr();

		}
		else{
			if(this.errors.length == 0){
				this.errors.push("Error on line "+ this.currentToken.linenumber
					+ ". Found " + this.currentToken.tokenValue + 
					" Expecting digit,  \"\"\", \"(\", boolval or ID character [a-z]");
			
			}
		
		}
		
	}else{
		// preexisting error case, bubble out of recursion	
	
	}	
}

/**
	IntExpr ::== digit intop Expr
			::== digit 

**/
this.parseIntExpr = function(){
	if(this.errors.length == 0){
		// first look ahead one token and see if the next token is an intop
		if(this.tokens[this.index+1].type == "t_intop"){
			//the intop is going to be the branch in the AST
			this.tree.addNode("Add", 'branch');
		}
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

/**
	StringExpr ::== " CharList " 

**/
this.parseStringExpr = function(){	
	if(this.errors.length == 0){
		
		// match " 
		this.match(this.currentToken);
		
		this.charList = "";
		this.parseCharList();

		this.currentToken = this.getNext();
		if(this.currentToken.type == "t_string"){
			this.tree.addNode(this.charList);
			this.match(this.currentToken);
		}else{
			// error, expecting end of string "
			this.errors.push("Error on line " + 
				this.currentToken.linenumber + 
				". Found " + this.currentToken.tokenValue +
				" Expecting end of string \" character.");

			this.hints.push("Hint: \"xyz\" is a string.");	
		}
	}else{
		// preexisting error case, bubble out of recursion	
	
	}	
}

/**
	BooleanExpr ::== ( Expr boolop Expr )
				::== boolval

**/
this.parseBooleanExpr = function(){
	if(this.errors.length == 0){

		this.currentToken = this.getNext();
		
		// boolop case
		if(this.currentToken.type == "t_boolval"){
			// match boolval
			this.match(this.currentToken);

		}
		
		// (expr boolop expr) case
		else if(this.currentToken.type == "t_openParen"){

			// match (
			this.match(this.currentToken);
			
			// we look ahead one token to see if the next is a boolop
			// if it is we want to add it to the tree first
			if(this.tokens[this.index+1].type == "t_boolop"){
				if(this.tokens[this.index+1].tokenValue == "=="){
					this.tree.addNode("Equals", "branch");
				}else{
					this.tree.addNode("Not Equals", "branch");
				}
			}

			this.parseExpr();
			
			this.currentToken = this.getNext();

			if(this.currentToken.type == "t_boolop"){
				// match boolop  
				this.match(this.currentToken);

				this.parseExpr();
				
				// kick back up the boolop 
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
						" Expecting \")\" character.");
					
					this.hints.push("Hint: BooleanExpr looks like (Expr boolop Expr)");
			
				}
			
			}else{
				this.errors.push("Error on line " + 
						this.currentToken.linenumber +
						". Found " + this.currentToken.tokenValue +
						" Expecting boolop.");

				this.hints.push("Hint: BooleanExpr looks like (Expr boolop Expr)");
			}

		}else{
			// error, expecting +
			this.errors.push("Error on line " + 
					this.currentToken.linenumber +
					". Found " + this.currentToken.tokenValue +
					" Expecting \"\" character.");

			this.hints.push("Hint: BooleanExpr looks like (Expr boolop Expr)");
		}
	
	}else{
		// preexisting error case, bubble out of recursion	
	
	}	

}

/*
	Id ::== char 
*/
this.parseId = function(){	
	if(this.errors.length == 0){
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
		
	}

	else{
		// preexisting error case, bubble out of recursion	

	}	

}


/*
	CharList ::== char CharList
			 ::== space CharList
			 ::== ε
*/
this.parseCharList = function(){
	if(this.errors.length == 0){
		

		this.currentToken = this.getNext();
		if(this.currentToken.type == "t_char"){
			// match char
			this.charList += this.currentToken.tokenValue;
			this.index++;
			//this.match(this.currentToken);
			
			this.parseCharList();
		
		}

		else{
			// I DONT CARE ABOUT SPACES SO, 
			// LAMBDA PRODUCTION
		
		}
	}

	else{
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
	if(token.type != "t_openBrace" && token.type != "t_closeBrace" 
		&& token.type != "t_openParen" && token.type != "t_closeParen"
		&& token.type != "t_if" && token.type != "t_print" 
		&& token.type != "t_while" && token.type != 't_assignment'
		&& token.type != "t_boolop" && token.type != 't_string'
		&& token.type != "t_intop")
	{
		if(token)
		this.tree.addNode(token.tokenValue, "leaf");
	
	}
	this.index++;
}


//kicks the tree one level up
this.kick = function(){
	this.tree.endChildren();
}

}

module.exports = ASTParser;