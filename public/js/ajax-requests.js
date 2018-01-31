var editor = false;

$(document).ready(function(){
	var code = $(".codemirror-textarea")[0];
	if(!editor){
		editor = CodeMirror.fromTextArea(code, {
			lineNumbers: true 
		});
	}
	function sendCompileRequest(){
		console.log(editor.getValue());
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

// sends ajax request for file requests 
function file(callback){
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", "/", true); // true for asynchronous 
    xmlHttp.send(null);
}
