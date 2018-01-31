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
		
		//send request to compile
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
	editor.on('change', function(cMirror){
		consoleViewer.setValue(cMirror.getValue());
	});

}); //end document.ready

// send an ajex request to compile api
function compile(theUrl, theData, callback){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("POST", theUrl, true); // true for asynchronous 
    xmlHttp.send(theData);
}
