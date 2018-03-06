/***************************************************************
*	compiler.js
*		manages: lexer.js, parser.js, ast.js, codegen.js, 
*				 console, codeEditor, ajax-requests.js
*
***************************************************************/


var editor = false; // used to init codemirror for the first time

//make sure we dont send programs with lex errors to compile
var compileErrors = false; 

var tokens = {}; 

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
			if(!compileErrors){
				//send request to compile (found in ajax-requests.js)
				compile("/compile", tokens, function(compileResults){
					var errors = compileResults[0];
					var hints = compileResults[1];
					var verboseMessages = compileResults[2];
					var parseTree = compileResults[3];

					$('#consoleInfo').append("<br />");
					var programNumber = 1;
					printParserToConsole(programNumber, errors, hints, verboseMessages, parseTree);
				});
			}
			else{
				// we have compile errors, so lets print them for the user
				var i;
				var printErrors = ""; 
				for(i = 0; i < errors.length; i++){
					printErrors = '\n'
								  +printErrors
								  +errors[i].toString();
					
				}
				// display the errors in an alert box
				alert("You have errors that need to be fixed before you can compile:"
					  + '\n'
					  + printErrors);
			}
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
			
			compileErrors = false; // reset compile error flag

			var programs = codeEditor.getValue();
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
						// dont allow compile requests if we have errors
						if(lexErrors.length > 0){
							compileErrors = true;

						}

						// lets store our current tokens
						this.tokens = tokens;

						if(i != 0) $('#consoleInfo').append('<br />');
						
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

	//print errors and hints	
	if(errors){
		$('#consoleInfo').append('<br /> <div class="alert alert-warning"> Ommiting Parse Tree from program ' +programNumber + ' because Parse Errors Found</div>');
		$('#consoleInfo').append("<div class=\"alert alert-danger\">"+errors[0]+"</div>");
		$('#consoleInfo').append("<div class=\"alert alert-warning\">"+hints[0]+"</div>");
	}

	// print tree
	else{
		// newlines wont show up in HTML
		// so we have to do a split on newlines
		var tree = parseTree.split("\n");

		// also, since the tree has html like tags
		// we have to be careful with how we add them to the DOM

		$('#consoleInfo').append('<br /> <h3 class="alert alert-info"> Printing Parse Tree');
		for(i = 0; i < tree.length ; i++){
			$('#consoleInfo').append("<div class=\"alert alert-success\" id=\"parseTree" + i + "\"></div>");
			$('#parseTree' + i).text(tree[i]); 	
		}
		$('#consoleInfo').append('<br /> <h3 class="alert alert-success">Program ' + programNumber + ' Parsed Successfully');

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
		compileErrors = true; // cant compile
		
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
