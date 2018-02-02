$(document).ready(function(){
	consoleElem = $(".codemirror-textarea")[1];
	var verbose = true;
	if(verbose){
		console = CodeMirror.fromTextArea(consoleElem, 
		{
			lineNumbers: false,
			theme: "neat"
		});
	}

});