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

// we start the heap at the end of our program stack
var heapPointerX = 15;
var heapPointerY = 15;

var currentMemLocX = 0;
var currentMemLocY = 0;

var staticsPointer = 0;
var jumpPointer = 0;

// our data structures for code generation
var memory = [];
var statics = [];
var branches = [];
var errors = [];
var scope = -1; // scope will be 0 on first block {scope 0} scope-1
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
	//statics[0] = new static("t0xx", "a", "2F00");
	//branches[0] = new branch("J0", 7);
	
	//console.log("memory: ", memory);
	//console.log("statics: ", statics);
	//console.log("branches", branches);

	/**********************
		public functions
	***********************/
	this.generateCode = function(AST, symTable, done){
		var astRoot = AST.root;
		var depth = 0;
		symbolTable = symTable;
		clearCodeGenerator();

		traverseTree(astRoot, depth);

		// we're at the end of the code, so add a break
		memory[currentMemLocX][currentMemLocY] = "00";
		incrementMemY();

		// we increment our memory to mark the start of the static variables
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
				//console.log(node.name + " at depth " + depth);
				
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

			//console.log("Generating Code For Block");
			for (var i = 0; i < node.length; i++) {
                traverseTree(node[i], depth + 1);
			}
		}

        function traverseVarDecl(node, depth){
        	//console.log("Generating Code For Var Decl");

        	// 3 cases to worry about, int, boolean or string
        	if(node.children[0].name == "string"){
        		// put it into the statics table for referencing later
        		var stringInSymTable = lookUpSymbolTableVariable(scope, node.children[1].name);
        		var temp = "T" + staticsPointer;
				var staticVar = new static(temp,  
					stringInSymTable ,
					"");
				statics[staticsPointer] = staticVar;
				staticsPointer++;

        	}else{

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
        	
        }

        function traverseAssign(node, depth){

        	//console.log("Generating Code For Assignment");
        	
        	//lookup variable in statics and assign it a value
        	//assignStaticsVariable(scope, node.children[0].name, node.children[1].name);
        	
        	//lets figure out what were assigning
        	var assignVar = lookUpStaticsVariable(scope, node.children[0].name);
        	
        	// diffrentiating assigning variable a constant or another variable
        	if(isNumeric(node.children[1].name)){
        		//load accumulator with constant
        		memory[currentMemLocX][currentMemLocY] = loadAccWithConst;
				incrementMemY();
	
				//console.log("name ", node.children[1].name)
	        	// check whether to 0 pad or not
	        	if(node.children[1].name.toString(16).length < 2){ 
	        		memory[currentMemLocX][currentMemLocY] = "0" + node.children[1].name.toString(16);
	        		
	        	}else{
	        		memory[currentMemLocX][currentMemLocY] = node.children[1].name.toString(16);
	        		
	        	}
	        	incrementMemY();      		
        	}
        	else{
        		if(assignVar.variable.type == "string"){
        			// were dealing with assigning a string
        			
        			//write to the heap and keep track of start address to where we put it
        			var stringPointer = writeToHeap(node.children[1].name);

        			// now store the static pointer

        			//load acc with const (the string pointer address)
        			memory[currentMemLocX][currentMemLocY] = loadAccWithConst;
        			incrementMemY();

        			memory[currentMemLocX][currentMemLocY] = stringPointer;
        			incrementMemY();

        		}
        		else if(assignVar.variable.type == "boolean"){
        			//load accumulator with constant
        			memory[currentMemLocX][currentMemLocY] = loadAccWithConst;
					incrementMemY();
	
					//console.log(node.children[1].name)
	        		// check whether true or false
	        		if(node.children[1].name == "true"){ 
	        			memory[currentMemLocX][currentMemLocY] = "01";
	        		
	        		}else{
	        			memory[currentMemLocX][currentMemLocY] = "00";
	        			
	        		}
	        		incrementMemY();  
        		}
        		else if(node.children[1].name == "Add"){

        		}
        		else{
        			// were dealing with assigning a variable to another variable

	        		//load accumulator from memory
	        		memory[currentMemLocX][currentMemLocY] = loadAccFromMem;
					incrementMemY();

					//temp address
					//console.log(lookUpStaticsVariable(scope, node.children[1].name))
					//console.log(scope);
					//console.log(node.children[1].name)
					memory[currentMemLocX][currentMemLocY] = lookUpStaticsVariable(scope, node.children[1].name).temp;
					incrementMemY();

					memory[currentMemLocX][currentMemLocY] = "xx";
					incrementMemY();
				}       			
        	}

        	

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
        	//console.log("Generating Code For Print");

        	var printVal = lookUpStaticsVariable(scope, node.children[0].name);
        	
        	// load x reg with constant
        	memory[currentMemLocX][currentMemLocY] = loadXRegWithConst;
        	incrementMemY();

        	// $01 in x reg = print integer stored in the y reg
        	// $02 in x reg = print the 00-terminated string in y reg

        	//console.log("printVal: ", printVal);
        	if(printVal.variable.type == "string"){
        		memory[currentMemLocX][currentMemLocY] = "02" //loading x register with 01 tells the syscall to print
	        	incrementMemY();

        	}else{
        		memory[currentMemLocX][currentMemLocY] = "01" //loading x register with 01 tells the syscall to print
        		incrementMemY();
	
        	}
        	
        	// load the y reg from memory
        	memory[currentMemLocX][currentMemLocY] = loadYRegFromMem;
        	incrementMemY();

        	memory[currentMemLocX][currentMemLocY] = printVal.temp;
        	incrementMemY();

        	memory[currentMemLocX][currentMemLocY] = "xx";
        	incrementMemY();

        	//syscall
        	memory[currentMemLocX][currentMemLocY] = sysCall;
        	incrementMemY();

        }
        
        function traverseIf(node, depth){
        	//console.log("Generating Code For If");
        	for (var i = 0; i < node.children.length; i++) {
                traverseTree(node.children[i], depth + 1);
            }
        }

        function traverseWhile(node, depth){
        	//console.log("Generating Code For While");
        	for (var i = 0; i < node.children.length; i++) {
                traverseTree(node.children[i], depth + 1);
            }
        }

        function traverseAdd(node, depth){
        	//console.log("Generating Code For Add");
        	for (var i = 0; i < node.length; i++) {
                traverseTree(node[i], depth + 1);
            }
        }

        function traverseEquals(node, depth){
        	//console.log("Generating Code For Equals");
        	for (var i = 0; i < node.length; i++) {
                traverseTree(node[i], depth + 1);
            }	
        }

        function traverseNotEquals(node, depth){
        	//console.log("Generating Code For Not Equals");
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
        				return symbolTable[i][j];
        			}
        		}
        	}
        	//console.log("returnval: ", returnVal);
        	//return returnVal;
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

        					if(y == 15){
        						memory[x+1][0] = "00";
        					}else{
        						memory[x][y+1] = "00";
        					}
        				}
        			}
        		}
        	}
        }

        function writeToHeap(variable){
        	//we're going to start from the back of the heap and work our way up
        	
        	// first we null terminate
        	memory[heapPointerX][heapPointerY] = nullTerminate;
        	incrementHeapPointers();

        	var i, returnPointers;
        	for(i = variable.length-1 ; i != -1 ; i--){
        		// take the char and put it on the heap
        		if(i == 0){
        			// if were at the last character in the string store the pointers to it
        			returnPointers = [heapPointerX, heapPointerY];
        		}
        		memory[heapPointerX][heapPointerY] = variable.charCodeAt(i).toString(16).toUpperCase();
        		incrementHeapPointers();
        	}
        	// we have to return WHERE the thing is in memory, but were 1 cell ahead

        	// now we return the address in hex
        	return returnPointers[0].toString(16).toUpperCase() 
        			+ returnPointers[1].toString(16).toUpperCase();
        }

        // goes through the statics table and assigns them all an address
        function getIntAddresses(){
        	var i;
        	for(i=0;i<statics.length; i++){
        		statics[i].address = currentMemLocX.toString(16).toUpperCase() + currentMemLocY.toString(16).toUpperCase();
    			incrementMemY();
        	}
        }

        // helper function to determine if something is a number or not
        function isNumeric(n) {
 			 return !isNaN(parseFloat(n)) && isFinite(n);
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
			heapPointerX = 15;
			heapPointerY = 15;
        }
        function incrementHeapPointers(){
        	heapPointerY--;
        	if(heapPointerY == -1){
        		heapPointerY = 15
        		heapPointerX--;
        	}

        	//make sure we dont have a collision
        	if(heapPointerX == currentMemLocX && heapPointerY == currentMemLocY){
        		errors.push("Heap bled into program stack. This means the program is probably too large, or im a bad programmer.");
        	}
        }
	}
}

module.exports = CodeGenerator;