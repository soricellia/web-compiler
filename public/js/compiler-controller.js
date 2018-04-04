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

		/*********************************
			 EVENT HANDLERS 
		*********************************/

		/*********************************
			compile onclick event handler
		*********************************/
		function sendCompileRequest(){
			//send all programs to backend to be compiled 
			compile("/compile", programs, function(compileResults){
				//empty everything in the console except lex
				emptyParser();
				
				//compileResults is an object that needs to be converted into an array
				compileResults = Object.values(compileResults);
				var i;
				for(i = 0 ; i < compileResults.length ; i++){
					// print each result
					printParseToConsole(i+1, 
						compileResults[i]['parse']['errs'], 
						compileResults[i]['parse']['hints'], 
						compileResults[i]['parse']['verbose'], 
						compileResults[i]['parse']['tree']);
				}
			});
		}
		document.getElementById("navCompile").onclick = sendCompileRequest;

		
		/*********************************
			console onlick event handler
		*********************************/
		$('#consoleToggle').on('click', function(){
			// check if the console drawer is open
			if(!$('.kitchen-sink-drawer').hasClass("active")){
				// if its not open lets go ahead and play the open animation
				// .stop clears the animation queue so there are no hangups
				$('.CodeMirror').stop().animate({height: '30%'}, {
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

		/*********************************
		 	editor on change event handler
		 *********************************/
		editor.on('change', function(codeEditor){
			this.programs = []; // reset global programs

			var programs = codeEditor.getValue(); // local programs
			programs = programs.split('$'); // our metatoken to denote EOP

			//reset the console
			emptyLexer();

			var i;
			for(i = 0; i < programs.length ; i++){ // run each program
				if(programs[i]){
					/***********************************************
						LEXER call on each program 
						seperated by '$' meta token
					************************************************/
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
							$('#lex').append('<br />');

						}
						$('#lex').append('<h3 class="alert alert-info">Lexing program: '+(i+1)+'</h3>');
						
						// print output to the console
						PrintLexToConsole(i+1,tokens, warnings, errors);	
					});
				}
			}
		});
	}catch(err){
		console.log("COMPILER ERROR !!====================  ", err);
	}
}); //end document.ready


/********************************
	prints parse information to console
**********************************/
function printParseToConsole(programNumber, errors, hints, verboseMessages, parseTree){
	//print program counter
	$('#parse').append('<h3 class="alert alert-info">Parsing program: '+ programNumber + '</h3>');

	//print verbose messages
	var i;
	var output = "";
	if(verboseMessages){
		for(i = 0; i < verboseMessages.length ; i++){
			$('#parse').append("<div class=\"alert alert-info\">"
				+ verboseMessages[i] +"</div>"); 	
		}
	}

	$('#parse').append("<br />");

	//print errors and hints	
	if( errors && errors.length > 0){
		$('#parse').append("<div class=\"alert alert-danger\">"+errors[0]+"</div>");
		
		if(hints && hints.length > 0){
			$('#parse').append("<div class=\"alert alert-warning\">"+hints[0]+"</div>");
		
		}

		$('#parse').append('<div class="alert alert-warning"> Ommiting CST from program ' +programNumber + ' because Errors Found</div>');
		
	}
	// print tree
	else{
		// newlines wont show up in HTML
		// so we have to do a split on newlines
		var tree = parseTree.split("\n");

		// also, since the tree has html like tags
		// we have to be careful with how we add them to the DOM

		$('#parse').append('<h3 class="alert alert-info"> Printing CST for program ' + programNumber);
		for(i = 0; i < tree.length -1; i++){

			// we are using (i+programNumber*10000) to make sure we create a unique ID element on the DOM.
			// we have to do this to add elements to the console
			// this is because we're adding elements to the console that LOOK like html, because of how the tree is represented
			// so, in order to uniquely style these elements, we had to do this hacky approach... owch!
			$('#parse').append("<div class=\"alert alert-success\" id=\"parseTree" + (i+programNumber*10000) + "\"></div>");
			$('#parseTree' + (i+programNumber*10000)).text(tree[i]); 	
		}
		$('#parse').append('<h3 class="alert alert-success">Program ' + programNumber + ' Parsed Successfully');

	}

	$('#consoleContent')[0].scrollTop = $('#consoleContent')[0].scrollHeight;

	document.getElementsByClassName('consoleTab')[1].click();
}


/**********************************
	prints lex to the console
**********************************/
function PrintLexToConsole(programNumber, tokens, warnings, errors){
	//$('#lex').append('<h3 class="alert alert-info">Lexing program: '+ programNumber + '</h3>');
	// PRINT ALL TOKENS TO THE CONSOLE
	var i; // loop counter
	var output =""; // string we're building
	for(i = 0; i < tokens.length; i++){
		output += "<div class=\"alert alert-info\">LEXER: " + tokens[i] + "</div>";
	}

	$('#lex').append(output); 
	$('#lex').css('display', 'block');
	
	// PRINT OUR ERRORS
	if(errors.length !== 0){
		output = "";
		
		for(i = 0; i < errors.length; i++){
			output += "<div class=\"alert alert-danger\">" + errors[i] + "</div>";
		
		}

		$('#lex').append(output);
		$('#lex').append('<h4 class=\"alert alert-danger\">Program ' +programNumber+' Lexed With '+errors.length+' errors.</h4>')

	}else{
		$('#lex').append('<h4 class=\"alert alert-success\">Program ' +programNumber+' Lexed successfully.</h4>');
	
	}

	// PRINT OUR WARNINGS
	if(warnings.length !== 0){
		output = "";
		for(i = 0; i < warnings.length; i++){
			output +=  "<br /><div class=\"alert alert-warning\">" + warnings[i] + "</div>";
		}
		$('#lex').append(output);
		$('#lex').css('display', 'block');
	}else{
		// we're currently not doing anything with warnings
	}
	
	//simulate a click so the tab switches properly
	document.getElementsByClassName('consoleTab')[0].click();

	// make sure our div scrolls with the content being added
	$('#consoleContent')[0].scrollTop = $('#consoleContent')[0].scrollHeight;

}

/*********************************
	empty the lexer
	erases everything in 'lex' tab
*********************************/
function emptyLexer(){
	$('#lex').empty();
}

/*********************************
	empty the parser
	erases everything in 'parse' tab
*********************************/
function emptyParser(){
	$('#parse').empty();
}

// loads the editor with the program assoicated with programid
// clicking a sidebar program calls this
function loadEditor(programid){
	loadProgram(programid, function(program){
		editor.setValue(program);
	})
}

// switches the console tab to the tab that was clicked
function switchTab(evt, tabId){
	var i, tablinks;
	
	//set everything to not visible
	document.getElementById('parse').style.display = "none";
	document.getElementById('ast').style.display = "none";
	document.getElementById('lex').style.display = "none";
	
	//get all the tabs and make sure none of them are selected
	tablinks = document.getElementsByClassName("consoleTab");
	for(i = 0; i < tablinks.length; i++){
		tablinks[i].className = tablinks[i].className.replace(" selected", "");
	}
	
	//set the tab we're on to selected and display the tab's information
	document.getElementById(tabId).style.display = "block";
	evt.currentTarget.className += " selected";
	evt.currentTarget.blur();

	// make sure our div scrolls with the content being added
	$('#consoleContent')[0].scrollTop = $('#consoleContent')[0].scrollHeight;
}
