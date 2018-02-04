/**********************************************************************
*						LEXER.JS
*	This program takes a string as input and generates a list of tokens
*	using the longest match principle. 
***********************************************************************/

// SETUP OUR REGULAR EXPRESSIONS WE NEED TO TOKENIZE STRINGS
var re_closeBrace 	= /\}/;
var re_openBrace   = /\{/;
var re_closeParen    = /\)/;
var re_openParen   = /\(/;
var re_char			= /[a-z]/;
var re_didgit       = /\d/;
var re_assignment   = /\=/;
var re_intop		= /\+/
var re_string		= /\"/;
var re_newline  	= /\n/;
var re_space    	= /\s/;
var re_epoint		= /\!/;
var re_boolop		= /(\=\=)|(\!\=)/;
var re_boolval		= /(^false)|(^true)/;
var re_type			= /(^int)|(^string)|(^boolean)/;
var re_print        = /^print/;
var re_if			= /^if/;
var re_while		= /^while/;
var re_comments 	= /\/\*.*\*\//g; // match all comments

// TOKEN DEFINITION
function Token(type, value, linenumber){
	this.type 			= type;
	this.tokenValue 	= value;
	this.linenumber 	= linenumber;
}

Token.prototype.toString = function tokenToString(){
	return this.type + "(\"" + this.tokenValue + "\", " + this.linenumber + ")";
}
// OUR LIST OF TOKENS
var tokens = []; 

// OUR LIST OF ERROR CASES
var errors = [];

// OUR LIST OF WARNINGS
var warnings = [];

//KEEPING TRACK OF LINE NUMBERS
var lineNumber = 1; // start from line 1
var lastLine = lineNumber;
// boolean value to tell if we're inside a string quote
var inQuote = false; 

/*******************************************************
*	Entry point into lexer. Generates an array of tokens
*	and returns them to the callback
********************************************************/
function generateTokens(input, callback){
	//reset the lexer
	lineNumber = 1;
	tokens = [];
	errors = [];
	warnings = [];
	inQuote = false;
	lastLine = lineNumber;

	// IGNORE ALL COMMENTS, REPLACE WITH SPACE TO KEEP COLUM NUMBERS
	var input = input.replace(re_comments, " ");
	
	var i = 0; // this will increment my input string
	var j = 0; // this will increment my tokens counter

	while(input){
		findNextLongestMatch(input, function(longestToken, inputSubstring){
			// if we found a matching longest Token
			if(longestToken){
				if(longestToken.type != "ERROR"){
					tokens[j] = longestToken; //store it
					j++; //increment tokens list
				}
				// error token case
				else{
					errors.push(longestToken);
				}
			}
			else{
				// there is no longest match
				// this means the input is probably a space or newline
				// flag it as a warning
				//warnings.push("LEXER: warning, a token could not be made"
				// +"for input: "+ input);
			}

			// increment input
			input = inputSubstring;	
		});	// end find longest match

	} // end while

	//return to the callback
	callback(tokens, warnings, errors);
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
	var tokenString = ""; // this builds our longest token
	var matchFound = false; // boolean value so we know when were done looping
	var nextChar = ""; // next character in input
	var longestToken = null; // this is what we're trying to find
	
	//while we havnt found a match, keep looking for one
	while(input && !matchFound){
		nextChar = input[0]; // get the next character
		
		// check if this character is a new line
		if(re_newline.test(nextChar)){
			lineNumber ++; // increment our line number
			input = input.substring(1, input.length); //increment our input string
		}
		// check if this character is a space
		else if(re_space.test(nextChar)){
			// we ignore it
			input = input.substring(1, input.length); //increment our input string
		}
		//check if this character is a quote
		else if(re_string.test(nextChar)){
			// we have to take all input and just make them normal char tokens
			inQuote = !inQuote; // flip the switch

			// and we found a match, namely the quote "
			matchFound = true;
			longestToken = convertToToken(nextChar, lineNumber);

			//increment our input string
			input = input.substring(1, input.length);

		}
		// lets try to find a longest match 
		else if(!inQuote){
			charToken = convertToToken(nextChar, lineNumber);
			
			// if we dont have a str expr that means we found a single character token like "(){}"
			if(charToken.type != "str_expr"){
				// if we have some tokens ready to be processed we have to take them first
				if(tokenString){
					//convert first character into character token
					longestToken = new Token("t_char", tokenString[0], lineNumber);

					// we found a match (specificly, the match is a character [a-z])
					matchFound = true;

					input = tokenString + input;
				}
				// nothing else to process, this should be a clean token
				else{
					longestToken = charToken;
					matchFound = true;
				}
			}
			
			// character must be apart of a token, continue looking for a longest match
			else{

				//small optimization so we dont call converttoken when we dont have to
				if(tokenString.length == 0){
					tokenString = tokenString + nextChar;
					longestToken = charToken;
				}else{
					// we have to consume the tokenstring and come back to this
					if(nextChar == "="){
						//convert first character into character token
						longestToken = new Token("t_char", tokenString[0], lineNumber);

						// we found a match (specificly, the match is a character [a-z])
						matchFound = true;

						input = tokenString + input;
					}
					// we can just take this tokenString+char as longestToken
					else{
				
						tokenString = tokenString + nextChar;
						longestToken = convertToToken(tokenString, lineNumber);
					
						//matchFound = true;
					}
				}
				// if we get a str_expr that means we're not done
				// finding the longest match
				if(longestToken.type == "str_expr"){
					
					// assignment vs equality check
					if(tokenString == "=" || tokenString == "!"){
						//we need to do one look ahead to make sure we're not
						// just consuming an assignment
						var oneLookAhead = input[1]

						// make sure we didnt go too far, if we did we should probably throw and error
						if(oneLookAhead){
							// now we check if this is a boolop
							if(oneLookAhead == "="){
								// we make it into a token and consume the input string
								longestToken = convertToToken(tokenString+input[1], lineNumber);
								input = input.substring(1, input.length);
							}
							// it wasnt a boolop, so this must be an assignment
							else{
								if(tokenString == "!"){
									longestToken = new Token("ERROR", "!", lineNumber);
								}else if(tokenString == "="){
									longestToken = new Token("t_assignment", tokenString, lineNumber);	
								}	
							}

							// make sure to say we found a match
							matchFound = true;
						}
						// we couldnt look one character ahead
						// that means we're at the end of our input
						else{
							//testing
							console.log(input);
						}
					} // end assignment vs equality check
				}
				// error case
				else if(longestToken.type == "ERROR"){
					// add the error to our list of errors
					errors.push(longestToken);
				}
				// this means we found a token with a longest match. 
				// just flag it
				else{
					matchFound = true;
				}
			}
			//increment our input string
			input = input.substring(1, input.length);
		}
		// this means we're in a quote! lets just process the token as a character token and keep it moving
		else if(nextChar != "\""){
			//process token into character token
			longestToken = convertToToken(nextChar, lineNumber);

		/*	We want to retain the token type as per the grammer
			if(longestToken.type != "ERROR"){
				longestToken.type = "t_char";
			}
		*/
			//increment our input string
			input = input.substring(1, input.length);

			//and a match was found
			matchFound = true;	
		}

		//we're done looking for the longest match this iteration

		// if we're at the end and we didnt find a longest match
		// therefore we start again with the current tokenString
		if(!input && tokenString && !matchFound){
			//convert first character into character token
			longestToken = new Token("t_char", tokenString[0], lastLine);

			// we found a match (specificly, the match is a character [a-z])
			matchFound = true;

			lastLine++;

			//switch input to the tokenString so we can return that to the callback
			input = tokenString.substring(1, tokenString.length);
		}
	} // end while

	// return to the callback
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
	else if(re_didgit.test(input)){
		return new Token("t_didgit", input, lineNumber);
	}
	else if(re_intop.test(input)){
		return new Token("t_intop", input, lineNumber);
	}
	else if(re_string.test(input)){
		return new Token("t_string", input, lineNumber);
	}
	else if(re_boolop.test(input)){
		return new Token("t_boolop", input, lineNumber);
	}
	else if(re_boolval.test(input)){
		return new Token("t_boolval", input, lineNumber);
	}
	else if(re_type.test(input)){
		return new Token("t_type", input, lineNumber);
	}
	else if(re_print.test(input)){
		return new Token("t_print", input, lineNumber)
	}
	else if(re_if.exec(input)){
		return new Token("t_if", input, lineNumber);
	}
	else if(re_while.test(input)){
		return new Token("t_while", input, lineNumber);
	}

	// META TOKENS
	else if(re_char.test(input)){
		return new Token("str_expr", input, lineNumber);
	}
	else if(re_assignment.test(input)){
		return new Token("str_expr", input, lineNumber);
	}
	else if(re_epoint.test(input)){
		return new Token("str_expr", input, lineNumber);
	}

	// error case
	else{
		return new Token("ERROR", input, lineNumber);
	}
}


