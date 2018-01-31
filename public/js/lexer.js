/**********************************************************************
*						LEXER.JS
*	This program takes a string as input and generates a list of tokens
*	using the longest match principle. 
***********************************************************************/

// SETUP OUR REGULAR EXPRESSIONS WE NEED TO TOKENIZE STRINGS
var re_openBrace 	= /\}/;
var re_closeBrace   = /\{/;
var re_openParen    = /\)/;
var re_closeParen   = /\(/;
var re_char			= /[a-z]/
var re_newline  	= /\n/;
var re_comments 	= /(\/\*).*(\/\*)/g; // match all comments
var re_space    	= /\s/;

// TOKEN DEFINITION
function Token(type, value, linenumber){
	this.type 		= type;
	this.value 		= value;
	this.linenumber = linenumber;
}

Token.prototype.toString = function tokenToString(){
	return this.type + "(\"" + this.value + "\", " + this.linenumber + ")";
}
// OUR LIST OF TOKENS
var tokens = []; 

// OUR LIST OF ERROR CASES
var errors = [];

// OUR LIST OF WARNINGS
var warnings = [];

//KEEPING TRACK OF LINE NUMBERS
var lineNumber = 1; // start from line 1


/*******************************************************
*	Entry point into lexer. Generates an array of tokens
*	and returns them to the callback
********************************************************/
function generateTokens(input, callback){
	//reset the lexer
	lineNumber = 1;
	tokens = [];
	errors = [];

	// IGNORE ALL COMMENTS
	var input = input.replace(re_comments, "");
	
	var i = 0; // this will increment my input string
	var j = 0; // this will increment my tokens counter

	while(input){
		findNextLongestMatch(input, function(longestToken, inputSubstring){
			// if we found a matching longest Token
			if(longestToken){
				tokens[j] = longestToken; //take the longest match, and generate a token
				j++; //increment our tokens list
			}
			else{
				// possible error here
			}

			// increment input
			input = inputSubstring;	
		});	// end find longest match

	} // end while

	//return to the callback
	callback(tokens);
}

/****************************************************
*	Finds the longest matching token
*
*	Callback returns:
*		longestToken - the token with the longest length found (in order)
*		inputSubstring - the last place scanned by the lexer
*
****************************************************/
function findNextLongestMatch(input, callback){
	var tokenString = ""; // this will end up being our longest match
	var matchFound = false; // boolean value so we know when were done looping
	var nextChar = ""; // next character in input
	var longestToken;
	//while we havnt found a match, keep looking for one
	while(input && !matchFound){
		nextChar = input[0]; // get the next character
		
		// check if this character is a new line
		if(re_newline.test(nextChar)){
			lineNumber ++; // increment our line number
		}
		// check if this character is a space
		else if(re_space.test(nextChar)){
			// we ignore it
		}
		// lets try to find a longest match 
		else{
			
			tokenString = tokenString + nextChar;
			longestToken = convertToToken(tokenString, lineNumber) 
			matchFound = true;
		}

		input = input.substring(1, input.length);
	} // end while
	callback(longestToken, input);
}

function convertToToken(input, lineNumber){
	if(re_openBrace.test(input)){
		return new Token("t_openBrace", input, lineNumber);
	}
	else if(re_closeBrace.test(input)){
		return new Token("t_closeBrace", input, lineNumber);
	}
	else if(re_openParen.test(input)){
		return new Token("t_openParen", input, lineNumber);	
	}
	else if(re_closeParen.test(input)){
		return new Token("t_closeParen", input, lineNumber);
	}
	else if(re_char.test(input)){
		return new Token("t_char", input, lineNumber);
	}else{
		return new Token("ERROR", input, lineNumber);
	}
}


