(function() {

	var Worlds = window.Worlds;

	var LAG = 0;
	var RAND_LAG = 0;

	/**
	 * Synchronizer
	 * Used for the communication between the Client and the Server
	 */
	var Synchronizer = function(view) {
		this.view = view;
		Synchronizer = this;

		this.socket = io.connect(NODE_URL);

		this.playerId = null;
		this.nickname = null;

		this.playerParams = {
			"jumpPower": 0
		}

		var that = this;
		this.socket.on('askNickname',function(content){setTimeout(function(){ that.askNickname(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('defineWorld',function(content){setTimeout(function(){ that.defineWorld(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('world',function(content){setTimeout(function(){ that.updateWorld(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('join',function(content){setTimeout(function(){ that.playerJoin(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('leave',function(content){setTimeout(function(){ that.playerLeave(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('entity',function(content){setTimeout(function(){ that.entity(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('removeEntity',function(content){setTimeout(function(){ that.removeEntity(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('definePlayer',function(content){setTimeout(function(){ that.definePlayer(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('error',function(content){setTimeout(function(){ that.error(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('chatboxMessage',function(content){setTimeout(function(){ that.chatboxMessage(content) },Math.random()*RAND_LAG+LAG)});


		// User inputs
	    view.addEventListener('mouseleftdown', function(view, e) {
			var x = (e.offsetX != undefined) ? e.offsetX : e.layerX - e.target.offsetLeft;
			var y = (e.offsetY != undefined) ? e.offsetY : e.layerY - e.target.offsetTop;
	    	var pos = view.screenToWorldCoords({x: x, y: y})
	    	Synchronizer.mouseDown(pos.x, pos.y);
	    });

	    view.addEventListener('mousemiddledown', function(view, e) {
	    	Synchronizer.restartWorld();
	    });

	    view.addEventListener('keydown', function(view, key) {
	    	Synchronizer.keyDown(key);
	    });
	    view.addEventListener('keyup', function(view, key) {
	    	Synchronizer.keyUp(key);
	    });


	    // Intervals
	    this.sendPlayerInterval = setInterval(function(){that.sendPlayer();}, 1000);

	};

	Synchronizer.prototype.askNickname = function(content) {
		if (this.nickname === null) {
			document.getElementById('blackContainer').style.display = "block";
			document.getElementById('nicknameInput').focus();
			var synchronizer = this;
			document.getElementById('nicknameForm').onsubmit = function() {
				if (this.nickname.value != "") {
					synchronizer.nickname = this.nickname.value;
					synchronizer.socket.emit('nickname', JSON.stringify(this.nickname.value));
				}
				return false;
			}
		}
		else {
			this.socket.emit('nickname', JSON.stringify(this.nickname));
		}
	};

	Synchronizer.prototype.playerJoin = function(content) {
		var player = JSON.parse(content);
		this.view.newPlayer(player);
	};

	Synchronizer.prototype.playerLeave = function(content) {
		var player = JSON.parse(content);
		this.view.clearPlayer(player.id);
	};

	Synchronizer.prototype.defineWorld = function(content) {
		if (document.getElementById('blackContainer').style.display != "none") {
			document.getElementById('blackContainer').style.display = "none";
		}

		this.view.stopRender();
		if (this.world) Worlds.delete(this.world.id);

		var worldJSON = JSON.parse(content); console.log(worldJSON);
		this.view.players = worldJSON.players;
		worldJSON = worldJSON.world;
		var world = Worlds.new(worldJSON.id);
		world.update(worldJSON);

		this.world = world;

		this.view.attachWorld(world);
		this.view.startRender();

		this.socket.emit('request', JSON.stringify("definePlayer"));
	};

	/**
	 * updateWorld()
	 * When the server send an entire world to the Client
	 *
	 * @param content The JSON String containing the world
	 */
	Synchronizer.prototype.updateWorld = function(content) {

		var worldJSON = JSON.parse(content);
		var world = Worlds.get(worldJSON.id);
		if (world) {
			if (worldJSON.entities[this.playerId]) delete worldJSON.entities[this.playerId];
			world.update(worldJSON);
		}
	};

	Synchronizer.prototype.definePlayer = function(content) {
		var playerParams = JSON.parse(content);
		this.world.updateEntities([playerParams.entity]);
		this.view.setFocus(playerParams.entity.id);
		this.playerId = playerParams.entity.id;
		this.playerParams.jumpPower = playerParams.jumpPower;
		this.playerParams.speed = playerParams.speed;
		//this.world.softUpdates[playerParams.entityId] = true;
	};

	/**
	 * entity()
	 * Creates a new entity send by the sever
	 *
	 * @param content The JSON String containing the entity
	 */
	Synchronizer.prototype.entity = function(content) {
		var entity = JSON.parse(content)
		if (entity.id != this.playerId)	this.world.updateEntities([entity]);
	};

	Synchronizer.prototype.removeEntity = function(content) {
		this.world.removeEntity(JSON.parse(content));
	};

	Synchronizer.prototype.error = function(content) {
		console.log("Error from the server : " + JSON.parse(content));
	};



	Synchronizer.prototype.mouseDown = function(x, y) {
		this.socket.emit('mousedown', JSON.stringify({x: x, y: y}));
	};

	Synchronizer.prototype.keyDown = function(key) {
		if (this.playerId) {
			if (key == "R") this.socket.emit('restartWorld', "");
			else if ((key == "ENTER" || key == "/") && document.getElementById('chatboxInput')) {
				var text = document.getElementById('chatboxInput').enter();
				if (text) {
					this.socket.emit('chatboxMessage', JSON.stringify(text));
				}
			}
			else {
				this.socket.emit('keydown', JSON.stringify({
					"key": key,
					"entity": this.world.entities[this.playerId].export()
				}));
			}
			if (key == "Z" || key == "UP") this.jump();
			else if (key == "Q" || key == "LEFT") this.roll("left");
			else if (key == "D" || key == "RIGHT") this.roll("right");
		}
	};
	Synchronizer.prototype.keyUp = function(key) {
		if (this.playerId) {
			if (this.world.entities[this.playerId]) {
				this.socket.emit('keyup', JSON.stringify({
					"key": key,
					"entity": this.world.entities[this.playerId].export()
				}));
				if (key == "Q" || key == "LEFT") this.stopRoll("left");
				else if (key == "D" || key == "RIGHT") this.stopRoll("right");
			}
		}
	};

	Synchronizer.prototype.restartWorld = function() {
		this.socket.emit('restartWorld', "");
	};

	Synchronizer.prototype.sendPlayer = function() {
		if (this.world) {
			var player = this.world.entities[this.playerId];
			if (player) {
				this.socket.emit('player', JSON.stringify({
					"worldId": this.world.id,
					"player": player.export()
				}));
			}
		}
	};

	Synchronizer.prototype.chatboxMessage = function(content) {
		var messageObject = JSON.parse(content);
		if (document.getElementById('chatboxMessages')) {
			document.getElementById('chatboxMessages').addMessage(
				messageObject.msg,
				messageObject.nickname,
				messageObject.color,
				messageObject.type
			);
		}
	};





	Synchronizer.prototype.jump = function() {
		if (this.playerId) {

			var entity = this.world.entities[this.playerId];
			var vel;

			if (this.world.type == "circular") {
				var angleDistPos = toAngleDist({
					x: entity.physicsBody.state.pos.x,
					y: entity.physicsBody.state.pos.y
				});
				vel = rotatePoint(
					entity.physicsBody.state.vel.x, entity.physicsBody.state.vel.y,
					- (angleDistPos.angle + Math.PI/2),
					0, 0
				);
				if (vel.y > -this.playerParams.jumpPower) vel.y = -this.playerParams.jumpPower;
				vel = rotatePoint(
					vel.x, vel.y,
					(angleDistPos.angle + Math.PI/2),
					0, 0
				);
			}
			else if (this.world.type == "flat") {
				vel = {
					x: entity.physicsBody.state.vel.x,
					y: entity.physicsBody.state.vel.y
				};
				if (vel.y > -this.playerParams.jumpPower) vel.y = -this.playerParams.jumpPower;
			}
			entity.physicsBody.state.vel.x = vel.x;
			entity.physicsBody.state.vel.y = vel.y;

			entity.physicsBody.sleep(false);
		}
	};

	Synchronizer.prototype.roll = function(side) {
		if (this.playerId) {
			var entity = this.world.entities[this.playerId];

			if (side == "left") side = -1;
			else if (side == "right") side = 1;
			entity.physicsBody.sleep(false);

			entity.move = {
				side: side,
				speed: this.playerParams.speed
			};
		}
	};

	Synchronizer.prototype.stopRoll = function(side) {
		var entity = this.world.entities[this.playerId];

		if (side == "left") side = -1;
		else if (side == "right") side = 1;
		if (entity.move) {
			if (entity.move.side == side) {
				entity.move = null;
			}
		}
	};



	window.Synchronizer = Synchronizer;




	// Lib

	function toAngleDist(pos) {
		if (pos.x != 0 || pos.y != 0) {
			var dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
			var angle = Math.acos(pos.x / dist);
			if (pos.y < 0) angle = -angle;
			return {
				angle: angle,
				dist: dist
			};
		}
		else {
			return {
				angle: 0,
				dist: 0
			};
		}
	}

	function rotatePoint(x, y, angle, centerX, centerY) { // http://stackoverflow.com/questions/11332188/javascript-rotation-translation-function
		x -= centerX;
		y -= centerY;
		var point = {};
		point.x = x * Math.cos(angle) - y * Math.sin(angle);
		point.y = x * Math.sin(angle) + y * Math.cos(angle);
		point.x += centerX;
		point.y += centerY;
		return point;
	}


})();