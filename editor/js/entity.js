(function() {


  // Namespace Entity
  var Entity = {};


  Entity.Generic = function() {};





  /* CONSTRUCTORS */

  Entity.new = function(p) {
    return new Entity[p.type](p);
  };

  Entity.Generic.prototype.init = function(p) {

    // Bugy argument protetion
    if (p.options) delete p.options.angle;

    /*if (p.angle) {
      if (!p.state) p.state = {};
      if (!p.state.angular) p.state.angular = {};
      p.state.angular.pos = p.angle;
    }*/

    var id = p.id,
      x = p.x,
      y = p.y,
      angle = p.angle,
      texture = p.texture,
      textureScale = p.textureScale,
      textureOffset = p.textureOffset,
      zIndex = p.zIndex,
      style = p.style,
      rotation = p.rotation,
      options = p.options,
      gamemode = p.gamemode;

    this.id = parseInt(id);

    this.x = x || 0;
    this.y = y || 0;
    this.angle = angle || 0;

    this.texture = texture || null;
    this.textureScale = textureScale || {x: 1, y: 1};
    this.textureOffset = textureOffset || {x: 0, y: 0};
    this.textureCenter = {x: 0, y: 0};

    this.options = options || {};

    this.zIndex = zIndex || 0;

    this.style = style;

    this.rotation = (rotation != undefined) ? rotation : true;
    p.rotation = undefined;

    // Gamemode specifics params (associative array)
    this.gamemode = gamemode;
  };




  Entity.Rectangle = function(p) {
    this.init(p);
    this.type = 'Rectangle';

    this.width = p.width;
    this.height = p.height;
  };

  Entity.Circle = function(p) {
    this.init(p);
    this.type = 'Circle';

    this.radius = p.radius;
  };

  Entity.Polygon = function(p) {
    this.init(p);
    this.type = 'Polygon';

    if (parent) {
      var com = centerOfMass2(vertices);
      this.x += com.x;
      this.y += com.y;
      for (var i in vertices) {
        vertices[i].x -= com.x;
        vertices[i].y -= com.y;
      }
    }
    this.vertices = p.vertices;

    var aabb = this.getAabb();
    this.textureCenter = {
      x: aabb.x - this.x,
      y: aabb.y - this.y,
    };
  };

  Entity.Compound = function(p) {
    this.init(p);

    this.children = p.children || {};
    this.hiddenChildren = p.hiddenChildren || false;

    this.type = 'Compound';

    this.childrenCount = 0;
    var child;
    for (var i in children) {
      children[i].parent = this;
      child = Entity.new(children[i]);
      this.children[this.childrenCount] = child;
    }
    this.hiddenChildren = hiddenChildren;

    var aabb = this.getAabb();
    this.textureCenter = {
      x: aabb.x - this.x,
      y: aabb.y - this.y,
    };

    this.refreshCom();
  };

  Entity.Concave = function(p) {
    this.init(p);
    this.type = 'Concave';

    if (parent) {
      var com = centerOfMass2(vertices);
      this.x += com.x;
      this.y += com.y;
      for (var i in vertices) {
        vertices[i].x -= com.x;
        vertices[i].y -= com.y;
      }
    }
    this.vertices = p.vertices;

    var aabb = this.getAabb();
    this.textureCenter = {
      x: aabb.x - this.x,
      y: aabb.y - this.y,
    };
  };


  Entity.Decoration = function(p) {
    this.init(p);

    this.type = 'Decoration';
  };



  Entity.Rectangle.prototype = new Entity.Generic();
  Entity.Circle.prototype = new Entity.Generic();
  Entity.Polygon.prototype = new Entity.Generic();
  Entity.Compound.prototype = new Entity.Generic();
  Entity.Concave.prototype = new Entity.Generic();
  Entity.Decoration.prototype = new Entity.Generic();






  /* GETTERS */

  Entity.Generic.prototype.getPos = function() {
    if (this.type) {
      return {
        x: this.x,
        y: this.y
      };
    }
    else return {x: 0, y: 0};
  };

  Entity.Generic.prototype.getAngle = function() {
    if (this.type) return this.angle;
    else return 0;
  };

  Entity.Polygon.prototype.getAabb = function() {
    var aabb = {
      x: {
        min: null,
        max: null
      },
      y: {
        min: null,
        max: null
      }
    };
    for (var id in this.vertices) {
      if (this.vertices[id].x < aabb.x.min || aabb.x.min == null) aabb.x.min = this.vertices[id].x;
      if (this.vertices[id].x > aabb.x.max || aabb.x.max == null) aabb.x.max = this.vertices[id].x;
      if (this.vertices[id].y < aabb.y.min || aabb.y.min == null) aabb.y.min = this.vertices[id].y;
      if (this.vertices[id].y > aabb.y.max || aabb.y.max == null) aabb.y.max = this.vertices[id].y;
    }
    return {
      x: aabb.x.min + this.x,
      y: aabb.y.min + this.y,
      hw: (aabb.x.max - aabb.x.min) + this.x,
      hh: (aabb.y.max - aabb.y.min) + this.y
    };
  };


  /* SETTERS */

  Entity.Generic.prototype.setPos = function(pos) {
    if (this.type) {
      this.x = pos.x;
      this.y = pos.y;
    }
  };

  Entity.Generic.prototype.setAngle = function(angle) {
    if (this.type) {
      this.angle = angle;
    }
  };




  /* IMPORT */

  Entity.import = function(entityJSON) {
    if (!Entity[entityJSON.type]) throw "The entity type " + entityJSON.type + " does not exist";
    return new Entity[entityJSON.type](entityJSON);
  };






  /* EXPORT */

  Entity.Generic.prototype.export = function() {
    var entityJSON = {};

    for (var id in this) {
      if (typeof this[id] != 'function') entityJSON[id] = this[id];
    }
    return entityJSON;
  };




  /* UPDATE */

  Entity.Generic.prototype.update = function(entityJSON) {
    var entity = this;
    this.x = entityJSON.x;
    this.y = entityJSON.y;
    this.angle = entityJSON.angle;

    for (var id in entityJSON) {
      if (id != 'type') entity[id] = entityJSON[id];
    }
  }






  /* TYPE SPECIFIC */


  Entity.Compound.prototype.addChild = function(child) {
    child = Entity.new(child);

    child.id = this.childrenCount;
    this.children[this.childrenCount] = child;
    this.physicsBody.addChild(child.physicsBody);
    this.childrenCount++;
  };

  Entity.Compound.prototype.refreshCom = function() {
    this.com = {
      x: 0,
      y: 0
    };
  };

  Entity.Compound.prototype.export = function() {
    var entityJSON = {};
    entityJSON.children = [];
    for (var id in this.children) {
      entityJSON.children.push(this.children[id].export());
    }

    for (var id in this) {
      if (typeof id != 'function' && id != 'physicsBody' && id != 'smoothTeleport' && id != 'children') entityJSON[id] = this[id];
    }
    entityJSON.x = this.x;
    entityJSON.y = this.y;
    return entityJSON;
  };

  Entity.Compound.prototype.update = function(entityJSON) {
    var entity = this;
    var deltaAdd = {
      x: 0,
      y: 0
    }
    if (entity.smoothTeleport.progress != 1) {
      deltaAdd.x = entity.smoothTeleport.positionDelta.x * entity.smoothTeleport.progressSinus;
      deltaAdd.y = entity.smoothTeleport.positionDelta.y * entity.smoothTeleport.progressSinus;
    }
    entity.smoothTeleport = {
      angleDelta: entity.physicsBody.state.angular.pos - entityJSON.state.angular.pos,
      positionDelta: {
        x: entity.physicsBody.state.pos.x - entityJSON.state.pos.x + deltaAdd.x,
        y: entity.physicsBody.state.pos.y - entityJSON.state.pos.y + deltaAdd.y
      },
      progress: 0,
      progressSinus: 1
    };

    //entityJSON.children = [];
    for (var id in entityJSON.children) {
      if (entity.children[id]) entity.children[id].update(entityJSON.children[id]);
      else {
        entity.children[id] = Entity.import(entityJSON.children[id]);
        entity.entitiesCount++;
      }
    }

    for (var id in entityJSON) {
      if (id != 'type' && id != 'smoothTeleport' && id != 'state' && id != 'sleep' && id != 'children') entity[id] = entityJSON[id];
    }

    if (typeof entityJSON.sleep == "boolean") this.physicsBody.sleep(entityJSON.sleep);

    if (entityJSON.state) Entity.copyState(entityJSON.state, entity.physicsBody.state);
    if (entityJSON.options) Entity.copyOptions(entityJSON.options, entity.physicsBody);

    this.physicsBody.recalc();
  }





  /* UTIL */

  Entity.copyState = function(from, to, init) {
    if (init) {
      to.pos = {};
      to.vel = {};
      to.acc = {};
      to.angular = {};
      to.old = {
        pos: {},
        vel: {},
        acc: {},
        angular: {}
      };
    }
    if (from.pos !== undefined) {
      if (from.pos.x !== undefined) to.pos.x = from.pos.x;
      if (from.pos.y !== undefined) to.pos.y = from.pos.y;
    }
    if (from.vel !== undefined) {
      if (from.vel.x !== undefined) to.vel.x = from.vel.x;
      if (from.vel.y !== undefined) to.vel.y = from.vel.y;
    }
    if (from.acc !== undefined) {
      if (from.acc.x !== undefined) to.acc.x = from.acc.x;
      if (from.acc.y !== undefined) to.acc.y = from.acc.y;
    }
    if (from.angular !== undefined) {
      if (from.angular.pos !== undefined) to.angular.pos = from.angular.pos;
      if (from.angular.vel !== undefined) to.angular.vel = from.angular.vel;
      if (from.angular.acc !== undefined) to.angular.acc = from.angular.acc;
    }
    if (from.old !== undefined) {
      to.old.pos.x = from.old.pos.x;
      to.old.pos.y = from.old.pos.y;
      to.old.vel.x = from.old.vel.x;
      to.old.vel.y = from.old.vel.y;
      to.old.acc.x = from.old.acc.x;
      to.old.acc.y = from.old.acc.y;
      to.old.angular.pos = from.old.angular.pos;
      to.old.angular.vel = from.old.angular.vel;
      to.old.angular.acc = from.old.angular.acc;
    }
  };

  Entity.copyOptions = function(from, to, init) {
    if (init) {
      
    }
    from.treatment && (to.treatment = from.treatment);
    from.restitution && (to.restitution = from.restitution);
    from.asleep && (to.asleep = from.asleep);
    from.sleepIdleTime && (to.sleepIdleTime = from.sleepIdleTime);
    from.cof && (to.cof = from.cof);
    from.mass && (to.mass = from.mass);
  };










  // CommonJS module
  if (typeof exports !== 'undefined') {
      exports.Entity = Entity;
  }

  // browser
  if (typeof window === 'object' && typeof window.document === 'object') {
      window.Entity = Entity;
  }





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

  function toXY(angleDist) {
    var x = Math.cos(angleDist.angle) * angleDist.dist;
    var y = Math.sin(angleDist.angle) * angleDist.dist;
    return {
      x: x,
      y: y
    };
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

  function centerOfMass(vertices) {
    var total = {
      mass: 0,
      x: 0,
      y: 0
    };
    for (var id in vertices) {
      total.mass += 1;
      total.x += vertices[id].x;
      total.y += vertices[id].y;
    }
    return {
      x: total.x / total.mass,
      y: total.y / total.mass
    };
  }

  function centerOfMass2(v) {
    var area = 0;
    var com = { x: 0, y: 0 };
    for (var i in v) {
      i = parseInt(i);
      var secondFactor = v[i].x * v[(i + 1) % v.length].y
                         -
                         v[(i + 1) % v.length].x * v[i].y;
      area += secondFactor;
      com.x += (v[i].x + v[(i + 1) % v.length].x)
                *
                secondFactor;
      com.y += (v[i].y + v[(i + 1) % v.length].y)
                *
                secondFactor;
    }
    area /= 2;
    com.x /= 6 * area;
    com.y /= 6 * area;
    return com;
  }



})();
