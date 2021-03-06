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

	// var ZOOM_MIN = 3000;
	var ZOOM_MIN = 50000;
	var ZOOM_MAX = 200;

	var SPEED_ZOOM_MAX = 1.3;
	var CAMERA_MOVING_THRESHOLD = 1;

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
		27: "ESCAPE",
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
    font : '900 16px Josefin Sans, Josefin Sans Backup, sans-serif',
    fill : 'rgba(255,255,255,0.7)',
    stroke : 'rgba(10,10,10,0.6)',
  	strokeThickness : 4,
  	miterLimit: 3
	};


	/**
	 * View
	 * Used to render a given world
	 *
	 * @param world The world to render 
	 */
	var View = function() {

		this.resolution = 1;

		if (document.location.href.split("?").length > 1 && document.location.href.split("?")[1].indexOf("WebGL") != -1)
			this.renderer = new PIXI.WebGLRenderer(window.innerWidth * this.resolution, window.innerHeight * this.resolution, {antialias: true});
		else this.renderer = new PIXI.CanvasRenderer(window.innerWidth * this.resolution, window.innerHeight * this.resolution, {antialias: true});
		
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



    // Events
    this.initEvents();


    // TouchScreen
    this.touchScreen = {};


    // Camera offset
    this.offset = {
    	x: 0,
    	y: 0
    };
    this.cameraSpeedCoeff = 1;
    this.cameraTransition = {
    	"initialAngle": 0,
    	"initialDist": 0,
    	"direction": 1,
    	"progress": 1,
    	"previousOrigin": null
    };
    this.zoomFactor = 1;


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

	    this.addEventListener('touchstart', view.touchStart);
	    this.addEventListener('touchmove', view.touchMove);
	    this.addEventListener('touchend', view.touchEnd);


	    this.preventKeyRepeat = {};
	    window.addEventListener('keydown', function(e) {
	    	if (!view.preventKeyRepeat[e.keyCode] && !Chatbox.focused) {
	    		view.preventKeyRepeat[e.keyCode] = true;
	    		var key = KEYS[e.keyCode];
	    		view.triggerEvent('keydown',key);
	    	}
	    });
	    this.addEventListener('keydown', view.keyDown);

	    window.addEventListener('keyup', function(e) {
	    	if (!Chatbox.focused) {
		    	view.preventKeyRepeat[e.keyCode] = false;
		    	var key = KEYS[e.keyCode];
		    	view.triggerEvent('keyup',key);
		    }
	    });




	    document.body.oncontextmenu = function(e) { return false; };

	    window.onresize = function(e) {
	    	var zoom = (document.body.style.zoom) ? document.body.style.zoom : 1;
	    	view.renderer.resize(window.innerWidth / zoom * view.resolution, window.innerHeight / zoom * view.resolution);
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
	    this.world = null;

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
		this.cameraTransition = {
    	"initialAngle": 0,
    	"initialDist": 0,
    	"direction": 1,
    	"progress": 1,
    	"previousOrigin": null
    };
    this.imagesPath = {};
		var graphics = this.graphics.getAll();
		for (var idG in graphics) {
			this.stage.addChild(graphics[idG]);
		}
		this.stage.addChild(this.background);
		this.zoom(1, true);
		this.world = world;
		var view = this;
		this.world.addEventListener("removeEntity", function(entityId) {view.removeSprite(entityId);});
		this.getBackground(world.background.image);

		this.world.addEventListener("afterStep", function() { view.update(); });
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
					var divisionSize = bgData.divisionSize || BG_DIVISIONS_SIZE;
					var count = 0;
					var boundaryX = (bgData.size.x * divisionSize) / 2;
					var boundaryY = (bgData.size.y * divisionSize) / 2;
					for (var j = -boundaryY ; j < boundaryY ; j += divisionSize) {
						for (var i = -boundaryX ; i < boundaryX ; i += divisionSize) {
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
			this.renderer.view.classList.add('running');
			this.run = true;
		}
	};

	/**
	 * stopRedering()
	 * Stops the rendering
	 */
	View.prototype.stopRender = function() {
		this.renderer.view.classList.remove('running');
		this.run = false;
	};

	/**
	 * update()
	 * The loop used to render
	 */
	View.prototype.update = function(bodies, meta) {
		if (this.run && this.tick % 2 >= 0) {

			var time = (new Date().getTime());

			// if (this.entityFocusId) Chatbox.debug(this.world.entities[this.entityFocusId].getVel()['y']);
			// if (this.entityFocusId) Chatbox.debug(distToSegment(this.world.entities[this.entityFocusId].getPos(), {x: -500, y: 0}, {x: 500, y: 0}));

			this.graphics.clear();

			if (DEBUG) this.drawGrid(this.graphics.grid);

			// For each entities
			for (var idE in this.world.entities) {
				if (this.renderEntityId == null || this.renderEntityId == idE) {
					if (this.world.entities[idE].type == "Compound") this.renderCompound(this, this.world.entities[idE]);
					else this.renderEntity(this, this.world.entities[idE]);
				}
			}

			// Update zIndex
			if (this.tick % 120 == 30) {
				this.refreshZIndex(this);
			}

			this.refreshCamera();
			this.refreshPlayersNickname();

			var cameraPos = this.getCameraPosition();
			var depth = (this.world.background.depth != null && this.world.background.depth != undefined) ? this.world.background.depth : BG_DEPTH;
			this.background.position.x = cameraPos.x * depth;
			this.background.position.y = cameraPos.y * depth;

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
		if (entity.texture && entity.hasChanged()) {

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
		if (entity.texture && entity.hasChanged()) {

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
	 * Quite bugy with circular worlds.
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
		// sprites[idS].sprite.zIndex = this.world.entities[sprites[idS].id].zIndex;
		PIXIContainer.zIndex = this.world.entities[compoundId].zIndex;
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
				sprites[idS].sprite.zIndex = sprites[idS].zIndex;
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
				"zIndex": this.world.entities[id].zIndex
			});
			this.getImagePath(texture, function(imagePath) {
				view.textures[texture] = PIXI.Texture.fromImage(imagePath);
				initSprite(view.loadingTextures[texture]);
			});
		}
		else {
			container.sprites[id] = new PIXI.Sprite(view.textures[texture]);
			if (view.textures[texture] == PIXI.Texture.EMPTY) {
				this.loadingTextures[texture].push({
					"sprite": container.sprites[id],
					"container": container,
					"zIndex": this.world.entities[id].zIndex
				});
			}
			else initSprite([{
				"sprite": container.sprites[id],
				"container": container,
				"zIndex": this.world.entities[id].zIndex
			}]);
		}
	};

	View.prototype.getImagePath = function(image, callback) {
		if (this.imagesPath[image]) {
			callback(this.imagesPath[image]);
		}
		else {
			var view = this;
			ajax("getImagePath", {
				"world": this.world.id,
				"image": image,
			}, function (response) {
				if (response !== "") {
					view.imagesPath[image] = './img/worlds/' + response + '/textures/' + image + '.png';
					callback(view.imagesPath[image]);
				}
				else {
					console.error("Texture not found : " + image);
				}
			});
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

			var pos = fEntity.getPos();

			var dx = pos.x - this.offset.x;
			var dy = pos.y - this.offset.y;

			var newDelta = {x: 0, y: 0};

			if (this.renderEntityId !== null) {
				newDelta = {x: dx, y: dy};
			}
			else {

				var smaller = Math.min(this.renderer.width / 2, this.renderer.height / 2);
				var min = smaller * CAMERA_MIN / this.zoomFactor;
				var max = smaller * CAMERA_MAX / this.zoomFactor;
				var dAngleDist = toAngleDist({x: dx, y: dy});
				var newDist = 0;

				if (dAngleDist.dist > min) {
					newDist = (dAngleDist.dist - min) * this.getCameraSpeed();
				}
				if (dAngleDist.dist - newDist > max) {
					newDist = dAngleDist.dist - max;
				}

				dAngleDist.dist = newDist;
				newDelta = toXY(dAngleDist);
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
			var oldOffset = {
				x: this.offset.x,
				y: this.offset.y
			};
			this.offset.x = this.offset.x * relative + vector.x;
			this.offset.y = this.offset.y * relative + vector.y;

			if (this.world.type == "flat" || this.renderEntityId !== null || DEBUG) {
				this.stage.position.x = -this.offset.x * this.stage.scale.x + this.renderer.width / 2;
				this.stage.position.y = -this.offset.y * this.stage.scale.y + this.renderer.height / 2;
				this.stage.rotation = 0;
			}
			else if (this.world.type == "circular") {
				var origin = this.world.entities[this.entityFocusId].origin || {x: 0, y: 0};

				if (!this.cameraTransition.previousOrigin) this.cameraTransition.previousOrigin = origin;
				else {
					if (this.cameraTransition.previousOrigin.x != origin.x || this.cameraTransition.previousOrigin.y != origin.y) {
						var pOrigin = this.cameraTransition.previousOrigin;
						var cPos = this.getCameraPosition();

						// Previous Angle Dist relative to the camera
						var prevAD = toAngleDist({
							x: pOrigin.x - cPos.x,
							y: pOrigin.y - cPos.y
						});
						this.cameraTransition.initialAngle = prevAD.angle;
						this.cameraTransition.initialDist = prevAD.dist;

						var newAD = toAngleDist({
							x: origin.x - cPos.x,
							y: origin.y - cPos.y
						});
						var diff = Math.mod(prevAD.angle - newAD.angle, Math.PI * 2);
						if (diff < Math.PI) this.cameraTransition.direction = -1;
						else this.cameraTransition.direction = 1;
						this.cameraTransition.progress = 0;

						this.cameraTransition.previousOrigin = origin;
					}
					if (this.cameraTransition.progress < 1) {
						this.cameraTransition.progress += 0.02; // 1 => 1 / speed
						var progressSinus = (Math.sin(this.cameraTransition.progress * Math.PI - Math.PI / 2) + 1) / 2;
						var cPos = this.getCameraPosition();
						var newAD = toAngleDist({
							x: origin.x - cPos.x,
							y: origin.y - cPos.y
						});
						var dAngle = (newAD.angle - this.cameraTransition.initialAngle) * progressSinus;
						var dDist = (newAD.dist - this.cameraTransition.initialDist) * progressSinus;

						origin = toXY({
							"angle": this.cameraTransition.initialAngle + dAngle,
							"dist": this.cameraTransition.initialDist + dDist
						});
						origin.x += cPos.x;
						origin.y += cPos.y;

						var originalSpeed = this.getCameraSpeed() / this.cameraSpeedCoeff;
						this.cameraSpeedCoeff = Math.cos(this.cameraTransition.progress * Math.PI - Math.PI / 2) * (1 / originalSpeed / 5 - 1) + 1;
					}
				}

				this.stage.pivot = new PIXI.Point(origin.x, origin.y);
				var angleDist = toAngleDist({x: this.offset.x - origin.x, y: this.offset.y - origin.y});
				this.stage.position.x = this.renderer.width / 2;
				this.stage.position.y = angleDist.dist * this.stage.scale.y + this.renderer.height / 2;
				this.stage.rotation = - (angleDist.angle + Math.PI/2);
			}
		}
	};

	/**
	 * getCameraPosition()
	 * Returns the current corrdinates of the center of the camera
	 */
	View.prototype.getCameraPosition = function() {
		return {
			x: this.offset.x,
			y: this.offset.y
		};
	};

	View.prototype.getCameraSpeed = function() {
		return CAMERA_SPEED * this.cameraSpeedCoeff * ((this.stage.scale.x + 1) / 2);
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
		view.zoom(1 - e.deltaY / 1000, true);
	};

	/**
	 * zoom()
	 * Zooms the carema relatively or not
	 * Relative zoom uses multiply
	 */
	View.prototype.zoom = function(zoom, relative) {
		relative = (relative)?1:0;
		var min = this.renderer.width / ZOOM_MIN;
		var max = this.renderer.height / ZOOM_MAX;
		if (relative) {
			this.zoomFactor = Math.min(Math.max(this.zoomFactor * zoom, min), max);
		}
		else {
			this.zoomFactor = Math.min(Math.max(zoom, min), max);
		}
		this.stage.scale.x = this.zoomFactor;
		this.stage.scale.y = this.zoomFactor;
	};

	/**
	 * keyDown()
	 */
	View.prototype.keyDown = function(view, key) {
		if (key == "+") {
			view.zoom(1.05, true);
		}
		else if (key == "-") {
			view.zoom(0.95, true);
		}
		else if (key == "0") {
			view.zoom(1, false);
		}
		/*else if (key == "F9") {
			view.fullscreen();
		}*/
	};

	View.prototype.touchStart = function(view, e) {
		if (e.touches.length == 2) {
			view.touchScreen.pinchDist = Math.sqrt(Math.pow(e.touches[0].pageX - e.touches[1].pageX,2) + Math.pow(e.touches[0].pageY - e.touches[1].pageY,2));
		}
	};

	View.prototype.touchMove = function(view, e) {
		if (e.touches.length == 2) {
			var dist = Math.sqrt(Math.pow(e.touches[0].pageX - e.touches[1].pageX,2) + Math.pow(e.touches[0].pageY - e.touches[1].pageY,2));
			/*window.Chatbox.addMessage("Dist : " + dist, "Debug", {r: 200, g: 50, b: 50}, 1);
			window.Chatbox.addMessage("Prev : " + dist, "Debug", {r: 200, g: 50, b: 50}, 1);*/
			if (view.touchScreen.pinchDist) {
				view.zoom(dist / view.touchScreen.pinchDist, true);
			}
			view.touchScreen.pinchDist = dist;
		}
	};

	View.prototype.touchEnd = function(view, e) {
		// body...
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
			this.players[playerId].text = null;
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
		var e, aabb, radius, pos, b, angle, angleDelta, positionDelta, progressSinus, origin;
		for (var idP in this.players) {
			if (this.world.entities[this.players[idP].entityId]) {
				if (this.players[idP].text == undefined) {
					this.players[idP].text = new PIXI.Text(this.players[idP].nickname, STYLE_NICKNAME);
					this.players[idP].text.zIndex = ZINDEX.nickname;
					this.stage.addChild(this.players[idP].text);
					this.stage.updateLayersOrder();
				}
				this.players[idP].text.resolution = this.stage.scale.x;
				this.players[idP].text.updateText();
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
					origin = {x: this.stage.pivot.x, y: this.stage.pivot.y} || {x: 0, y: 0};
					angle = toAngleDist({x: b.state.pos.x - origin.x, y: b.state.pos.y - origin.y}).angle - Math.PI/2;

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
				if (angle) this.players[idP].text.rotation = angle + Math.PI;
			}
			else {
				if (this.players[idP].text) {
					this.stage.removeChild(this.players[idP].text);
					this.players[idP].text = null;
				}
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

	function toXY(angleDist) {
		var x = Math.cos(angleDist.angle) * angleDist.dist;
		var y = Math.sin(angleDist.angle) * angleDist.dist;
		return {
			x: x,
			y: y
		};
	}

	function ajax(action, params, callback) {
		var xmlhttp;
		xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
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
