/****************************************************************
	code_generator.js
	Input: AST that represents the a++ language. 
		   Symbol Table

		
		Purpose:
			Translates the AST and symbol table into 6502 machine code
		
	output:
		return(errors, machine code)
***************************************************************/


// object that goes in statics 
var static = function(temp, variable, address){
	this.temp = temp;
	this.variable = variable;
	this.address = address;
}


// object that goes in branches
var branch = function(temp, dist){
	this.temp = temp; 
	this.dist = dist;
}


function CodeGenerator(){
	this.memory = [];
	this.statics = [];
	this.branches = [];
	// initalize the memory addresses to all 0's 
	var i, j;
	for(i = 0; i < 16 ; i++){
		this.memory[i] = [];
		for(j = 0 ; j < 16 ; j++){
			this.memory[i][j] = 0;
		}
	}

	// testing
	this.statics[0] = new static("t0xx", "a", "2F00");
	this.branches[0] = new branch("J0", 7);
	
	console.log("memory: ", this.memory);
	console.log("statics: ", this.statics);
	console.log("branches", this.branches);

	/**********************
		public functions
	***********************/
	this.generateCode = function(AST, symbolTable, done){
		return done(["error"], "code");
	}
}

module.exports = CodeGenerator;