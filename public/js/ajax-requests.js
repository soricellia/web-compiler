var editor = false;

$(document).ready(function(){
	var code = $(".codemirror-textarea")[0];
	if(!editor){
		editor = CodeMirror.fromTextArea(code, {
			lineNumbers: true,
			theme: "blackboard"
		});
	}

	// EVENT HANDLERS 

	// compile onclick even handler
	function sendCompileRequest(){
		// testing
		console.log(editor.getValue());
		
		//send request to compile
		compile("/compile", editor.getValue(), function(){
			// do something after compiling 
		});
	}

	document.getElementById("compile").onclick = sendCompileRequest;

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

