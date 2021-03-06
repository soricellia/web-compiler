/***************************************************************
*	ajax-requests.js
*		manages: All ajax-requests to the back-end
*
***************************************************************/

// COMPILE REQUEST
function compile(theUrl, theData, done){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            // send the parsed JSON array back to the callback
            done(JSON.parse(xmlHttp.responseText));
    }
    xmlHttp.open("POST", theUrl, true); // true for asynchronous 
    xmlHttp.send(JSON.stringify(theData));
}

// GET A NEW PROGRAM
function loadProgram(programid, callback){
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
		if(xmlHttp.readyState == 4 && xmlHttp.status == 200){
			callback(xmlHttp.responseText);
		}
	}
	xmlHttp.open("GET", "/programs/" + programid, true);
	xmlHttp.send();
}
