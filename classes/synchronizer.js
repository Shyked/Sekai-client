(function() {

	var Worlds = window.Worlds;

	/**
	 * Synchronizer
	 * Used for the communication between the Client and the Server
	 */
	var Synchronizer = function() {
		this.world = null;
		this.view = null;
	};

	/**
	 * init()
	 * Initializes the socket. NODE_URL must be defined globally
	 *
	 * @param view The View object used to ender
	 */
	Synchronizer.prototype.init = function(view) {
		this.view = view;

		this.socket = io.connect(NODE_URL);

		var that = this;
		this.socket.on('defineWorld',function(content){that.defineWorld(content)});
		this.socket.on('world',function(content){that.attachWorld(content)});
		this.socket.on('entity',function(content){that.entity(content)});
	};

	Synchronizer.prototype.defineWorld = function(content) {
		this.view.stopRender();
		if (this.world) Worlds.delete(this.world.id);
		this.attachWorld(content);
	};

	/**
	 * attachWorld()
	 * When the server send an entire world to the Client
	 *
	 * @param content The JSON String containing the world
	 */
	Synchronizer.prototype.attachWorld = function(content) {
		var worldData = JSON.parse(content);
		var world = Worlds.get(worldData.id);
		if (world) { // If the world already exists
			world.entitiesCount = worldData.entitiesCount;
			world.importEntitiesFromJSON(worldData.entities);
		}
		else {
			world = Worlds.new(worldData);
			this.world = world;
			this.view.attachWorld(world);
			this.view.startRender();
		}
	};

	/**
	 * entity()
	 * Creates a new entity send by the sever
	 *
	 * @param content The JSON String containing the entity
	 */
	Synchronizer.prototype.entity = function(content) {
		this.world.importEntitiesFromJSON([JSON.parse(content)]);
	};

	Synchronizer.prototype.mouseDown = function(x, y) {
		this.socket.emit('mousedown', JSON.stringify({x: x, y: y}));
	};


	window.Synchronizer = new Synchronizer();


})();