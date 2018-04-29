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
		console.log(AST);
		var astRoot = AST.root;
		var depth = 0;

		traverseTree(astRoot, depth);

		function traverseTree(node, depth){
			// Space out based on the current depth so
			// this looks at least a little tree-like.
			for (var i = 0; i < depth; i++) {

			}

			// If there are no children (i.e., leaf nodes)...
			if (!node || !node.children || node.children.length === 0) {
				//console.log(node.name + " at depth " + depth);
				console.log("here");
			} 
			// See what's kind of node we are currently on and decides which function to call
			else {
				console.log(node.name + " at depth " + depth);
				
				if (node.name == "Block"){
					traverseBlock(node.children, depth);
				}
				else if (node.name == "Variable Declaration"){
					traverseVarDecl(node, depth);
				}
				else if (node.name == "Assignment Statement"){
					traverseAssign(node, depth);
				}
				else if (node.name == "Print"){
					traversePrint(node, depth);
				}
				else if (node.name == "If Statement"){
					traverseIf(node, depth);
				}
				else if (node.name == "While Statement"){
					traverseWhile(node, depth);
				}
				else if (node.name == "Add") {
					var lastMemLoc = traverseAdd(node, depth);
					//return lastMemLoc;
				}
				else if (node.name == "Not Equals"){
					traverseNotEquals(node, depth);
				}
				else if(node.name == "Equals"){
					traverseEquals(node, depth);
				}
				else {
					for (var i = 0; i < node.children.length; i++) {
			        	traverseTree(node.children[i], depth + 1);
			    	}
				}
			}	
		}		
	  	

        return done(["error"], "code");

        function traverseBlock(node, depth) {
        	// Continues the traversal
        	console.log("Generating Code For Block");
        	for (var i = 0; i < node.length; i++) {
                traverseTree(node[i], depth + 1);
            }
            //console.log("Program Finished codeTableLoc: " + codeTable.length);

            //return codeTable.length;
        }

        function traverseVarDecl(node, depth){
        	console.log("Generating Code For Var Decl");
        	for (var i = 0; i < node.length; i++) {
                traverseTree(node[i], depth + 1);
            }
        }

        function traverseAssign(node, depth){
        	console.log("Generating Code For Assignment");
        	for (var i = 0; i < node.length; i++) {
                traverseTree(node[i], depth + 1);
            }
        }
        function traversePrint(node, depth){
        	console.log("Generating Code For Print");
        	for (var i = 0; i < node.length; i++) {
                traverseTree(node[i], depth + 1);
            }
        }
        function traverseIf(node, depth){
        	console.log("Generating Code For If");
        	for (var i = 0; i < node.children.length; i++) {
                traverseTree(node.children[i], depth + 1);
            }
        }
        function traverseWhile(node, depth){
        	console.log("Generating Code For While");
        	for (var i = 0; i < node.children.length; i++) {
                traverseTree(node.children[i], depth + 1);
            }
        }
        function traverseAdd(node, depth){
        	console.log("Generating Code For Add");
        	for (var i = 0; i < node.length; i++) {
                traverseTree(node[i], depth + 1);
            }
        }
        function traverseEquals(node, depth){
        	console.log("Generating Code For Equals");
        	for (var i = 0; i < node.length; i++) {
                traverseTree(node[i], depth + 1);
            }	
        }
        function traverseNoTEquals(node, depth){
        	console.log("Generating Code For Not Equals");
        	for (var i = 0; i < node.length; i++) {
                traverseTree(node[i], depth + 1);
            }	
        }
    }



}

module.exports = CodeGenerator;