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

	    this.graphics = new PIXI.Graphics();
	    this.textures = {};
	    this.sprites = {};

	    this.stage.addChild(this.graphics);

	    this.world = world;


	    /*this.physicsRenderer = Physics.renderer('canvas');
	    var view = this;
	    this.physicsRenderer.render = function(bodies, meta) {
			this._world.emit('beforeRender', {
			    renderer: this,
			    bodies: bodies,
			    meta: meta
			});

			if (this.options.meta) {
			    this.drawMeta( meta );
			}
			
			view.update(bodies, meta);
	    };*/


	    // Events
	    this.initEvents();


	    // Camera offset
	    this.offset ={
	    	x: 0,
	    	y: 0
	    };


	    this.run = false;
	};

	View.prototype.initEvents = function() {

	    this.events = {
	    	mouseleftdown : [],
	    	mousemiddledown : [],
	    	mouserightdown : [],

	    	mouseleftup : [],
	    	mousemiddleup : [],
	    	mouserightup : [],

	    	mouseleftmove : [],
	    	mousemiddlemove : [],
	    	mouserightmove : [],
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

	    this.addEventListener('mouserightdown', view.mouseRightDown);
	    this.addEventListener('mouserightup', view.mouseRightUp);
	    this.addEventListener('mouserightmove', view.mouseRightMove);
	    this.rightDown = false;
	    this.lastMousePosition = {x: null, y: null};
	    document.body.oncontextmenu = function(e) { return false; };

	    window.onresize = function(e) {
	    	view.renderer.resize(window.innerWidth, window.innerHeight);
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
		this.textures = {};
		this.sprites = {};
		this.graphics.clear();
		this.stage.removeChildren();

		// Rebuild
		this.stage.addChild(this.graphics);
		this.world = world;
		this.world.physicsWorld.add(this.physicsRenderer);
		var view = this;
		this.world.physicsWorld.on('step', function() {
			view.update();
		});
	}

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

			var entity;
			var pos;
			var progressSinus;
			var angleDelta;
			var positionDelta;
			var s;
			var entityST;

			// For each entities
			for (var idE in this.world.entities) {
				entity = this.world.entities[idE];
				b = entity.physicsBody;

				// Calc Smooth Teleport position modificator
				entityST = false;
				angleDelta = 0;
				positionDelta = {x: 0, y: 0};
				if (this.world.entities[idE].smoothTeleport.progress < 1 && SMOOTH_TELEPORT) {
					entityST = true;
					this.world.entities[idE].smoothTeleport.progress += 0.05;
					progressSinus = (Math.sin(this.world.entities[idE].smoothTeleport.progress * Math.PI + Math.PI/2) + 1) / 2; // Inversed (1 -> 0)
					angleDelta = this.world.entities[idE].smoothTeleport.angleDelta * progressSinus;
					positionDelta = {
						x: this.world.entities[idE].smoothTeleport.positionDelta.x * progressSinus,
						y: this.world.entities[idE].smoothTeleport.positionDelta.y * progressSinus
					};
				}

				// No texture
				if (!entity.texture) {

					this.graphics.lineStyle(2, 0xDDEEFF);
					this.graphics.beginFill(0xDDEEFF, 0);

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

						this.graphics.moveTo(pos[0].x + positionDelta.x, pos[0].y + positionDelta.y);
						for (var i = 1 ; i < 4 ; i++) {
							this.graphics.lineTo(pos[i].x + positionDelta.x, pos[i].y + positionDelta.y);
						}

					}

					else if (entity.type == 'Circle') {

						pos = this.addOffset({x: b.state.pos.x, y: b.state.pos.y});
						this.graphics.drawCircle(pos.x + positionDelta.x, pos.y + positionDelta.y, entity.radius);

					}

					else if (entity.type == 'Polygon') {

						if (b.geometry.vertices[0]) {
							pos = this.addOffset(rotatePoint(
								b.geometry.vertices[0].x, b.geometry.vertices[0].y,
								angleDelta,
								b.state.pos.x, b.state.pos.y
							));
							this.graphics.moveTo(pos.x + positionDelta.x, pos.y + positionDelta.y);

							for (var i = 1 ; i < b.geometry.vertices.length ; i++) {
								pos = this.addOffset(rotatePoint(
									b.geometry.vertices[i].x, b.geometry.vertices[i].y,
									angleDelta,
									b.state.pos.x, b.state.pos.y
								));
								this.graphics.lineTo(pos.x + positionDelta.x, pos.y + positionDelta.y);								
							}
						}

					}

					this.graphics.endFill();

					// alias vertices
					/*v = this.world.entities[idE].matterBody.vertices;

					// Draw style (currently default)
					this.graphics.lineStyle(2, 0xDDEEFF);
					this.graphics.beginFill(0xDDEEFF, 0);

					// Smooth Teleport
					if (entityST) {
						// Independant first point due to "moveTo"
						if (v[0]) {
							pos = this.addOffset(rotatePoint(v[0].x, v[0].y, angleDelta, entity.matterBody.position.x, entity.matterBody.position.y));
							this.graphics.moveTo(pos.x + positionDelta.x, pos.y + positionDelta.y);
						}
						// All other points
						for (var i = 1 ; i < v.length ; i++) {
							pos = this.addOffset(rotatePoint(v[i].x, v[i].y, angleDelta, entity.matterBody.position.x, entity.matterBody.position.y));
							this.graphics.lineTo(pos.x + positionDelta.x, pos.y + positionDelta.y);
						}
					}

					// Original position
					else {
						if (v[0]) {
							pos = this.addOffset({x: v[0].x, y: v[0].y});
							this.graphics.moveTo(pos.x, pos.y);
						}
						for (var i = 1 ; i < v.length ; i++) {
							pos = this.addOffset({x: v[i].x, y: v[i].y});
							this.graphics.lineTo(pos.x, pos.y);
						}
					}
					this.graphics.endFill();*/
				}

				// Texture
				else {

					// Init Sprite and Texture
					if (!this.sprites[entity.id]) {
						this.newSprite(entity.id, entity.texture);
						this.sprites[entity.id].scale = entity.textureScale;
					}


					pos = this.addOffset({x: entity.physicsBody.state.pos.x, y: entity.physicsBody.state.pos.y});
					this.sprites[entity.id].position.x = pos.x + positionDelta.x;
					this.sprites[entity.id].position.y = pos.y + positionDelta.y;

					this.sprites[entity.id].rotation = entity.physicsBody.state.angular.pos + angleDelta;

				}
			}

			this.renderer.render(this.stage);

		}
	};



	View.prototype.addOffset = function(pos) {
		return {
			x: pos.x + this.offset.x + this.renderer.width / 2,
			y: pos.y + this.offset.y + this.renderer.height / 2
		}
	};

	View.prototype.removeOffset = function(pos) {
		return {
			x: pos.x - this.offset.x - this.renderer.width / 2,
			y: pos.y - this.offset.y - this.renderer.height / 2
		}
	};


	View.prototype.newSprite = function(id, texture) {
		if (!this.textures[texture]) {
			this.textures[texture] = PIXI.Texture.fromImage('./img/textures/' + texture + '.png');
		}
		this.sprites[id] = new PIXI.Sprite(this.textures[texture]);
		this.sprites[id].anchor.x = 0.5;
		this.sprites[id].anchor.y = 0.5;
		this.stage.addChild(this.sprites[id]);
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
			view.offset.x += x - view.lastMousePosition.x;
			view.offset.y += y - view.lastMousePosition.y;

			view.lastMousePosition = {
				x: x,
				y: y
			};
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


})();