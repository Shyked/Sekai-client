(function() {

	var Worlds = window.Worlds;
	var PIXI = window.PIXI;


/*           *\
    #### 
  ########
 #######+++
 #####+++++++
  ###+++++++++
    ##+++++++
        +++ 
\*           */


	var SMOOTH_TELEPORT = true;
	var DEBUG = false;

	var CAMERA_MAX = 7 / 8;
	var CAMERA_MIN = 1 / 8;
	var CAMERA_SPEED = 1 / 20;

	var ZOOM_MIN = 0.6;
	var ZOOM_MAX = 1.8;

	var SMOOTH_TELEPORT_SPEED = 0.05;

	var MAX_ENTITY_DISTANCE = 2800;

	var KEYS = {
		13: "ENTER",
		32: "SPACE",
		37: "LEFT",
		38: "UP",
		39: "RIGHT",
		40: "DOWN",
		65: "A",
		66: "B",
		67: "C",
		68: "D",
		69: "E",
		70: "F",
		71: "G",
		72: "H",
		73: "I",
		74: "J",
		75: "K",
		76: "L",
		77: "M",
		78: "N",
		79: "O",
		80: "P",
		81: "Q",
		82: "R",
		83: "S",
		84: "T",
		85: "U",
		86: "V",
		87: "W",
		88: "X",
		89: "Y",
		90: "Z",
		96: "0",
		97: "1",
		98: "2",
		99: "3",
		100: "4",
		101: "5",
		102: "6",
		103: "7",
		104: "8",
		105: "9",
		107: "+",
		109: "-"
	}

	var STYLE_NICKNAME = {
	    font : '16px Caviar Dreams',
	    fill : 'rgba(255,255,255,0.8)',
	    stroke : 'rgba(0,0,0,0.3)',
    	strokeThickness : 3
	};


	/**
	 * View
	 * Used to render a given world
	 *
	 * @param world The world to render 
	 */
	var View = function(world) {

		this.renderer = new PIXI.CanvasRenderer(window.innerWidth, window.innerHeight, {antialias: true});
		this.renderer.backgroundColor = 0x202430;
	    document.body.appendChild(this.renderer.view);
	    this.stage = new PIXI.Container();
	    this.stage.position.x = this.renderer.width / 2;
	    this.stage.position.y = this.renderer.height / 2;
	    this.PIXIContainer = this.stage;
	    this.stage.scale.x = 1;
	    this.stage.scale.y = 1;

	    this.graphics = new PIXI.Graphics();
	    this.textures = {};
	    this.sprites = {};
	    this.compounds = {};
	    this.players = {};
	    this.entityFocusId = null;

	    this.stage.addChild(this.graphics);

	    this.world = world;


	    // Events
	    this.initEvents();


	    // Camera offset
	    this.offset = {
	    	x: 0,
	    	y: 0
	    };


	    this.count = 0;
	    this.run = false;
	};

	View.prototype.initEvents = function() {

	    this.events = {
	    	mouseleftdown: [],
	    	mousemiddledown: [],
	    	mouserightdown: [],

	    	mouseleftup: [],
	    	mousemiddleup: [],
	    	mouserightup: [],

	    	mouseleftmove: [],
	    	mousemiddlemove: [],
	    	mouserightmove: [],

	    	mousewheel: [],

	    	keydown: [],
	    	keyup: []
	    };
	    var view = this;
	    // Mouse events
	    this.renderer.view.onmousedown = function(e) {
	    	if (e.button == 0) view.triggerEvent('mouseleftdown',e);
	    	else if (e.button == 1) view.triggerEvent('mousemiddledown',e);
	    	else if (e.button == 2) view.triggerEvent('mouserightdown',e);
	    };
	    this.renderer.view.onmouseup = function(e) {
	    	if (e.button == 0) view.triggerEvent('mouseleftup',e);
	    	else if (e.button == 1) view.triggerEvent('mousemiddleup',e);
	    	else if (e.button == 2) view.triggerEvent('mouserightup',e);
	    };
	    this.renderer.view.onmousemove = function(e) {
	    	if (e.buttons == 0) view.triggerEvent('mouseleftmove',e);
	    	else if (e.buttons == 4) view.triggerEvent('mousemiddlemove',e);
	    	else if (e.buttons == 2) view.triggerEvent('mouserightmove',e);
	    };
	    this.renderer.view.onmousewheel = function(e) {
	    	view.triggerEvent('mousewheel',e);
	    };

	    this.addEventListener('mouserightdown', view.mouseRightDown);
	    this.addEventListener('mouserightup', view.mouseRightUp);
	    this.addEventListener('mouserightmove', view.mouseRightMove);
	    this.rightDown = false;
	    this.lastMousePosition = {x: null, y: null};
	    this.addEventListener('mousewheel', view.mouseWheel);


	    this.preventKeyRepeat = {};
	    window.onkeydown = function(e) {
	    	if (!view.preventKeyRepeat[e.keyCode]) {
	    		view.preventKeyRepeat[e.keyCode] = true;
	    		var key = KEYS[e.keyCode];
	    		view.triggerEvent('keydown',key);
	    	}
	    };
	    this.addEventListener('keydown', view.keyDown);

	    window.onkeyup = function(e) {
	    	view.preventKeyRepeat[e.keyCode] = false;
	    	var key = KEYS[e.keyCode];
	    	view.triggerEvent('keyup',key);
	    };




	    document.body.oncontextmenu = function(e) { return false; };

	    window.onresize = function(e) {
	    	view.renderer.resize(window.innerWidth, window.innerHeight);
	    	view.moveCamera({x: 0, y: 0}, true);
	    };

	};

	/**
	 * attachWorld()
	 * Render another world
	 *
	 * @param world The other world to render
	 */
	View.prototype.attachWorld = function(world) {
		// Clear everything
		if (this.world) this.world.resetEventListener("removeEntity");
		this.textures = {};
		this.sprites = {};
		this.compounds = {};
		var view = this;
		if (this.entityFocusId != null) {
			var prevEntityFocusId = this.entityFocusId;
			setTimeout(function(){
				if (view.entityFocusId == null && view.world == world) view.entityFocusId = prevEntityFocusId;
			},1000)
		}
		this.entityFocusId = null;
		this.graphics.clear();
		this.stage.removeChildren();

		// Rebuild
		this.stage.addChild(this.graphics);
		this.world = world;
		this.world.addEventListener("removeEntity", function(entityId) {view.removeSprite(entityId);});
		this.world.physicsWorld.add(this.physicsRenderer);
		this.world.physicsWorld.on('step', function() {
			view.update();
		});
	};

	View.prototype.setFocus = function(entityId) {
		this.entityFocusId = entityId;
	};

	/**
	 * startRendering()
	 * Starts the rendering
	 */
	View.prototype.startRender = function() {
		if (!this.world) {
			console.warn("[View] Can't start rendering : No world attached.");
		}
		else if (!this.run) {
			this.run = true;
		}
	};

	/**
	 * stopRedering()
	 * Stops the rendering
	 */
	View.prototype.stopRender = function() {
		this.run = false;
	};

	/**
	 * update()
	 * The loop used to render
	 */
	View.prototype.update = function(bodies, meta) {
		if (this.run) {

			this.graphics.clear();

			if (DEBUG) this.drawGrid(this.graphics);

			// For each entities
			for (var idE in this.world.entities) {
				if (this.world.entities[idE].type == "Compound") this.renderCompound(this, this.world.entities[idE]);
				else this.renderEntity(this, this.world.entities[idE]);
				
				if (idE == this.entityFocusId) {
					var dx = this.world.entities[idE].physicsBody.state.pos.x - this.offset.x;
					var dy = this.world.entities[idE].physicsBody.state.pos.y - this.offset.y;
					var newDelta = {x: 0, y: 0};

					if (Math.abs(dx) > CAMERA_MIN * this.renderer.width / 2) {
						newDelta.x += (dx - Math.sign(dx) * CAMERA_MIN * this.renderer.width / 2) * CAMERA_SPEED;
					}
					if (Math.abs(dx) > CAMERA_MAX * this.renderer.width / 2) {
						newDelta.x += dx - Math.sign(dx) * (CAMERA_MAX * this.renderer.width / 2 + 1);
					}

					if (Math.abs(dy) > CAMERA_MIN * this.renderer.height / 2) {
						newDelta.y += (dy - Math.sign(dy) * CAMERA_MIN * this.renderer.height / 2) * CAMERA_SPEED;
					}
					if (Math.abs(dy) > CAMERA_MAX * this.renderer.height / 2) {
						newDelta.y += dy - Math.sign(dy) * (CAMERA_MAX * this.renderer.height / 2 + 1);
					}

					this.moveCamera(newDelta, true);
				}
				else if (this.count % 60 == 0 && this.entityFocusId != null) {
					if (this.distFromEntity(this.world.entities[idE]) > MAX_ENTITY_DISTANCE) {
						this.world.removeEntity(idE);
					}
				}
			}

			var e, aabb, radius, pos, b, angle, angleDelta, positionDelta, progressSinus;
			for (var idP in this.players) {
				if (this.players[idP].delete) {
					this.stage.removeChild(this.players[idP].text);
					delete this.players[idP];
				}
				else {
					if (this.world.entities[this.players[idP].entityId]) {
						if (this.players[idP].text == undefined) {
							this.players[idP].text = new PIXI.Text(this.players[idP].nickname,STYLE_NICKNAME);
							this.stage.addChild(this.players[idP].text);
						}
						b = this.world.entities[this.players[idP].entityId].physicsBody;
						e = this.world.entities[this.players[idP].entityId];
						aabb = b.aabb();
						radius = Math.sqrt(aabb.hw * aabb.hw + aabb.hh * aabb.hh) / 2;

						angleDelta = 0;
						positionDelta = {x: 0, y: 0};
						if (e.smoothTeleport.progress < 1 && SMOOTH_TELEPORT) {
							e.smoothTeleport.progress += SMOOTH_TELEPORT_SPEED;
							progressSinus = (Math.sin(e.smoothTeleport.progress * Math.PI + Math.PI/2) + 1) / 2; // Inversed (1 -> 0)
							e.smoothTeleport.progressSinus = progressSinus;
							positionDelta = {
								x: e.smoothTeleport.positionDelta.x * progressSinus,
								y: e.smoothTeleport.positionDelta.y * progressSinus
							};
						}

						angle = toAngleDist({x: b.state.pos.x, y: b.state.pos.y}).angle - Math.PI/2;

						pos = rotatePoint(
							aabb.x + positionDelta.x + this.players[idP].text.width / 2,
							aabb.y + positionDelta.y + radius * 1.6 + this.players[idP].text.height,
							angle,
							b.state.pos.x + positionDelta.x,
							b.state.pos.y + positionDelta.y
						);
						/*pos.x -= this.players[idP].text.width / 2;
						pos.y -= this.players[idP].text.height;*/
						this.players[idP].text.x = pos.x;
						this.players[idP].text.y = pos.y;
						this.players[idP].text.rotation = angle + Math.PI;
					}
				}
			}

			/*		var aabb = b.aabb();
		var radius = Math.sqrt(aabb.hw * aabb.hw + aabb.hh * aabb.hh) / 2;

		rotatePoint({
			x: aabb.x,
			y: aabb.y
		});*/

			this.renderer.render(this.stage);

			this.count++;

		}
	};

	View.prototype.renderEntity = function(container, entity) {
		var pos;
		var progressSinus;
		var angleDelta;
		var positionDelta;
		var s;
		var entityST;

		b = entity.physicsBody;

		// Calc Smooth Teleport position modificator
		entityST = false;
		angleDelta = 0;
		positionDelta = {x: 0, y: 0};
		if (entity.smoothTeleport.progress < 1 && SMOOTH_TELEPORT) {
			entityST = true;
			entity.smoothTeleport.progress += SMOOTH_TELEPORT_SPEED;
			progressSinus = (Math.sin(entity.smoothTeleport.progress * Math.PI + Math.PI/2) + 1) / 2; // Inversed (1 -> 0)
			entity.smoothTeleport.progressSinus = progressSinus;
			angleDelta = entity.smoothTeleport.angleDelta * progressSinus;
			positionDelta = {
				x: entity.smoothTeleport.positionDelta.x * progressSinus,
				y: entity.smoothTeleport.positionDelta.y * progressSinus
			};
		}

		// No texture
		if (!entity.texture || DEBUG) {

			container.graphics.lineStyle(2, 0xDDEEFF);
			container.graphics.beginFill(0xDDEEFF, 0);

			if (entity.type == 'Rectangle') {

				pos = [
					this.addOffset(rotatePoint(
						b.state.pos.x - b.width / 2, b.state.pos.y - b.height / 2,
						b.state.angular.pos + angleDelta,
						b.state.pos.x, b.state.pos.y
					)),
					this.addOffset(rotatePoint(
						b.state.pos.x + b.width / 2, b.state.pos.y - b.height / 2,
						b.state.angular.pos + angleDelta,
						b.state.pos.x, b.state.pos.y
					)),
					this.addOffset(rotatePoint(
						b.state.pos.x + b.width / 2, b.state.pos.y + b.height / 2,
						b.state.angular.pos + angleDelta,
						b.state.pos.x, b.state.pos.y
					)),
					this.addOffset(rotatePoint(
						b.state.pos.x - b.width / 2, b.state.pos.y + b.height / 2,
						b.state.angular.pos + angleDelta,
						b.state.pos.x, b.state.pos.y
					)),
				];

				container.graphics.moveTo(pos[0].x + positionDelta.x, pos[0].y + positionDelta.y);
				for (var i = 1 ; i < 4 ; i++) {
					container.graphics.lineTo(pos[i].x + positionDelta.x, pos[i].y + positionDelta.y);
				}

			}

			else if (entity.type == 'Circle') {

				pos = this.addOffset({x: b.state.pos.x, y: b.state.pos.y});
				container.graphics.drawCircle(pos.x + positionDelta.x, pos.y + positionDelta.y, entity.radius);

			}

			else if (entity.type == 'Polygon') {

				if (b.geometry.vertices[0]) {
					pos = this.addOffset(rotatePoint(
						b.geometry.vertices[0].x + b.state.pos.x, b.geometry.vertices[0].y + b.state.pos.y,
						angleDelta + b.state.angular.pos,
						b.state.pos.x, b.state.pos.y
					));
					container.graphics.moveTo(pos.x + positionDelta.x, pos.y + positionDelta.y);

					for (var i = 1 ; i < b.geometry.vertices.length ; i++) {
						pos = this.addOffset(rotatePoint(
							b.geometry.vertices[i].x + b.state.pos.x, b.geometry.vertices[i].y + b.state.pos.y,
							angleDelta + b.state.angular.pos,
							b.state.pos.x, b.state.pos.y
						));
						container.graphics.lineTo(pos.x + positionDelta.x, pos.y + positionDelta.y);								
					}
				}

			}

			container.graphics.endFill();
		}

		// Texture
		if (entity.texture) {

			// Init Sprite and Texture
			if (!container.sprites[entity.id]) {
				this.newSprite(container, entity.id, entity.texture);
				container.sprites[entity.id].scale = entity.textureScale;
			}


			if (entity.type == 'Polygon') {
				pos = this.addOffset(rotatePoint(
					b.state.pos.x + entity.textureCenter.x,
					b.state.pos.y + entity.textureCenter.y,
					b.state.angular.pos,
					b.state.pos.x,
					b.state.pos.y
				));
			}
			else {
				pos = this.addOffset({
					x: b.state.pos.x,
					y: b.state.pos.y
				});
			}

			container.sprites[entity.id].position.x = pos.x + positionDelta.x;
			container.sprites[entity.id].position.y = pos.y + positionDelta.y;

			container.sprites[entity.id].rotation = b.state.angular.pos + angleDelta;

			if (DEBUG) container.sprites[entity.id].alpha = 0.5;
			else container.sprites[entity.id].alpha = 1;

		}

	};

	View.prototype.renderCompound = function(container, entity) {
		if (!container.compounds[entity.id]) this.defineCompound(container, entity.id);


		var entityST = false;
		var angleDelta = 0;
		var positionDelta = {x: 0, y: 0};
		var b = entity.physicsBody;
		var progressSinus;
		var pos;
		if (entity.smoothTeleport.progress < 1 && SMOOTH_TELEPORT) {
			entityST = true;
			entity.smoothTeleport.progress += 0.05;
			progressSinus = (Math.sin(entity.smoothTeleport.progress * Math.PI + Math.PI/2) + 1) / 2; // Inversed (1 -> 0)
			entity.smoothTeleport.progressSinus = progressSinus;
			angleDelta = entity.smoothTeleport.angleDelta * progressSinus;
			positionDelta = {
				x: entity.smoothTeleport.positionDelta.x * progressSinus,
				y: entity.smoothTeleport.positionDelta.y * progressSinus
			};
		}

		pos = this.addOffset(rotatePoint(
			b.state.pos.x - entity.com.x,
			b.state.pos.y - entity.com.y,
			b.state.angular.pos,
			b.state.pos.x,
			b.state.pos.y
		));

		container.compounds[entity.id].PIXIContainer.position.x = pos.x + positionDelta.x;
		container.compounds[entity.id].PIXIContainer.position.y = pos.y + positionDelta.y;
		container.compounds[entity.id].PIXIContainer.rotation = b.state.angular.pos + angleDelta;


		container.compounds[entity.id].graphics.clear();

		for (var idE in entity.children) {
			if (entity.children[idE].type == "Compound") this.renderCompound(container[entity.id], entity.children[idE]);
			else this.renderEntity(container.compounds[entity.id], entity.children[idE]);
		}
	};


	View.prototype.drawGrid = function(graphics) {
		graphics.lineStyle(0.1, 0x888888, 1);

		var gridSpace = 50;

		var left = this.offset.x - this.renderer.width / 2;
		var right = this.offset.x + this.renderer.width / 2;
		var top = this.offset.y - this.renderer.height / 2;
		var bottom = this.offset.y + this.renderer.height / 2;
		for (var i = left - left % gridSpace ; i < right ; i += gridSpace) {
			graphics.moveTo(i, top);
			graphics.lineTo(i, bottom);
		}
		for (var i = top - top % gridSpace ; i < bottom ; i += gridSpace) {
			graphics.moveTo(left, i);
			graphics.lineTo(right, i);
		}

		//graphics.endFill();
	};



	View.prototype.defineCompound = function(container, compoundId) {
		var PIXIContainer = new PIXI.Container();
		var graphics = new PIXI.Graphics();
		container.compounds[compoundId] = {
			"graphics": graphics,
			"sprites": {},
			"compounds": {},
			"PIXIContainer": PIXIContainer
		};
		PIXIContainer.addChild(graphics);
		container.PIXIContainer.addChild(PIXIContainer);
	};





	View.prototype.addOffset = function(pos) {
		return {
			x: pos.x/* + this.offset.x + this.renderer.width / 2*/,
			y: pos.y/* + this.offset.y + this.renderer.height / 2*/
		}
	};

	View.prototype.removeOffset = function(pos) {
		return rotatePoint(
			pos.x - this.stage.position.x,
			pos.y - this.stage.position.y,
			-this.stage.rotation,
			0,
			0
		);
	};


	View.prototype.newSprite = function(container, id, texture) {
		if (!this.textures[texture]) {
			this.textures[texture] = PIXI.Texture.fromImage('./img/textures/' + texture + '.png');
		}
		container.sprites[id] = new PIXI.Sprite(this.textures[texture]);
		container.sprites[id].anchor.x = 0.5;
		container.sprites[id].anchor.y = 0.5;
		container.PIXIContainer.addChild(container.sprites[id]);
	};

	View.prototype.removeSprite = function(entityId) {
		if (this.compounds[entityId]) {
			this.stage.removeChild(this.compounds[entityId].PIXIContainer);
			delete this.compounds[entityId];
		}
		if (this.sprites[entityId]) {
			this.stage.removeChild(this.sprites[entityId]);
			delete this.sprites[entityId];
		}
	};




	View.prototype.moveCamera = function(vector, relative) {
		var relative = (relative) ? 1 : 0;
		this.offset.x = this.offset.x * relative + vector.x;
		this.offset.y = this.offset.y * relative + vector.y;
		var angleDist = toAngleDist(this.offset);
		this.stage.position.x = this.renderer.width / 2;
		this.stage.position.y = (angleDist.dist * this.stage.scale.y + this.renderer.height / 2);
		this.stage.rotation = - (angleDist.angle + Math.PI/2);
		/*this.stage.position.x = -this.offset.x + this.renderer.width / 2;
		this.stage.position.y = -this.offset.y + this.renderer.height / 2;*/
	};






	View.prototype.triggerEvent = function(event, result) {
		for (var id in this.events[event]) {
			this.events[event][id](this, result);
		}
	};

	View.prototype.addEventListener = function(event, func) {
		this.events[event].push(func);
	};


	View.prototype.mouseRightDown = function(view, e) {
		view.rightDown = true;
		var x = (e.offsetX != undefined) ? e.offsetX : e.layerX - e.target.offsetLeft;
		var y = (e.offsetY != undefined) ? e.offsetY : e.layerY - e.target.offsetTop;
		view.lastMousePosition = {
			x: x,
			y: y
		};
	};

	View.prototype.mouseRightUp = function(view, e) {
		view.rightDown = false;
	};

	View.prototype.mouseRightMove = function(view, e) {
		if (view.rightDown) {
			var x = (e.offsetX != undefined) ? e.offsetX : e.layerX - e.target.offsetLeft;
			var y = (e.offsetY != undefined) ? e.offsetY : e.layerY - e.target.offsetTop;

			view.moveCamera({x: view.lastMousePosition.x - x, y: view.lastMousePosition.y - y}, true);

			view.lastMousePosition = {
				x: x,
				y: y
			};
		}
	};

	View.prototype.mouseWheel = function(view, e) {
		view.zoom(- e.deltaY / 1000, true);
	};

	View.prototype.zoom = function(zoom, relative) {
		relative = (relative)?1:0;
		view.stage.scale.x = Math.min(Math.max(relative * view.stage.scale.x + zoom, ZOOM_MIN), ZOOM_MAX);
		view.stage.scale.y = Math.min(Math.max(relative * view.stage.scale.y + zoom, ZOOM_MIN), ZOOM_MAX);
	};

	View.prototype.keyDown = function(view, key) {
		if (key == "+") {
			view.zoom(0.05, true);
		}
		else if (key == "-") {
			view.zoom(-0.05, true);
		}
		else if (key == "0") {
			view.zoom(1, false);
		}
	};



	View.prototype.distFromEntity = function(entity) { // possible optimization : if aabb < ? use only x & y
		if (this.world) {
			var playerEntity = this.world.entities[this.entityFocusId];

			if (entity == playerEntity || playerEntity === undefined) return 0;

			var dx = entity.physicsBody.state.pos.x - playerEntity.physicsBody.state.pos.x;
			var dy = entity.physicsBody.state.pos.y - playerEntity.physicsBody.state.pos.y;

			var aabbPlayer = playerEntity.physicsBody.aabb();
			var aabbEntity = entity.physicsBody.aabb();

			var aabbdx = (aabbEntity.x - aabbEntity.hw * Math.sign(dx)) - (aabbPlayer.x + aabbPlayer.hw * Math.sign(dx));
			var aabbdy = (aabbEntity.y - aabbEntity.hh * Math.sign(dy)) - (aabbPlayer.y + aabbPlayer.hh * Math.sign(dy));

			if (aabbdx * Math.sign(dx) < 0 && aabbdy * Math.sign(dy) < 0) return 0;
			else if (aabbdx * Math.sign(dx) < 0) return Math.abs(aabbdy);
			else if (aabbdy * Math.sign(dy) < 0) return Math.abs(aabbdx);

			return Math.sqrt(aabbdx * aabbdx + aabbdy * aabbdy);
		}
	};

	


	window.View = View;


	// Lib

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


})();