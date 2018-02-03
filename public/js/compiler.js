var editor = false;
var editorExpanded = false;
var cycle = 1;
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

	//we have to change the style via jquery
	$('.CodeMirror-gutters').css('background', '#e9ebee');

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


	// console toggler
	$('#consoleToggle').on('click', function(){
		// check if the console drawer is open
		if(!$('.kitchen-sink-drawer').hasClass("active")){
			// if its not open lets go ahead and play the open animation
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
		//consoleViewer.setValue(codeEditor.getValue());
		
		// call to my lexer to generate tokens
		generateTokens(codeEditor.getValue(), function(tokens){
			// tokens are returned here

			var consoleContent = $('#consoleContent');
			var i; // loop counter
			var output =""; // this is going to be displayed on the page
			for(i = 0; i < tokens.length; i++){
				output += "LEXER: " + tokens[i] + "<br />";
			}
			consoleContent.html(output);
		})
	});

}); //end document.ready

