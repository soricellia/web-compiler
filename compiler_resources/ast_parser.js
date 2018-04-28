/****************************************************************
	ast_parser.js
	Input: 
		Constructor: ASTParser(verbose)
					-verbose outputs the stack trace made during the 
					 recursive decent parse
		parseTokens: parseTokens(tokens, done)
					-tokens is a list of valid tokens for a++ grammer
					-done is a callback function
	Purpose:
		parses list of tokens using alan++ language grammer
		into a abstract syntax tree. 

		Scope checking and type checking via symbol table is done here
	output:
		return(errors, warnings, ast, symbolTable)
***************************************************************/
var Tree = require('./tree');

const firstOfStatement = new Set(["t_print", "t_while", "t_if" 
						, "t_type", "t_openBrace", "t_char"]);

const firstOfExpr = new Set(["t_digit", "t_string", "t_openParen", "t_boolval", "t_char"]);


/**
	symbol table element definition
**/
function SymbolTableElement(name, type, scope, line){
	this.name  = name;
	this.type  = type;
	this.scope = scope;
	this.line  = line;
	this.initalized = false;
	this.used = false;
}

SymbolTableElement.prototype.toString = function symbolTableElementToString(){
		return this.name + "    " 
			+ this.type + "    " 
			+ this.scope + "    " 
			+ this.line + "     "
			+ this.initalized + "     "
			+ this.used;
	}
 

function ASTParser(verbose){
	// the parse tree
	this.tree = new Tree();

	//our index for iterating over tokens
	this.index = 0;

	this.tokens = {};
	this.errors = [];

	this.currentToken = null;
	this.warnings = [];
	this.verbose = verbose;
	this.charList = "";

	// init the symbol table
	this.symbolTable = [];
	this.scope = 0;
	this.symbolTable[this.scope] = []; // we start on scope 0

/******************
 public functions
******************/

// called to init the parse program
this.parseTokens = function(tokens, done){
	this.tokens = tokens;
	this.clearParser();

	// build our AST
	this.parseProgram();

	// check for errors
	if(!this.errors.length > 0){

		// lets check for warnings before we send everything back
		var i, j;
		for(i = 0 ; i < this.symbolTable.length ; i++){
			for(j=0; j< this.symbolTable[i].length ; j++){
				if(this.symbolTable[i][j].initalized == false){
					this.warnings.push("Warning: variable " 
						+ this.symbolTable[i][j].type + " "
						+ this.symbolTable[i][j].name
						+ " in scope " + i 
						+ " is declared but unitialized." )
				}if(this.symbolTable[i][j].initalized == false 
					&& this.symbolTable[i][j].used == true){
					this.warnings.push("Warning: variable "
						+ this.symbolTable[i][j].type + " "
						+ this.symbolTable[i][j].name
						+ " in scope " + i
						+ " is used but uninitalized. Variable will be initalized to null");
				}if(this.symbolTable[i][j].used == false){
						this.warnings.push("Warning: variable "
						+ this.symbolTable[i][j].type + " "
						+ this.symbolTable[i][j].name
						+ " in scope " + i
						+ " initalized but unused. Did you forget to use the variable?");
				}
			}
		}

		// we made it here therefore we can just return the completed tree
		done([], this.warnings, this.tree.toString(), this.symbolTable);
		
	}
	
	else{
		// process our errors
		done(this.errors, this.warnings, this.tree.toString(), null);

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
	this.warnings = [];

	// init the symbol table
	this.symbolTable = [];
	this.scope = 0;
	this.symbolTable[this.scope] = []; // we start on scope 0
}

/*************************
	starts the parsing sequence 
**************************/
this.parseProgram = function(){
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
			this.createNewScope();
			this.parseBlock();
			this.kick();
			this.scope--;
			
		}

		else{
			
		}
	
	}else{
		// preexisting error case, bubble out of recursion
	
	}

}

/*
	PrintStatement ::== print ( Expr )
*/
this.parsePrintStatement = function(){
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

				// check if what we have is declared in symbol table
				var i, j;
				var isDeclared = false;
				var prevToken = this.tokens[this.index - 1];
				
				if(prevToken.type == "t_char"){
					for(i = this.scope ; i >= 0 ; i--){
						for(j = 0; j < this.symbolTable[i].length ; j++){
							if(this.symbolTable[i][j].name == prevToken.tokenValue){
								isDeclared = true;
								this.symbolTable[i][j].used = true;
							}
						}
					}
				
					if(!isDeclared){
						this.errors.push("Error: attempting to use variable " + prevToken.tokenValue + " on line " + prevToken.linenumber + " before being declared");
					}
				}
				this.nextToken = this.getNext();
				if(this.nextToken.type == "t_closeParen"){
					// match )
					this.match(this.nextToken);
				}else{

				}
			}else{
					
			}
		}else{
			
		}
	}else{
		// preexisting error case, bubble out of recursion	
	}
}

