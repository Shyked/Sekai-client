(function() {



	var Player = function() {

		this.world = null;
		this.entity = null;
		this.nickname = null;
		this.askedWorld = null;

		this.keys = {
			"Z": "UP",
			"Q": "LEFT",
			"S": "DOWN",
			"D": "RIGHT",
			"E": "ACTION1",
			"A": "ACTION2"
		};

	};




	Player.prototype.clear = function() {
		this.world = null;
		this.entity = null;
	};




	Player.prototype.keyDown = function(key) {
		if (this.world) {
			if (this.keys[key]) this.world.playerActionStart(this.keys[key], this);
			else this.world.keyDown(key, this);
		}
	};

	Player.prototype.keyUp = function(key) {
		if (this.world) {
			if (this.keys[key]) this.world.playerActionStop(this.keys[key], this);
			else this.world.keyUp(key, this);
		}
	};




	window.Player = Player;


})();
