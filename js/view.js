(function() {

	var Worlds = window.Worlds;
	var PIXI = window.PIXI;
	var Chatbox = window.Chatbox;


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

	var DEFAULT_BACKGROUND_COLOR = 0x202430;

	var CAMERA_MAX = 7 / 8;
	var CAMERA_MIN = 1 / 8;
	var CAMERA_SPEED = 1 / 20;

	var ZOOM_MIN = 0.6;
	//var ZOOM_MIN = 0.05;
	var ZOOM_MAX = 1.8;

	var SMOOTH_TELEPORT_SPEED = 0.05;

	var MAX_ENTITY_DISTANCE = 2800;

	var BG_DIVISIONS_SIZE = 512;

	var BG_DEPTH = 0.3; // 0 ~ 1

	var ZINDEX = {
		"entitiesOffset": 0.1,
		"playerOffset": -0.1,
		"nickname": 10,
		"grid": -10,
		"background": -500
	};

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
		109: "-",
		111: "/",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12"
	};

	var STYLE_NICKNAME = {
	    font : '16px Caviar Dreams',
	    fill : 'rgba(255,255,255,1)',
	    stroke : 'rgba(5,20,50,1)',
    	strokeThickness : 5
	};


	/**
	 * View
	 * Used to render a given world
	 *
	 * @param world The world to render 
	 */
	var View = function(world) {

		if (document.location.href.split("?").length > 1 && document.location.href.split("?")[1].indexOf("WebGL") != -1)
			this.renderer = new PIXI.WebGLRenderer(window.innerWidth, window.innerHeight, {antialias: true});
		else this.renderer = new PIXI.CanvasRenderer(window.innerWidth, window.innerHeight, {antialias: true});
		
		this.renderer.backgroundColor = DEFAULT_BACKGROUND_COLOR;
	    document.body.appendChild(this.renderer.view);
	    this.stage = new PIXI.Container();
	    this.stage.position.x = this.renderer.width / 2;
	    this.stage.position.y = this.renderer.height / 2;
	    this.stage.updateLayersOrder = function () { // https://github.com/pixijs/pixi.js/issues/300
		    this.children.sort(function(a,b) {
		        a.zIndex = a.zIndex || 0;
		        b.zIndex = b.zIndex || 0;
		        return a.zIndex - b.zIndex
		    });
		};
	    this.PIXIContainer = this.stage;
	    this.stage.scale.x = 1;
	    this.stage.scale.y = 1;

	    // this.graphics = new PIXI.Graphics();
	    this.graphics = {
	    	"entities": new PIXI.Graphics(),
	    	"grid": new PIXI.Graphics(),

	    	"clear": function() {
	    		for (var id in this) {
	    			if (typeof this[id] != "function") this[id].clear();
	    		}
	    	},
	    	"getAll": function() {
	    		var res = [];
				for (var id in this) {
	    			if (typeof this[id] != "function") res.push(this[id]);
	    		}
	    		return res;
	    	}
	    };
	    this.graphics.grid.zIndex = ZINDEX.grid;
	    this.loadingTextures = {};
	    this.textures = {};
	    this.sprites = {};
	    this.compounds = {};
	    this.players = {};
	    this.background = new PIXI.Container();
	    this.background.zIndex = ZINDEX.background;
	    this.entityFocusId = null;

	    this.world = world;


	    // Events
	    this.initEvents();


	    // Camera offset
	    this.offset = {
	    	x: 0,
	    	y: 0
	    };


	    this.tick = 0;
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
	    	keyup: [],

	    	touchstart: [],
	    	touchmove: [],
	    	touchend: []
	    };
	    var view = this;
	    // Mouse events
	    this.renderer.view.onmousedown = function(e) {
	    	if (Chatbox) Chatbox.blur();
	    	if (e.button == 0) view.triggerEvent('mouseleftdown', e);
	    	else if (e.button == 1) view.triggerEvent('mousemiddledown', e);
	    	else if (e.button == 2) view.triggerEvent('mouserightdown', e);
	    };
	    this.renderer.view.onmouseup = function(e) {
	    	if (e.button == 0) view.triggerEvent('mouseleftup', e);
	    	else if (e.button == 1) view.triggerEvent('mousemiddleup', e);
	    	else if (e.button == 2) view.triggerEvent('mouserightup', e);
	    };
	    this.renderer.view.onmousemove = function(e) {
	    	if (e.buttons == 0) view.triggerEvent('mouseleftmove', e);
	    	else if (e.buttons == 4) view.triggerEvent('mousemiddlemove', e);
	    	else if (e.buttons == 2) view.triggerEvent('mouserightmove', e);
	    };
	    this.renderer.view.onmousewheel = function(e) {
	    	view.triggerEvent('mousewheel', e);
	    };
	    this.renderer.view.ontouchstart = function(e) {
	    	view.triggerEvent('touchstart', e);
	    	e.preventDefault();
	    	return false;
	    };
	    this.renderer.view.ontouchmove = function(e) {
	    	view.triggerEvent('touchmove', e);
	    	e.preventDefault();
	    	return false;
	    };
	    this.renderer.view.ontouchend = function(e) {
	    	view.triggerEvent('touchend', e);
	    	e.preventDefault();
	    	return false;
	    };
	    window.ontouchmove = function(e) {
	    	e.preventDefault();
	    	return false;
	    }

	    this.addEventListener('mouserightdown', view.mouseRightDown);
	    this.addEventListener('mouserightup', view.mouseRightUp);
	    this.addEventListener('mouserightmove', view.mouseRightMove);
	    this.rightDown = false;
	    this.lastMousePosition = {x: null, y: null};
	    this.addEventListener('mousewheel', view.mouseWheel);


	    this.preventKeyRepeat = {};
	    window.onkeydown = function(e) {
	    	if (!view.preventKeyRepeat[e.keyCode] && !Chatbox.focused) {
	    		view.preventKeyRepeat[e.keyCode] = true;
	    		var key = KEYS[e.keyCode];
	    		view.triggerEvent('keydown',key);
	    	}
	    };
	    this.addEventListener('keydown', view.keyDown);

	    window.onkeyup = function(e) {
	    	if (!Chatbox.focused) {
		    	view.preventKeyRepeat[e.keyCode] = false;
		    	var key = KEYS[e.keyCode];
		    	view.triggerEvent('keyup',key);
		    }
	    };




	    document.body.oncontextmenu = function(e) { return false; };

	    window.onresize = function(e) {
	    	var zoom = (document.body.style.zoom) ? document.body.style.zoom : 1;
	    	view.renderer.resize(window.innerWidth / zoom, window.innerHeight / zoom);
	    	view.moveCamera({x: 0, y: 0}, true);
	    };

	    //setInterval(function() { window.onresize(); }, 2000);

	};

	View.prototype.clear = function() {
		if (this.world) this.world.resetEventListener("removeEntity");
		this.textures = {};
		this.sprites = {};
		this.compounds = {};
	    this.players = {};

		this.stage.scale.x = 1;
		this.stage.scale.y = 1;

		this.entityFocusId = null;
		this.renderEntityId = null;
		this.graphics.clear();
		this.stage.removeChildren();
		this.moveCamera({x: 0, y: 0});
	};

	/**
	 * attachWorld()
	 * Render another world
	 *
	 * @param world The other world to render
	 */
	View.prototype.attachWorld = function(world) {
		// Clear everything
		this.clear();

		// Rebuild
		var graphics = this.graphics.getAll();
		for (var idG in graphics) {
			this.stage.addChild(graphics[idG]);
		}
		this.stage.addChild(this.background);
		this.world = world;
		var view = this;
		this.world.addEventListener("removeEntity", function(entityId) {view.removeSprite(entityId);});
		this.getBackground(world.background.image);
		this.world.physicsWorld.add(this.physicsRenderer);
		this.world.physicsWorld.on('step', function() {
			view.update();
		});
	};

	View.prototype.setFocus = function(entityId) {
		this.entityFocusId = entityId;
	};

	View.prototype.getBackground = function(background) {
		var background = background || ((this.world) ? this.world.id : undefined);
		if (background) {
			var view = this;
			ajax("getBackground", {"world": background}, function(bgData) {
				view.background.removeChildren();
				if (bgData.images.length != bgData.size.x * bgData.size.y) {
					console.error("Mismatching number of images and size of background : " + bgData.images.length + " and " + (bgData.size.x * bgData.size.y));
				}
				else {
					var divisionSize = view.world.background.divisionSize || BG_DIVISIONS_SIZE;
					var count = 0;
					var boundaryX = bgData.size.x * (divisionSize / 2) - (divisionSize / 2);
					var boundaryY = bgData.size.y * (divisionSize / 2) - (divisionSize / 2);
					for (var j = -boundaryY ; j <= boundaryY ; j += divisionSize) {
						for (var i = -boundaryX ; i <= boundaryX ; i += divisionSize) {
							var sprite = new PIXI.Sprite.fromImage("./img/worlds/" + background + "/background/" + bgData.images[count++]);
							sprite.position.x = i;
							sprite.position.y = j;
							view.background.addChild(sprite);
						}
					}
				}
			});
		}
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
		if (this.run && this.tick % 2 >= 0) {

			var time = (new Date().getTime());

			this.graphics.clear();

			if (DEBUG) this.drawGrid(this.graphics.grid);

			// For each entities
			for (var idE in this.world.entities) {
				if (this.renderEntityId == null || this.renderEntityId == idE) {
					if (this.world.entities[idE].type == "Compound") this.renderCompound(this, this.world.entities[idE]);
					else this.renderEntity(this, this.world.entities[idE]);
				}
				

				// Remove far, non players and not focused entities
				if (this.tick % 60 == 0) {
					if (this.distFromEntity(this.world.entities[idE]) > MAX_ENTITY_DISTANCE && !this.world.entities[idE].player) {
						this.world.removeEntity(idE);
					}
				}

			}

			// Update zIndex
			if (this.tick % 120 == 30) {
				this.refreshZIndex(this);
			}

			var cameraPos = this.getCameraPosition();
			var depth = (this.world.background.depth != null && this.world.background.depth != undefined) ? this.world.background.depth : BG_DEPTH;
			this.background.position.x = cameraPos.x * depth;
			this.background.position.y = cameraPos.y * depth;

			this.refreshCamera();
			this.refreshPlayersNickname();

			if (this.world.background.color != null && this.world.background.color != undefined) this.renderer.backgroundColor = parseInt(this.world.background.color);
			else this.renderer.backgroundColor = DEFAULT_BACKGROUND_COLOR;


			this.renderer.render(this.stage);

		}
		this.tick++;
	};

	/**
	 * renderEntity()
	 * Renders the entity inside its container
	 */
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
		if (!entity.texture || entity.style || DEBUG) {

			if (entity.style) {
				var lineSize = ((entity.style.linesize) ? entity.style.linesize : 0),
					lineColor = ((entity.style.linecolor) ? entity.style.linecolor : "0xDDEEFF");
				var backgroundColor, backgroundOpacity;
				if (entity.style.background) {
					backgroundColor = entity.style.background;
					backgroundOpacity = 1;
				}
				else {
					backgroundColor = "0x000000";
					backgroundOpacity = 0;
				}
				container.graphics.entities.lineStyle(lineSize, lineColor);
				container.graphics.entities.beginFill(backgroundColor, backgroundOpacity);
			}
			else {
				container.graphics.entities.lineStyle(1, 0xDDEEFF);
				container.graphics.entities.beginFill(0xDDEEFF, 0);
			}

			if (entity.type == 'Rectangle') {

				pos = [
					rotatePoint(
						b.state.pos.x - b.width / 2, b.state.pos.y - b.height / 2,
						b.state.angular.pos + angleDelta,
						b.state.pos.x, b.state.pos.y
					),
					rotatePoint(
						b.state.pos.x + b.width / 2, b.state.pos.y - b.height / 2,
						b.state.angular.pos + angleDelta,
						b.state.pos.x, b.state.pos.y
					),
					rotatePoint(
						b.state.pos.x + b.width / 2, b.state.pos.y + b.height / 2,
						b.state.angular.pos + angleDelta,
						b.state.pos.x, b.state.pos.y
					),
					rotatePoint(
						b.state.pos.x - b.width / 2, b.state.pos.y + b.height / 2,
						b.state.angular.pos + angleDelta,
						b.state.pos.x, b.state.pos.y
					),
				];

				container.graphics.entities.moveTo(pos[0].x + positionDelta.x, pos[0].y + positionDelta.y);
				for (var i = 1 ; i < 4 ; i++) {
					container.graphics.entities.lineTo(pos[i].x + positionDelta.x, pos[i].y + positionDelta.y);
				}

			}

			else if (entity.type == 'Circle') {

				pos = {x: b.state.pos.x, y: b.state.pos.y};
				container.graphics.entities.drawCircle(pos.x + positionDelta.x, pos.y + positionDelta.y, entity.radius);

			}

			else if (entity.type == 'Polygon') {

				if (b.geometry.vertices[0]) {
					pos = rotatePoint(
						b.geometry.vertices[0].x + b.state.pos.x, b.geometry.vertices[0].y + b.state.pos.y,
						angleDelta + b.state.angular.pos,
						b.state.pos.x, b.state.pos.y
					);
					container.graphics.entities.moveTo(pos.x + positionDelta.x, pos.y + positionDelta.y);

					for (var i = 1 ; i < b.geometry.vertices.length ; i++) {
						pos = rotatePoint(
							b.geometry.vertices[i].x + b.state.pos.x, b.geometry.vertices[i].y + b.state.pos.y,
							angleDelta + b.state.angular.pos,
							b.state.pos.x, b.state.pos.y
						);
						container.graphics.entities.lineTo(pos.x + positionDelta.x, pos.y + positionDelta.y);								
					}
				}

			}

			container.graphics.entities.endFill();
		}

		// Texture
		if (entity.texture) {

			// Init Sprite and Texture
			if (!container.sprites[entity.id]) {
				this.newSprite(container, entity.id, entity.texture);
				container.sprites[entity.id].scale = entity.textureScale;
			}

			pos = entity.getPos();
			angle = entity.getAngle();

			pos = rotatePoint(
				pos.x + entity.textureOffset.x + entity.textureCenter.x,
				pos.y + entity.textureOffset.y + entity.textureCenter.y,
				angle,
				pos.x,
				pos.y
			);

			container.sprites[entity.id].position.x = pos.x + positionDelta.x;
			container.sprites[entity.id].position.y = pos.y + positionDelta.y;

			container.sprites[entity.id].rotation = angle + angleDelta;

			if (DEBUG) container.sprites[entity.id].alpha = 0.5;
			else container.sprites[entity.id].alpha = 1;

		}

	};

	/**
	 * renderCompound()
	 * Renders the entities contained inside the compound entity
	 */
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

		// Texture
		if (entity.texture) {

			// Init Sprite and Texture
			if (!container.sprites[entity.id]) {
				this.newSprite(container, entity.id, entity.texture);
				container.sprites[entity.id].scale = entity.textureScale;
			}

			pos = entity.getPos();
			angle = entity.getAngle();

			pos = rotatePoint(
				pos.x + entity.textureOffset.x + entity.textureCenter.x,
				pos.y + entity.textureOffset.y + entity.textureCenter.y,
				angle,
				pos.x,
				pos.y
			);
			container.sprites[entity.id].position.x = pos.x + positionDelta.x;
			container.sprites[entity.id].position.y = pos.y + positionDelta.y;

			container.sprites[entity.id].rotation = angle + angleDelta;

			if (DEBUG) container.sprites[entity.id].alpha = 0.5;
			else container.sprites[entity.id].alpha = 1;

		}


		pos = rotatePoint(
			b.state.pos.x - entity.com.x,
			b.state.pos.y - entity.com.y,
			b.state.angular.pos,
			b.state.pos.x,
			b.state.pos.y
		);

		container.compounds[entity.id].PIXIContainer.position.x = pos.x + positionDelta.x;
		container.compounds[entity.id].PIXIContainer.position.y = pos.y + positionDelta.y;
		container.compounds[entity.id].PIXIContainer.rotation = b.state.angular.pos + angleDelta;


		container.compounds[entity.id].graphics.entities.clear();

		if (!entity.hiddenChildren || DEBUG) {
			for (var idE in entity.children) {
				if (entity.children[idE].type == "Compound") this.renderCompound(container[entity.id], entity.children[idE]);
				else this.renderEntity(container.compounds[entity.id], entity.children[idE]);
			}
		}
	};


	/**
	 * drawGrid()
	 * Draws a grid
	 * A little bugy with circular worlds.
	 */
	View.prototype.drawGrid = function(graphics) {
		graphics.lineStyle(1, 0x444444, 1);

		var gridSpace = 200;

		var left = this.offset.x - (this.renderer.width / 2) * (1/view.stage.scale.x);
		var right = this.offset.x + (this.renderer.width / 2) * (1/view.stage.scale.x);
		var top = this.offset.y - (this.renderer.height / 2) * (1/view.stage.scale.y);
		var bottom = this.offset.y + (this.renderer.height / 2) * (1/view.stage.scale.y);
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

	View.prototype.renderOneEntity = function(entityId) {
		if (entityId !== undefined && entityId !== null) {
			if (this.renderEntityId === null || this.renderEntityId === undefined) {
				this.storeEntityFocusId = this.entityFocusId;
				for (var idE in this.world.entities) {
					this.removeSprite(idE);
				}
			}
			this.entityFocusId = entityId;
			this.renderEntityId = entityId;
		}
		else {
			this.renderEntityId = null;
			this.entityFocusId = this.storeEntityFocusId;
		}
	};



	/**
	 * defineCompound()
	 * Creates a compound object needed by the view to render compound objects
	 */
	View.prototype.defineCompound = function(container, compoundId) {
		var PIXIContainer = new PIXI.Container();
		container.compounds[compoundId] = {
			"graphics": {
				"entities": new PIXI.Graphics()
			},
			"sprites": {},
			"compounds": {},
			"PIXIContainer": PIXIContainer
		};
	    PIXIContainer.updateLayersOrder = function () { // https://github.com/pixijs/pixi.js/issues/300
		    this.children.sort(function(a,b) {
		        a.zIndex = a.zIndex || 0;
		        b.zIndex = b.zIndex || 0;
		        return a.zIndex - b.zIndex
		    });
		};
		PIXIContainer.addChild(container.compounds[compoundId].graphics.entities);
		container.PIXIContainer.addChild(PIXIContainer);
		// if (container == this) this.stage.updateLayersOrder();
		container.PIXIContainer.updateLayersOrder();
	};






	/**
	 * screenToWorldCoords()
	 * Return the world coordinates from the position on the screen (for a clic)
	 */
	View.prototype.screenToWorldCoords = function(pos) {
		return rotatePoint(
			pos.x - this.stage.position.x,
			pos.y - this.stage.position.y,
			-this.stage.rotation,
			0,
			0
		);
	};


	/**
	 * newSprite()
	 * Creates a Sprite object
	 */
	View.prototype.newSprite = function(container, id, texture) {

		var view = this;
		function initSprite(sprites) {
			for (var idS in sprites) {
				sprites[idS].sprite.texture = view.textures[texture];
				sprites[idS].sprite.anchor.x = 0.5;
				sprites[idS].sprite.anchor.y = 0.5;
				sprites[idS].sprite.zIndex = view.world.entities[sprites[idS].id].zIndex;
				sprites[idS].container.PIXIContainer.addChild(sprites[idS].sprite);
				sprites[idS].container.PIXIContainer.updateLayersOrder();
			}
			if (view.loadingTextures[texture]) delete view.loadingTextures[texture];
		}

		if (this.textures[texture] == null || this.textures[texture] == undefined) {
			this.loadingTextures[texture] = [];
			this.textures[texture] = PIXI.Texture.EMPTY;
			container.sprites[id] = new PIXI.Sprite(view.textures[texture]);
			this.loadingTextures[texture].push({
				"sprite": container.sprites[id],
				"container": container,
				"id": id
			});
			ajax("getImagePath", {
				"world": this.world.id,
				"image": texture,
			}, function (response) {
				if (response !== "") {
					view.textures[texture] = PIXI.Texture.fromImage('./img/worlds/' + response + '/textures/' + texture + '.png');
					initSprite(view.loadingTextures[texture]);
				}
				else {
					console.error("Texture not found : " + texture);
				}
			});
		}
		else {
			container.sprites[id] = new PIXI.Sprite(view.textures[texture]);
			if (view.textures[texture] == PIXI.Texture.EMPTY) {
				this.loadingTextures[texture].push({
					"sprite": container.sprites[id],
					"container": container,
					"id": id
				});
			}
			else initSprite([{
				"sprite": container.sprites[id],
				"container": container,
				"id": id
			}]);
		}
	};

	/**
	 * removeSprite()
	 * Deletes the Sprite object
	 */
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



	View.prototype.refreshZIndex = function(container) {
		for (var idS in container.sprites) {
			container.sprites[idS].zIndex = this.world.entities[idS].zIndex + ZINDEX.entitiesOffset;
			if (this.world.entities[idS].player) container.sprites[idS].zIndex += ZINDEX.playerOffset;
		}
		for (var idC in container.compounds) {
			this.refreshZIndex(container.compounds[idC]);
		}
		container.PIXIContainer.updateLayersOrder();
	};



	/**
	 * refreshCamera()
	 * Refreshes the position of the camera according to the focused entity
	 */
	View.prototype.refreshCamera = function() {

		// Focused entity
		var fEntity = this.world.entities[this.entityFocusId];

		if (fEntity) {

			var dx = fEntity.physicsBody.state.pos.x - this.offset.x;
			var dy = fEntity.physicsBody.state.pos.y - this.offset.y;

			var newDelta = {x: 0, y: 0};

			if (this.renderEntityId !== null) {
				newDelta = {x: dx, y: dy};
			}
			else {

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
			}

			this.moveCamera(newDelta, true);

		}
	};

	/**
	 * moveCamera()
	 * Moves the camera according to the vector.x and vector.y
	 * Can move the camera with relative or absolute coordinates
	 */
	View.prototype.moveCamera = function(vector, relative) {
		if (this.world) {
			var relative = (relative) ? 1 : 0;
			this.offset.x = this.offset.x * relative + vector.x;
			this.offset.y = this.offset.y * relative + vector.y;
			if (this.world.type == "flat" || this.renderEntityId !== null || DEBUG) {
				this.stage.position.x = -this.offset.x * this.stage.scale.x + this.renderer.width / 2;
				this.stage.position.y = -this.offset.y * this.stage.scale.y + this.renderer.height / 2;
				this.stage.rotation = 0;
			}
			else if (this.world.type == "circular") {
				var angleDist = toAngleDist(this.offset);
				this.stage.position.x = this.renderer.width / 2;
				this.stage.position.y = (angleDist.dist * this.stage.scale.y + this.renderer.height / 2);
				this.stage.rotation = - (angleDist.angle + Math.PI/2);
			}
		}
	};

	/**
	 * getmareaPosition()
	 * Returns the current corrdinates of the center of the camera
	 */
	View.prototype.getCameraPosition = function() {
		return {
			x: this.offset.x,
			y: this.offset.y
		};
	};






	/**
	 * triggerEvent()
	 * Triggers an event with the parameters this and result
	 */
	View.prototype.triggerEvent = function(event, result) {
		for (var id in this.events[event]) {
			this.events[event][id](this, result);
		}
	};

	/**
	 * addEventListener()
	 * Adds a new event listener
	 */
	View.prototype.addEventListener = function(event, func) {
		this.events[event].push(func);
	};


	/**
	 * A little bugy for the moment
	 */
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

	/**
	 * mouseWheel()
	 * Used to zoom or dezoom the camera
	 */
	View.prototype.mouseWheel = function(view, e) {
		view.zoom(- e.deltaY / 1000, true);
	};

	/**
	 * zoom()
	 * Zooms the carema relatively or not
	 * TODO Zoom with * instead of +
	 */
	View.prototype.zoom = function(zoom, relative) {
		relative = (relative)?1:0;
		view.stage.scale.x = Math.min(Math.max(relative * view.stage.scale.x + zoom, ZOOM_MIN), ZOOM_MAX);
		view.stage.scale.y = Math.min(Math.max(relative * view.stage.scale.y + zoom, ZOOM_MIN), ZOOM_MAX);
	};

	/**
	 * keyDown()
	 */
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
		/*else if (key == "F9") {
			view.fullscreen();
		}*/
	};

	View.prototype.fullscreen = function() {
		if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
			var DOM = document.body;
			if (DOM.webkitRequestFullscreen) {
				DOM.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
			else if (DOM.mozRequestFullScreen) {
				DOM.mozRequestFullScreen();
			}
			else if (DOM.requestFullscreen) {
				DOM.requestFullscreen();
			}
			if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) {
				document.body.style.zoom = "0.6";
			}
		}
		else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
			else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			}
			else if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
			if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
				document.body.style.zoom = "";
			}
		}
	};

	View.prototype.hideAddressBar = function() {
		if(!window.location.hash) {
			window.Chatbox.addMessage(String(this.renderer.view.offsetHeight) + " " + String(document.body.clientHeight)
				 + " " + String(window.outerHeight), "Debug", {r: 200, g: 50, b: 50}, 1);
			if(document.height < window.outerHeight || true) {
				// document.body.style.height = (window.outerHeight + 50) + 'px';
				this.renderer.resize(window.innerWidth, window.innerHeight + 50);
			}
			setTimeout( function() { window.scrollTo(0, 50); }, 50);
		}
	};





	/**
	 * distFromEntity()
	 * Compute the distance between the center of the camera and an entity
	 */
	View.prototype.distFromEntity = function(entity) { // possible optimization : if aabb < ? use only x & y
		if (this.world) {
			var cPos = this.getCameraPosition();

			var ePos = entity.getPos();

			var dx = ePos.x - cPos.x;
			var dy = ePos.y - cPos.y;

			if (entity.type == "Decoration") {
				return Math.sqrt(dx * dx + dy * dy);
			}
			else {
				var aabbEntity = entity.physicsBody.aabb();

				var aabbdx = (aabbEntity.x - aabbEntity.hw * Math.sign(dx)) - (cPos.x);
				var aabbdy = (aabbEntity.y - aabbEntity.hh * Math.sign(dy)) - (cPos.y);

				if (aabbdx * Math.sign(dx) < 0 && aabbdy * Math.sign(dy) < 0) return 0;
				else if (aabbdx * Math.sign(dx) < 0) return Math.abs(aabbdy);
				else if (aabbdy * Math.sign(dy) < 0) return Math.abs(aabbdx);

				return Math.sqrt(aabbdx * aabbdx + aabbdy * aabbdy);
			}
		}
	};



	/**
	 * clearPlayer()
	 * Removes a player from the list
	 */
	View.prototype.clearPlayer = function(playerId) {
		if (this.players[playerId]) {
			this.stage.removeChild(this.players[playerId].text);
			delete this.players[playerId];
		}
	};

	/**
	 * newPlayer()
	 * Adds a player to the list. The object contains a unique "id", the player's "nickname" and the "entityId"
	 */
	View.prototype.newPlayer = function(player) {
		if (this.players[player.id]) this.clearPlayer(player.id);
		this.players[player.id] = player;
	};

	/**
	 * refreshPlayersNickname()
	 * Refreshes the text displaying the players nickname
	 */
	View.prototype.refreshPlayersNickname = function() {
		var e, aabb, radius, pos, b, angle, angleDelta, positionDelta, progressSinus;
		for (var idP in this.players) {
			if (this.world.entities[this.players[idP].entityId]) {
				if (this.players[idP].text == undefined) {
					this.players[idP].text = new PIXI.Text(this.players[idP].nickname,STYLE_NICKNAME);
					this.players[idP].text.zIndex = ZINDEX.nickname;
					this.stage.addChild(this.players[idP].text);
					this.stage.updateLayersOrder();
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

				if (this.world.type == "circular") {
					angle = toAngleDist({x: b.state.pos.x, y: b.state.pos.y}).angle - Math.PI/2;

					pos = rotatePoint(
						aabb.x + positionDelta.x + this.players[idP].text.width / 2,
						aabb.y + positionDelta.y + radius * 1.6 + this.players[idP].text.height,
						angle,
						b.state.pos.x + positionDelta.x,
						b.state.pos.y + positionDelta.y
					);
				}
				else if (this.world.type == "flat") {
					pos = {
						x: aabb.x + positionDelta.x - this.players[idP].text.width / 2,
						y: aabb.y + positionDelta.y - radius * 1.6 - this.players[idP].text.height
					}
				}
				/*pos.x -= this.players[idP].text.width / 2;
				pos.y -= this.players[idP].text.height;*/
				this.players[idP].text.x = pos.x;
				this.players[idP].text.y = pos.y;
				this.players[idP].text.rotation = angle + Math.PI;
			}
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