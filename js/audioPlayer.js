(function() {



	var AudioPlayer = function() {

		this.sounds = {};

	};


	AudioPlayer.prototype.init = function(worldId) {
		this.sounds = {};

		var audioPlayer = this;
		ajax("getAudio", {
			"world": worldId
		}, function(filenames) {
			for (var id in filenames) {
				audioPlayer.sounds[filenames[id].replace(/\.[^/.]+$/, "")] = new Audio("./audio/worlds/" + worldId + "/" + filenames[id]);
			}
		});
	};




	AudioPlayer.prototype.play = function(sound) {
		var duplicate = new Audio(this.sounds[sound].src);
		duplicate.play();
	};




	window.AudioPlayer = new AudioPlayer();






	// Lib

	function ajax(action, params, callback) {
		var xmlhttp;
		if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
			xmlhttp = new XMLHttpRequest();
		}
		else { // code for IE6, IE5
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		xmlhttp.onreadystatechange=function() {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				callback(JSON.parse(xmlhttp.responseText));
			}
		}
		var sParams = "";
		for (var id in params) {
			sParams += "&" + id + "=" + params[id];
		}
		sParams = sParams.substr(1);
		xmlhttp.open("GET", "./query/" + action + ".php?" + sParams, true);
		xmlhttp.send();
	}


})();