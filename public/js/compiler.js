var editor = false;
var consoleViewer = false;
var consoleShowing = false;
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

	// console
	consoleElem = $(".codemirror-textarea")[1];
	if(!consoleViewer){
		consoleViewer = CodeMirror.fromTextArea(consoleElem, 
		{
			lineNumbers: false,
			theme: "blackboard"
		});
		$(consoleViewer.getWrapperElement()).hide();
	}

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

	// console onclick event handler
	function toggleConsole(){
		if(consoleShowing){
			$(consoleViewer.getWrapperElement()).hide();
			consoleShowing = false;
		} else{
			$(consoleViewer.getWrapperElement()).show();
			consoleShowing = true;
		}
	}
	document.getElementById("navConsole").onclick = toggleConsole;

	// editor on change event handler
	// CALLS LEXER
	editor.on('change', function(codeEditor){
		//consoleViewer.setValue(codeEditor.getValue());
		
		// call to my lexer to generate tokens
		generateTokens(codeEditor.getValue(), function(tokens){
			// tokens are returned here

			var i; // loop counter
			var html =""; // this is going to be displayed on the page
			for(i = 0; i < tokens.length; i++){
				html += "LEXER: " + tokens[i] + "\n";
			}
			consoleViewer.setValue(html);
		})
	});

}); //end document.ready

