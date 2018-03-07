/***************************************************************
*	compiler.js
*		manages: lexer.js, parser.js, ast.js, codegen.js, 
*				 console, codeEditor, ajax-requests.js
*
***************************************************************/


var editor = false; // used to init codemirror for the first time

var tokens = {}; 
var programs = [];

$(document).ready(function(){
	try{
		// SET UP CODE MIRROR
		var code = $(".codemirror-textarea")[0];
		if(!editor){
			if(code){
				editor = CodeMirror.fromTextArea(code, {
					lineNumbers: true,
					theme: "neat",
					mode: "javascript"
				});
				loadEditor(1); // load the intro program (program 1)
			}
		}

		$('.CodeMirror-gutters').css('background', '#e9ebee');

		// EVENT HANDLERS 

		// compile onclick event handler
		function sendCompileRequest(){
			var i;
			var orderedPrograms = []; // this is getting annoying...
			for(i = 0 ; i < programs.length ; i++){
				// some interesting things happen when we wait for the ajax request.
				// the for loop will actually increment i before compile can give a 
				// response. therefore, we store the program number as a seperate
				// variable
				console.log("program: "+i, programs[i])
				if(programs[i]){
					//send request to compile (found in ajax-requests.js)
					compile("/compile", programs[i], i, function(programNum, compileResults){
						//orderedPrograms.splice(programNum, 0, compileResults);
						console.log(orderedPrograms);
						var errors = compileResults[0];
						var hints = compileResults[1];
						var verboseMessages = compileResults[2];
						var parseTree = compileResults[3];
						orderedPrograms.splice(programNum, compileResults);
						$('#consoleInfo').append("<br />");
						printParserToConsole(programNum +1, errors, hints, verboseMessages, parseTree);
						
					});
				}
				// this means we have a bad lex, so we do nothing it with
				else{
					$('#consoleInfo').append("<br />");
					printParserToConsole(i+1,null, null, ["Failed to Lex -- Ignoring Program " + (i+1)], null);

				}
			}

			// console.log("orderedPrograms", orderedPrograms);
			// for(i = 0; i < orderedPrograms.length ; i++){
			// 	console.log(orderedPrograms[i][0]);
			// 	console.log("i", i);
			// 	var errors = orderedPrograms[i][0];
			// 	var hints = orderedPrograms[i][1];
			// 	var verboseMessages = orderedPrograms[i][2];
			// 	var parseTree = orderedPrograms[i][3];
			// 	$('#consoleInfo').append("<br />");
			// 	printParserToConsole(i+1, errors, hints, verboseMessages, parseTree);


			// }

		}

		
		// register the compile request function up above
		// to nav-compile-button onclick event handler
		document.getElementById("navCompile").onclick = sendCompileRequest;

		// console-toggler-button onlick event handler
		$('#consoleToggle').on('click', function(){
			// check if the console drawer is open
			if(!$('.kitchen-sink-drawer').hasClass("active")){
				// if its not open lets go ahead and play the open animation
				// .stop clears the animation queue so there are no hangups
				$('.CodeMirror').stop().animate({height: '50%'}, {
					duration: 300,
					complete: function(){
						$('.kitchen-sink-drawer').show();
						$('.kitchen-sink-drawer').addClass("active");
						$('.kitchen-sink-drawer').stop().animate({width:'99%'}, {
							duration: 300
						});
					}
				});
			}
			// its not open and toggle was pressed, so lets close the console
			else {
				$('.kitchen-sink-drawer').stop().animate({width: "0%"}, {
					duration: 300,
					complete: function(){
						$('.kitchen-sink-drawer').hide();
						$('.kitchen-sink-drawer').removeClass("active");
						$('.CodeMirror').stop().animate({height:'87%'}, {
							duration: 300
						});				
					}
				});			
			}	
		});

		// editor on change event handler
		// CALLS LEXER
		editor.on('change', function(codeEditor){
			this.programs = []; // reset global programs

			var programs = codeEditor.getValue(); // local programs
			programs = programs.split('$');

			//reset the console
			$('#consoleInfo').html("");
			$('#consoleWarnings').html("");
			$('#consoleErrors').html("");
			
			var i;
			for(i = 0; i < programs.length ; i++){ // run each program
				if(programs[i]){
					// call to lexer.js generate tokens function
					generateTokens(programs[i], function(tokens, warnings, lexErrors){
						// lets store our current tokens
						this.tokens = tokens;
	
						// dont allow compile requests if we have errors
						if(lexErrors.length > 0){
							this.programs.push(false);
	
						}else{
							this.programs.push(this.tokens); // add to global programs
							console.log(this.programs);
						}

						// for pretty output, space it
						if(i != 0){
							$('#consoleInfo').append('<br />');

						}
						$('#consoleInfo').append('<h3 class="alert alert-info">Lexing program: '+(i+1)+'</h3>');
						
						// print output to the console
						printToConsole(i+1,tokens, warnings, errors);	
					});
				}
			}
		});
	}catch(err){
		console.log("COMPILER ERROR !!====================  ", err);
	}
}); //end document.ready


