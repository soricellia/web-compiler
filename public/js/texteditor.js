$(document).ready(function(){

	var code = $(".codemirror-textarea")[0];
	console.log(code);
	var editor = CodeMirror.fromTextArea(code, {
		lineNumbers: true
	});
});

function compile(){
	
}