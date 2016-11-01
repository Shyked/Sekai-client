(function() {

	var Worlds = window.Worlds;
	var Chatbox = window.Chatbox;
	var Player = window.Player;
	var AudioPlayer = window.AudioPlayer;
	var FileLoader = window.FileLoader;
	var Interface = window.Interface;

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

		this.player = new Player();


		var that = this;
		this.socket.on('askNickname',function(content){setTimeout(function(){ that.askNickname(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('askSignUp',function(content){setTimeout(function(){ that.askSignUp(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('askLogIn',function(content){setTimeout(function(){ that.askLogIn(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('askBack',function(content){setTimeout(function(){ that.askBack(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('token',function(content){setTimeout(function(){ that.token(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('defineWorld',function(content){setTimeout(function(){ that.defineWorld(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('world',function(content){setTimeout(function(){ that.updateWorld(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('join',function(content){setTimeout(function(){ that.playerJoin(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('leave',function(content){setTimeout(function(){ that.playerLeave(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('entity',function(content){setTimeout(function(){ that.entity(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('removeEntity',function(content){setTimeout(function(){ that.removeEntity(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('definePlayer',function(content){setTimeout(function(){ that.definePlayer(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('error',function(content){setTimeout(function(){ that.error(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('debug',function(content){setTimeout(function(){ that.debug(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('chatboxMessage',function(content){setTimeout(function(){ that.chatboxMessage(content) },Math.random()*RAND_LAG+LAG)});
		this.socket.on('audio',function(content){setTimeout(function(){ that.audio(content) },Math.random()*RAND_LAG+LAG)});


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
	    view.addEventListener('touchstart', function(view, e) {
	    	Synchronizer.touchStart(e);
	    });


	    Chatbox.addEventListener('send', function(chatbox, text) {
	    	Synchronizer.sendChatboxMessage(text);
	    });


	    this.sendParams();



	    // Intervals
	    this.sendPlayerInterval = setInterval(function(){that.sendPlayer();}, 1000);

	};

	Synchronizer.prototype.sendParams = function() {
		var get = getURLParams();

		if (get["lang"]) {
			if (get["lang"] == "en") {
				this.player.keys = {
					"W": "UP",
					"A": "LEFT",
					"S": "DOWN",
					"D": "RIGHT",
					"E": "ACTION1",
					"Q": "ACTION2"
				};
				this.socket.emit('changeKeys', this.player.keys);
			}
		}

		if (get["n"]) {
			this.player.nickname = get["n"];
		}

		if (get["world"]) {
			this.player.askedWorld = get["world"];
		}
	};

	Synchronizer.prototype.askNickname = function(content) {
		var token = window.localStorage.token;
		if (this.player.world) {
			// Direct log
		}
		else {
			if (token && content.error != "UNKNOWN_TOKEN") {
				this.socket.emit('token', {
					"token": token,
					"askedWorld": this.player.askedWorld
				});
			}
			else if (this.player.nickname === null || content.error) {
				this.displayNicknameInterface();
				Interface.modify('nickname', { 'state': 'nickname' });
			}
		}
	};

	Synchronizer.prototype.displayNicknameInterface = function() {
		var synchronizer = this;
		Interface.display("nickname", {
			onnickname: function(form) {
				if (form.nickname && !/^[\w \-']+$/.test(form.nickname.value)) {
					form.nickname.setAttribute('data-invalid', 'true');
					form.nickname.value = form.nickname.value.replace(/[^\w \-']/g, '');
					form.nickname.focus();
				}
				else {
					form.nickname.setAttribute('data-invalid', 'false');
					synchronizer.player.nickname = form.nickname.value;
					synchronizer.socket.emit('nickname', {
						"nickname": form.nickname.value
					});
				}
			},
			onsignup: function(form) {
				if (form.nickname) {
					form.nickname.setAttribute('data-invalid', 'false');
					form.nickname.setAttribute('data-already-taken', 'false');
				}
				form.email.setAttribute('data-invalid', 'false');
				form.password.setAttribute('data-invalid', 'false');
				if (form.nickname && !/^[\w \-']+$/.test(form.nickname.value)) {
					form.nickname.setAttribute('data-invalid', 'true');
					form.nickname.value = form.nickname.value.replace(/[^\w \-']/g, '');
					form.nickname.focus();
				}
				else if (!/^.+@.+$/.test(form.email.value)) {
					form.email.setAttribute('data-invalid', 'true');
					form.email.focus();
				}
				else if (form.password.value.length < 6) {
					form.password.setAttribute('data-invalid', 'true');
					form.password.focus();
				}
				else {
					synchronizer.socket.emit('signup', {
						"token": window.localStorage.token,
						"nickname": form.nickname ? form.nickname.value : document.getElementById('nicknameInput').value,
						"email": form.email.value,
						"hashed_password": sha1("V3ry54l7y" + form.password.value),
						"askedWorld": synchronizer.player.askedWorld
					});
				}
			},
			onlogin: function(form) {
				hashedString = sha1(synchronizer.socket.id + toReguserName(synchronizer.player.nickname) + sha1("V3ry54l7y" + form.password.value));
				synchronizer.socket.emit('login', {
					"token": window.localStorage.token,
					"nickname": synchronizer.player.nickname,
					"hashedString": hashedString,
					"askedWorld": synchronizer.player.askedWorld
				});
			},
			onstart: function(form) {
				synchronizer.socket.emit('start', {
					"token": window.localStorage.token,
					"askedWorld": synchronizer.player.askedWorld
				});
			}
		});
	};

	Synchronizer.prototype.askSignUp = function(content) {
		var error = content.error;
		if (error) {
			if (error == "ALREADY_EXISTS") {
				Interface.modify('nickname', {
					'state': 'back',
					'trigger': error
				});
			}
		}
		else Interface.modify('nickname', { 'state': 'signup' });
	};

	Synchronizer.prototype.askLogIn = function(content) {
		Interface.modify('nickname', { 'state': 'login' });
	};

	Synchronizer.prototype.askBack = function(content) {
		this.displayNicknameInterface();
		var connected = content.connected;
		var nickname = content.nickname;
		this.player.nickname = nickname;
		if (connected) {
			Interface.modify('nickname', {
				'state': 'backConnected',
				'nickname': nickname
			});
		}
		else {
			Interface.modify('nickname', {
				'state': 'back',
				'nickname': nickname
			});
		}
	};

	Synchronizer.prototype.token = function(content) {
		window.localStorage.token = content.token;
	};

	Synchronizer.prototype.playerJoin = function(content) {
		var player = content;
		this.view.newPlayer(player);
	};

	Synchronizer.prototype.playerLeave = function(content) {
		var player = content;
		this.view.clearPlayer(player.id);
	};

	Synchronizer.prototype.defineWorld = function(content) {
		Interface.display(null);

		this.view.stopRender();
		if (this.player.world) Worlds.delete(this.player.world.id);
		this.player.clear();
		this.view.clear();

		var worldHash = content;

		var sync = this;

		Interface.modify("loading", { "progress": 0 });
		Interface.display("loading");

		FileLoader.unload();
		FileLoader.addEventListener("refreshProgress", function(fileLoader, progress) { Interface.modify("loading", { "progress": progress }); });
		FileLoader.addEventListener("filesLoaded", function() {
			Interface.display(null);

			var world = Worlds.new(worldHash.world.id);
			world.update(worldHash.world);

			sync.player.world = world;
			sync.player.world.gamemode.params = worldHash.world.gamemode.params;

			sync.view.attachWorld(world);
			sync.view.players = worldHash.players;
			sync.view.startRender();

			AudioPlayer.init(world.id);

			sync.socket.emit('request', "definePlayer");
		});
		FileLoader.loadWorld(worldHash.world.id);
	};

	/**
	 * updateWorld()
	 * When the server send an entire world to the Client
	 *
	 * @param content The JSON String containing the world
	 */
	Synchronizer.prototype.updateWorld = function(content) {

		var worldHash = content;
		var world = Worlds.get(worldHash.id);
		if (world) {
			world.update(worldHash);
		}
	};

	Synchronizer.prototype.definePlayer = function(content) {
		var playerParams = content;
		this.player.world.updateEntities([playerParams.entity]);
		this.view.setFocus(playerParams.entity.id);
		this.player.entity = this.player.world.entities[playerParams.entity.id];
		/*this.playerParams.jumpPower = playerParams.jumpPower;
		this.playerParams.speed = playerParams.speed;*/
		//this.world.softUpdates[playerParams.entityId] = true;
	};

	/**
	 * entity()
	 * Creates a new entity send by the sever
	 *
	 * @param content The JSON String containing the entity
	 */
	Synchronizer.prototype.entity = function(content) {
		var entity = content;
		this.player.world.updateEntities([entity]);
	};

	Synchronizer.prototype.removeEntity = function(content) {
		this.player.world.removeEntity(content);
	};


	Synchronizer.prototype.error = function(content) {
		console.warn("Error from the server : " + content);
	};

	Synchronizer.prototype.debug = function(content) {
		console.warn("SERVER : " + content);
	};



	Synchronizer.prototype.mouseDown = function(x, y) {
		this.socket.emit('mousedown', {x: x, y: y});
	};

	Synchronizer.prototype.keyDown = function(key) {
		if (this.player.entity) {
			// if (key == "R") this.socket.emit('restartWorld', "");

			// If client-sided command
			if ((key == "ENTER" || key == "/") && Chatbox) {
				Chatbox.enter();
			}

			// If not, send the key to the server
			else {
				this.socket.emit('keydown', {
					"key": key,
					"entity": this.player.entity.export()
				});
				this.player.keyDown(key);
			}
		}
	};
	Synchronizer.prototype.keyUp = function(key) {
		if (this.player.entity) {
			this.socket.emit('keyup', {
				"key": key,
				"entity": this.player.entity.export()
			});
			this.player.keyUp(key);
		}
	};

	Synchronizer.prototype.touchStart = function(e) {
		var synchronizer = this;
		var touchStart = function(action, button) {
			if (action == "FULLSCREEN") {
				synchronizer.view.fullscreen();
			}
			else {
				for (var id in synchronizer.player.keys) {
					if (synchronizer.player.keys[id] == action) synchronizer.keyDown(id);
				}
			}
			button.className = "touchTouched";
		};
		var touchEnd = function(action, button) {
			if (action == "FULLSCREEN") {

			}
			else {
				for (var id in synchronizer.player.keys) {
					if (synchronizer.player.keys[id] == action) synchronizer.keyUp(id);
				}
			}
			button.className = "";
		};

		if (document.getElementById('touchContainer').style.display == "") {
			document.getElementById('touchContainer').style.display = "block";
			document.getElementById('touchUp').ontouchstart = function() { touchStart("UP", this); };
			document.getElementById('touchUp').ontouchend = function() { touchEnd("UP", this); };
			document.getElementById('touchLeft').ontouchstart = function() { touchStart("LEFT", this); };
			document.getElementById('touchLeft').ontouchend = function() { touchEnd("LEFT", this); };
			document.getElementById('touchDown').ontouchstart = function() { touchStart("DOWN", this); };
			document.getElementById('touchDown').ontouchend = function() { touchEnd("DOWN", this); };
			document.getElementById('touchRight').ontouchstart = function() { touchStart("RIGHT", this); };
			document.getElementById('touchRight').ontouchend = function() { touchEnd("RIGHT", this); };
			document.getElementById('touchAction1').ontouchstart = function() { touchStart("ACTION1", this); };
			document.getElementById('touchAction1').ontouchend = function() { touchEnd("ACTION1", this); };
			document.getElementById('touchAction2').ontouchstart = function() { touchStart("ACTION2", this); };
			document.getElementById('touchAction2').ontouchend = function() { touchEnd("ACTION2", this); };
			document.getElementById('touchFullscreen').ontouchstart = function() { touchStart("FULLSCREEN", this); };
			document.getElementById('touchFullscreen').ontouchend = function() { touchEnd("FULLSCREEN", this); };
			
			document.getElementById('chatbox').style.top = "30px";
			document.getElementById('chatbox').style.bottom = "initial";
			document.getElementById('chatboxInput').style.marginBottom = "5px";
			var firstChild = document.getElementById('chatbox').firstChild;
			document.getElementById('chatbox').removeChild(firstChild);
			document.getElementById('chatbox').appendChild(firstChild);
		}
	};



	Synchronizer.prototype.restartWorld = function() {
		this.socket.emit('restartWorld', "");
	};

	Synchronizer.prototype.sendPlayer = function() {
		if (this.player.world) {
			var player = this.player.entity;
			if (player) {
				this.socket.emit('player', {
					"worldId": this.player.world.id,
					"player": player.export()
				});
			}
		}
	};

	Synchronizer.prototype.chatboxMessage = function(content) {
		var messageObject = content;
		if (Chatbox) {
			Chatbox.addMessage(
				messageObject.msg,
				messageObject.nickname,
				messageObject.color,
				messageObject.type,
				messageObject.style
			);
		}
	};

	Synchronizer.prototype.sendChatboxMessage = function(text) {
		if (text.length > 0) {
			if (text.substr(0,1) == "/") {
				var command = text.substr(1).split(" ");
				if (command[0] == "zoom") {
					view.zoom(parseFloat(command[1]));
				}

				else this.socket.emit('chatboxMessage', text);
			}
			else this.socket.emit('chatboxMessage', text);
		}
	};


	Synchronizer.prototype.audio = function(audioName) {
		AudioPlayer.play(audioName);
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

	function getURLParams(param) {
		var vars = {};
		window.location.href.replace( 
			/[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
			function( m, key, value ) { // callback
				vars[key] = value !== undefined ? value : '';
			}
		);

		if ( param ) {
			return vars[param] ? vars[param] : null;	
		}
		return vars;
	}

	function toReguserName(nickname) {
		return nickname.toLowerCase().replace(/[^a-z0-9]/g, "");
	}


})();