function printParserToConsole(programNumber, errors, hints, verboseMessages, parseTree){
	//print program counter
	$('#consoleInfo').append('<h3 class="alert alert-info">Parsing program: '+ programNumber + '</h3>');

	//print verbose messages
	var i;
	var output = "";
	for(i = 0; i < verboseMessages.length ; i++){
		$('#consoleInfo').append("<div class=\"alert alert-info\">"
			+ verboseMessages[i] +"</div>"); 	
	}

	$('#consoleInfo').append("<br />");

	//print errors and hints	
	if( errors && errors.length > 0){
		$('#consoleInfo').append("<div class=\"alert alert-danger\">"+errors[0]+"</div>");
		
		if(hints && hints.length > 0){
			$('#consoleInfo').append("<div class=\"alert alert-warning\">"+hints[0]+"</div>");
		
		}

		$('#consoleInfo').append('<div class="alert alert-warning"> Ommiting CST from program ' +programNumber + ' because Errors Found</div>');
		
	}

	// print tree
	else{
		// newlines wont show up in HTML
		// so we have to do a split on newlines
		var tree = parseTree.split("\n");

		// also, since the tree has html like tags
		// we have to be careful with how we add them to the DOM

		$('#consoleInfo').append('<h3 class="alert alert-info"> Printing CST for program ' + programNumber);
		for(i = 0; i < tree.length -1; i++){

			// we are using (i+programNumber*10000) to make sure we create a unique ID element on the DOM.
			// we have to do this to add elements to the console
			// this is because we're adding elements to the console that LOOK like html, because of how the tree is represented
			// so, in order to uniquely style these elements, we had to do this hacky approach... owch!
			$('#consoleInfo').append("<div class=\"alert alert-success\" id=\"parseTree" + (i+programNumber*10000) + "\"></div>");
			$('#parseTree' + (i+programNumber*10000)).text(tree[i]); 	
		}
		$('#consoleInfo').append('<h3 class="alert alert-success">Program ' + programNumber + ' Parsed Successfully');

	}

	$('#consoleContent')[0].scrollTop = $('#consoleContent')[0].scrollHeight;
}

//prints the output to the console
function printToConsole(programNumber, tokens, warnings, errors){
	
	// PRINT ALL TOKENS TO THE CONSOLE
	var i; // loop counter
	var output =""; // string we're building
	for(i = 0; i < tokens.length; i++){
		output += "<div class=\"alert alert-info\">LEXER: " + tokens[i] + "</div>";
	}

	$('#consoleInfo').append(output); 
	$('#consoleInfo').css('display', 'block');
	
	// PRINT OUR ERRORS
	if(errors.length !== 0){
		output = "";
		
		for(i = 0; i < errors.length; i++){
			output += "<div class=\"alert alert-danger\">" + errors[i] + "</div>";
		
		}

		$('#consoleInfo').append(output);
		$('#consoleInfo').append('<h4 class=\"alert alert-danger\">Program ' +programNumber+' Lexed With '+errors.length+' errors.</h4>')

	}else{
		$('#consoleInfo').append('<h4 class=\"alert alert-success\">Program ' +programNumber+' Lexed successfully.</h4>');
	
	}

	// PRINT OUR WARNINGS
	if(warnings.length !== 0){
		output = "";
		for(i = 0; i < warnings.length; i++){
			output +=  "<br /><div class=\"alert alert-warning\">" + warnings[i] + "</div>";
		}
		$('#consoleWarnings').append(output);
		$('#consoleWarnings').css('display', 'block');
	}else{
		// we're currently not doing anything with warnings
	}
	// make sure our div scrolls with the content being added
	$('#consoleContent')[0].scrollTop = $('#consoleContent')[0].scrollHeight;
}

// loads the editor with the program assoicated with programid
// clicking a sidebar program calls this
function loadEditor(programid){
	loadProgram(programid, function(program){
		editor.setValue(program);
	})
}