/***************************************
	AssignmentStatement ::== Id = Expr 
****************************************/
this.parseAssignmentStatement = function(){
	if(this.errors.length == 0){
		this.tree.addNode("Assignment Statement", "branch");

		if(this.currentToken.type == "t_char"){
			// match ID
			var assignVar = this.currentToken;
			var i, j;
			var isDeclared = false;

			//start at the current scope and try to find the variable
			for(i = this.scope; i >= 0; i--){
				for(j = 0; j < this.symbolTable[i].length ; j++){
					if(this.symbolTable[i][j].name == assignVar.tokenValue){
						this.symbolTable[i][j].initalized = true;
						j = this.symbolTable[i].length;
						i = 0;
						isDeclared = true;

					}

				}

			}
			if(!isDeclared){
				this.errors.push("Warning: variable " 
					+ assignVar.tokenValue + " on line "
					+ assignVar.linenumber + " is assigned a value but undeclared.");
			
			}

			this.match(this.currentToken);

			this.currentToken = this.getNext();

			if(this.currentToken.type == "t_assignment"){
				// match =
				this.match(this.currentToken);
				this.parseExpr();

				// check to make sure we assigned it the correct type
				var found = false;
				for(i = this.scope; i >= 0; i--){
					for(j = 0; j < this.symbolTable[i].length ; j++){
						if(this.currentToken.type == "t_string"){
							if(this.symbolTable[i][j].name == assignVar.tokenValue){
								found = true; // stop at the first variable we find
								if(this.symbolTable[i][j].type != "string"){
									this.errors.push("Error: type mismatch."
										+ " Variable " + this.symbolTable[i][j].name
										+ " on line " + this.symbolTable[i][j].line
										+ " is of type " + this.symbolTable[i][j].type 
										+ " but is assigned a value of type string");
								}
							}	
						}
						else if(this.tokens[this.index-1].type == 't_digit'){
							if(this.symbolTable[i][j].name == assignVar.tokenValue){
								found = true;
								if(this.symbolTable[i][j].type != "int"){
									this.errors.push("Error: type mismatch."
										+ " Variable " + this.symbolTable[i][j].name
										+ " on line " + this.symbolTable[i][j].line 
										+ " is of type " + this.symbolTable[i][j].type 
										+ " but is assigned a value of type int");
								}
							}
						}
						else if(this.tokens[this.index-1].type == 't_boolval'){
							if(this.symbolTable[i][j].name == assignVar.tokenValue){
								found = true;
								if(this.symbolTable[i][j].type != "boolean"){
									this.errors.push("Error: type mismatch."
										+ " Variable " + this.symbolTable[i][j].name
										+ " on line " + this.symbolTable[i][j].line
										+ " is of type " + this.symbolTable[i][j].type 
										+ " but is assigned a value of type boolean");
								
								}
							}
						}
						if(found){
							// this case is just because i didnt use a while loop and i need to exit my loop
							j = this.symbolTable[i].length;
							i = 0;
						}
					}
				}	
			}else{
			
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

		// create new symbol table element
		stElement = new SymbolTableElement(null, 
			this.currentToken.tokenValue, 
			this.scope, 
			this.currentToken.linenumber);
		
		//match type
		this.match(this.currentToken);

		this.currentToken = this.getNext();

		if(this.currentToken.type == "t_char"){
			this.parseId();

			// add the new variable to the symbol table
			stElement.name = this.currentToken.tokenValue;
			this.symbolTable[this.scope].push(stElement);

		}else{
				
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

		// new scope
		this.createNewScope();
		this.parseBlock();

		// pop scope back
		this.kick();
		this.kickScope();	
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
		
		// new scope
		this.createNewScope();
		this.parseBlock();
		
		this.kick();
		this.kickScope();
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


			var oneLookAhead = this.tokens[this.index+1];
			
			// we look ahead one token to see if the next is a boolop
			// if it is we want to add it to the tree first
			if(oneLookAhead.type == "t_boolop"){
				if(oneLookAhead.tokenValue == "=="){
					this.tree.addNode("Equals", "branch");
				}else{
					this.tree.addNode("Not Equals", "branch");
				}
			}

			var lookAhead = this.tokens[this.index]; 
			// make sure we're not using an undeclared variable
			if(lookAhead.type == "t_char"){
				// check if what we have is declared in symbol table
				var i, j;
				var isDeclared = false;
				
				for(i = this.scope ; i >= 0 ; i--){
					for(j = 0; j < this.symbolTable[i].length ; j++){
						if(this.symbolTable[i][j].name == lookAhead.tokenValue){
							isDeclared = true;
						}
					}
				}
				if(!isDeclared){
					this.errors.push("Error: attempting to use variable " 
						+ lookAhead.tokenValue + " on line " 
						+ lookAhead.linenumber + " before being declared");
				}				
			}


			this.parseExpr();
			
			this.currentToken = this.getNext();

			if(this.currentToken.type == "t_boolop"){
				// match boolop  
				this.match(this.currentToken);


				var lookAhead = this.tokens[this.index]; 
				
				// make sure we're not using an undeclared variable
				if(lookAhead.type == "t_char"){
					// check if what we have is declared in symbol table
					var i, j;
					var isDeclared = false;
				
					for(i = this.scope ; i >= 0 ; i--){
						for(j = 0; j < this.symbolTable[i].length ; j++){
							if(this.symbolTable[i][j].name == lookAhead.tokenValue){
								isDeclared = true;
							}
						}
					}
					if(!isDeclared){
						this.errors.push("Error: attempting to use variable " 
							+ lookAhead.tokenValue + " on line " 
							+ lookAhead.linenumber + " before being declared");
					}				
				}



				this.parseExpr();
				
				// kick back up the boolop 
				this.kick();

				this.currentToken = this.getNext();

				if(this.currentToken.type == "t_closeParen"){
					// match )
					this.match(this.currentToken);
				}else{
					

				}
			
			}else{


			}

		}else{
			

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


this.createNewScope = function(){
	this.scope++;
	if(!this.symbolTable[this.scope])
		this.symbolTable[this.scope] = [];
}

this.kickScope = function(){
	this.scope--;
	//this.symbolTable[this.scope] = []
}

}
module.exports = ASTParser;