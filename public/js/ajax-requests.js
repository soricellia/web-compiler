/***************************************************************
*	ajax-requests.js
*		manages: All ajax-requests to the back-end
*
***************************************************************/

// COMPILE REQUEST
function compile(theUrl, theData, callback){
	console.log("here");
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("POST", theUrl, true); // true for asynchronous 
    xmlHttp.send(theData);
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
