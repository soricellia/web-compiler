/****************************************************************
	code_generator.js
	Input: AST that represents the a++ language. 
		   Symbol Table

		Purpose:
			Translates the AST and symbol table into 6502 machine code
		
	output:
		return(errors, machine code)
***************************************************************/

// Op codes
var loadAccWithConst = "A9";
var loadAccFromMem = "AD";

var storeAccInMem = "8D";

var addWithCarry = "6D";

var loadXRegWithConst = "A2";
var loadXRegFromMem = "AE";

var loadYRegWithConst = "A0";
var loadYRegFromMem = "AC";

var noOp = "EA";

var compareMemToXReg = "EC";

var branchIfEqual = "D0";

var incrementByte = "EE";

var sysCall = "FF";

var nullTerminate = "00";

// memory pointers
var codeStartX = 0;
var codeStartY;

var staticVarStart;
var staticVarEnd;

var heapStart;
var heapEnd;

var currentMemLocX = 0;
var currentMemLocY = 0;

var staticsPointer = 0;
var jumpPointer = 0;

// our data structures for code generation
var memory = [];
var statics = [];
var branches = [];
var errors = [];
var scope = -1;
var symbolTable = [];


// object that goes in statics 
var static = function(temp, variable, address){
	this.temp = temp;
	this.variable = variable;
	this.address = address;
	this.addressx;
	this.addressy;
	this.value;
}


// object that goes in branches
var branch = function(temp, dist){
	this.temp = temp; 
	this.dist = dist;
}


