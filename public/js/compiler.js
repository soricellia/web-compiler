var editor = false;
var consoleViewer = false;
var editorExpanded = false;
$(document).ready(function(){
	// SET UP CODE MIRROR
	
	// code editor
	var code = $(".codemirror-textarea")[0];
	if(!editor){
		editor = CodeMirror.fromTextArea(code, {
			lineNumbers: true,
			theme: "neat"
		});
	}

	consoleViewer = $(".consoleArea");

	// EVENT HANDLERS 

	// compile onclick event handler
	function sendCompileRequest(){
		// testing
		console.log(editor.getValue());
		
		//send request to compile (found in ajax-requests.js)
		compile("/compile", editor.getValue(), function(){
			// do something after compiling 
		});
	}

	document.getElementById("navCompile").onclick = sendCompileRequest;

	$('#consoleToggle').on('click', function(){
		if(editorExpanded){
			$('.CodeMirror').css('height','50%');
			editorExpanded = false;
		}else{
			$('.CodeMirror').css('height','88%');
			editorExpanded = true;
		}	
	})
	// editor on change event handler
	// CALLS LEXER
	editor.on('change', function(codeEditor){
		//consoleViewer.setValue(codeEditor.getValue());
		
		// call to my lexer to generate tokens
		generateTokens(codeEditor.getValue(), function(tokens){
			// tokens are returned here

			var i; // loop counter
			var output =""; // this is going to be displayed on the page
			for(i = 0; i < tokens.length; i++){
				output += "LEXER: " + tokens[i] + "<br />";
			}
			consoleViewer.html(output);
		})
	});

}); //end document.ready

