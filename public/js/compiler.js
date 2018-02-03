/***************************************************************
*	compiler.js
*		manages: lexer.js, parser.js, ast.js, codegen.js, 
*				 console, codeEditor, ajax-requests.js
*
***************************************************************/


var editor = false; // used to init codemirror for the first time

//make sure we dont send programs with lex errors to compile
var errors = false; 


$(document).ready(function(){
	try{
	// SET UP CODE MIRROR
	
	// code editor
	var code = $(".codemirror-textarea")[0];
	if(!editor){
		if(code){
			editor = CodeMirror.fromTextArea(code, {
				lineNumbers: true,
				theme: "neat",
				mode: "javascript"
			});
		}
	}

	//we have to change the codemirror style via jquery
	$('.CodeMirror-gutters').css('background', '#e9ebee');

	// EVENT HANDLERS 

	// compile onclick event handler
	function sendCompileRequest(){
		// testing
		console.log(editor.getValue());
		
		//send request to compile (found in ajax-requests.js)
		compile("/compile", editor.getValue(), function(err){
			// do something after compiling, like display data
			// or give errors 
			if(err){
				console.log("ERROR!!!========\\n", err);
			}
		});
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

		// call to lexer.js generate tokens function
		generateTokens(codeEditor.getValue(), function(tokens, err){
			// generate tokens callback
			
			// error case, set a flag so we know we cant actually compile
			if(err){
				errors = true;
			}
			
			// PRINT TO THE CONSOLE
			var consoleContent = $('#consoleContent');
			var i; // loop counter
			var output =""; // string we're building
			for(i = 0; i < tokens.length; i++){
				output += "LEXER: " + tokens[i] + "<br />";
			}
			consoleContent.html(output); 

			// make sure our div scrolls with the content being added
			consoleContent[0].scrollTop = consoleContent[0].scrollHeight;

		})
	});

}catch(err){
	console.log("COMPILER ERROR!!=================\\n", err)
}
}); //end document.ready

function loadEditor(programid){
	loadProgram(programid, function(program){
		editor.setValue(program);
	})
}
