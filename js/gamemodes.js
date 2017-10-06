(function() {

	var Gamemodes = function() {
		this.clientGamemode = new ClientGamemode();
	};

	Gamemodes.prototype.get = function(mode) {
		return this.clientGamemode;
	};


	var ClientGamemode = function() {

		this.params = {};

	};





	ClientGamemode.prototype.playerActionStart = function(action, player) {
		switch (this.params.player.actions[action]) {
			case "move":
				this.moveEntity(action, player.entity, true);
				break;
			case "jump":
				this.jumpEntity(player.entity);
				break;
		}
	};

	ClientGamemode.prototype.playerActionStop = function(action, player) {
		switch (this.params.player.actions[action]) {
			case "move":
				this.moveEntity(action, player.entity, false);
				break;
		}
	};


	ClientGamemode.prototype.keyDown = function(key, player) {
		// body...
	};

	ClientGamemode.prototype.keyUp = function(key, player) {
		// body...
	};




	ClientGamemode.prototype.moveEntity = function(direction, entity, enable) {
		enable = Boolean(enable);
		direction = direction.toLowerCase();

		entity.move.direction[direction] = enable;

		var moving = false;
		for (var id in entity.move.direction) {
			if (entity.move.direction[id]) {
				moving = true;
				break;
			}
		}
		if (moving) {
			entity.move.speed = this.params.player.speed;
			entity.move.acc = this.params.player.acc;
		}
		else {
			entity.move.speed = 0;
			entity.move.acc = 0;
		}
	};

	ClientGamemode.prototype.jumpEntity = function(entity) {
		entity.jump = this.params.player.jumpPower;
	};



	window.Gamemodes = new Gamemodes();

})();