function CodeGenerator(){

	// initalize the memory addresses to all 0's 
	var i, j;
	for(i = 0; i < 16 ; i++){
		memory[i] = [];
		for(j = 0 ; j < 16 ; j++){
			memory[i][j] = "00";
		}
	}

	// testing data structures
	statics[0] = new static("t0xx", "a", "2F00");
	branches[0] = new branch("J0", 7);
	
	console.log("memory: ", memory);
	console.log("statics: ", statics);
	console.log("branches", branches);

	/**********************
		public functions
	***********************/
	this.generateCode = function(AST, symTable, done){
		var astRoot = AST.root;
		var depth = 0;
		symbolTable = symTable;
		clearCodeGenerator();

		traverseTree(astRoot, depth);

		incrementMemY();
		staticVarStart = [currentMemLocX, currentMemLocY];

		//now we back patch
		backPatchInts();

		//we're finished, return our code
        return done(errors, memory);

		/************************
			Private functions
		************************/
		function traverseTree(node, depth){
			// Space out based on the current depth so
			// this looks at least a little tree-like.
			for (var i = 0; i < depth; i++) {

			}

			// If there are no children (i.e., leaf nodes)...
			if (!node || !node.children || node.children.length === 0) {
				//console.log(node.name + " at depth " + depth);
			} 
			// See what's kind of node we are currently on and decides which function to call
			else {
				console.log(node.name + " at depth " + depth);
				
				if (node.name == "Block"){
					scope++;
					traverseBlock(node.children, depth);
					scope--;
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
				
        function traverseBlock(node, depth) {
			// Continues the traversal

			console.log("Generating Code For Block");
			for (var i = 0; i < node.length; i++) {
                traverseTree(node[i], depth + 1);
			}
		}

        function traverseVarDecl(node, depth){
        	console.log("Generating Code For Var Decl");

        	// 3 cases to worry about, int, boolean or string

        			
        	if(node.children[0].name == "int"){
        			//load the acc with the int
        			memory[currentMemLocX][currentMemLocY] = loadAccWithConst;
        			incrementMemY();

        			// now get the variable from the symbol table and lets add it to the statics table
        			var symbolTableVariable = lookUpSymbolTableVariable(scope, node.children[1].name);
        			
        			var temp = "T" + staticsPointer;
        			var staticVar = new static(temp,  
        					symbolTableVariable ,
        					"");
        			
        			statics[staticsPointer] = staticVar;
        			staticsPointer++;
        			
        			// now default the value to 0 till we assign it something
        			memory[currentMemLocX][currentMemLocY] = nullTerminate;
       				incrementMemY();

       				// store accumulator in memory
       				memory[currentMemLocX][currentMemLocY] = storeAccInMem;
       				incrementMemY();

       				memory[currentMemLocX][currentMemLocY] = temp; 
       				incrementMemY();

       				memory[currentMemLocX][currentMemLocY] = "xx";
       				incrementMemY();

        	}
        	else if(node.children[i].name == "boolean"){

       		}
       		else{ // string case

       		}
        }

        function traverseAssign(node, depth){

        	console.log("Generating Code For Assignment");
        	
        	//lookup variable in statics and assign it a value
        	assignStaticsVariable(scope, node.children[0].name, node.children[1].name);
        	

        	//load accumulator with constant
        	memory[currentMemLocX][currentMemLocY] = loadAccWithConst;
        	incrementMemY();

        	// check whether to 0 pad or not
        	if(node.children[1].name.toString(16).length < 2){ 
        		memory[currentMemLocX][currentMemLocY] = "0" + node.children[1].name.toString(16);
        		
        	}else{
        		memory[currentMemLocX][currentMemLocY] = node.children[1].name.toString(16);
        		
        	}
        	incrementMemY();

        	//store accumlator in memory
        	var temp = lookUpStaticsVariable(scope, node.children[0].name).temp;
        	
        	memory[currentMemLocX][currentMemLocY] = storeAccInMem;
        	incrementMemY();

        	memory[currentMemLocX][currentMemLocY] = temp;
        	incrementMemY();

        	memory[currentMemLocX][currentMemLocY] = "xx";
        	incrementMemY();

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

        function traverseNotEquals(node, depth){
        	console.log("Generating Code For Not Equals");
        	for (var i = 0; i < node.length; i++) {
                traverseTree(node[i], depth + 1);
            }	
        }

        function incrementMemY(){
        	currentMemLocY ++;
        	if(currentMemLocY == 16){
        		currentMemLocY = 0;
        		incrementMemX();
        	}
        }

        function incrementMemX(){
        	currentMemLocX ++;
        	if(currentMemLocX == 16){
        		errors.add("Error, out of memory address. Program too large.");
        	}
        }

        function lookUpSymbolTableVariable(scope,variable){
        	var i,j, returnVal;
        	
        	// start at current scope and then move backwards
        	for(i = scope; i >= 0; i--){
        		for(j = 0; j < symbolTable[i].length; j++){
        			if(symbolTable[i][j].name == variable){
        				returnVal = symbolTable[i][j];
        			}
        		}
        	}

        	return returnVal;
        }

        function lookUpStaticsVariable(scope, variable){
        	// first find the variable in the symbol table
        	// for speed were going to do a little cheat and make the object into JSON
        	// this allows us to compare objects ;D
        	
        	var symbTableVar = JSON.stringify(lookUpSymbolTableVariable(scope, variable));

        	//now we look for the symbTableVar in statics and return it
        	var i;
        	for(i = 0; i < statics.length; i++){
        		// this is a nice little cheat to compare objects
        		if(JSON.stringify(statics[i].variable) == symbTableVar){
   					return statics[i];     			
        		}
        	}
        }

        function assignStaticsVariable(scope, variable, value){
        	// first find the variable in the symbol table
        	// for speed were going to do a little cheat and make the object into JSON
        	// this allows us to compare objects ;D
        	var symbTableVar = JSON.stringify(lookUpSymbolTableVariable(scope, variable));

        	//now we look for the symbTableVar in statics and return it
        	var i;
        	for(i = 0; i < statics.length; i++){
        		// this is a nice little cheat to compare objects
        		if(JSON.stringify(statics[i].variable) === symbTableVar){
   					statics[i].value = value;     			
        		}
        	}
        }

        function backPatchInts(){
        	var i, x, y;
        	var temp;
        	getIntAddresses();
        	for(i=0; i<statics.length;i++){
        		temp = statics[i].temp; //this is our temp number i.e. T0
        		for(x = 0; x < memory.length; x++){
        			for(y = 0; y < memory[x].length; y++){
        				if(memory[x][y] == temp){
        					// back patch
        					memory[x][y] = statics[i].address;

        					if(y == 16){
        						memory[x+1][0] = "00";
        					}else{
        						memory[x][y+1] = "00";
        					}
        				}
        			}
        		}
        	}
        }

        // goes through the statics table and assigns them all an address
        function getIntAddresses(){
        	var i;
        	for(i=0;i<statics.length; i++){
        		statics[i].address = currentMemLocX.toString(16).toUpperCase() + currentMemLocY.toString(16).toUpperCase();
    			incrementMemY();
        	}
        }
        function clearCodeGenerator(){
			// initalize the memory addresses to all 0's 
			var i, j;
			for(i = 0; i < 16 ; i++){
				memory[i] = [];
				for(j = 0 ; j < 16 ; j++){
					memory[i][j] = "00";
				}
			}
			currentMemLocX = 0;
			currentMemLocY = 0;
			scope = -1;
			staticsPointer = 0;
			jumpPointer = 0;
			statics = [];
			branches = [];
        }
	}
}

module.exports = CodeGenerator;