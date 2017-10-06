var PIXI = window.PIXI;

var STATES_ICONS = {
  world: "globe",
  shape: "cube",
  ground: "window-minimize"
};


var Editor = function() {

  /* INIT */

  this.init = function() {
    this.container = document.getElementById('canvas-container');
    this.renderer = new PIXI.CanvasRenderer(this.container.offsetWidth, this.container.offsetHeight, {antialias: true, backgroundColor: /*"FFFFFF"*/"25449D"});

    this.stage = new PIXI.Container();
    this.stage.position.x = this.renderer.width / 2;
    this.stage.position.y = this.renderer.height / 2;

    this.states = [
      "world",
      "shape",
      "ground"
    ];
    this.setState('shape'); // TODO

    this.originGraphics = new PIXI.Graphics();
    this.originGraphics.lineStyle(2, "0x91989E");
    this.originGraphics.beginFill();
    this.originGraphics.moveTo(0, -10);
    this.originGraphics.lineTo(0, 10);
    this.originGraphics.moveTo(-10, 0);
    this.originGraphics.lineTo(10, 0);
    this.originGraphics.endFill();
    this.stage.addChild(this.originGraphics);

    this.lastCursorPos = {
      x: null,
      y: null
    };
    this.lastAbsCursorPos = {
      x: null,
      y: null
    };
    this.lastCursorMove = {
      x: null,
      y: null
    };
    this.click = false;
    this.grabbing = false;
    this.drawing = true;
    this.processingVelocity = false;
    this.lastClickTS = new Date();
    this.lastCursorMoveTS = new Date('1970-01-01');
    this.keys = {};

    this.loopMargin = 10
    this.doubleClick = 200;

    this.initEvents();
    this.initState();
    this.execAllStates('init');

    this.container.appendChild(this.renderer.view);

    this.startPassiveRender();
  };

  this.initEvents = function() {
    var editor = this;

    window.addEventListener('resize', function(e) {
      editor.renderer.resize(editor.container.offsetWidth, editor.container.offsetHeight);
      if (editor.run === 2) editor.render();
    });

    this.renderer.view.addEventListener('mousemove', function(e) {
      if (editor.grabbing) {
        absCursorPos = editor.getCursorPos(e, true);
        editor.moveCameraFromCursor(absCursorPos);
      }
      var cursorPos = editor.getCursorPos(e, true);
      editor.lastCursorMove = {
        x: cursorPos.x - editor.lastAbsCursorPos.x,
        y: cursorPos.y - editor.lastAbsCursorPos.y
      };
      editor.lastCursorMoveTS = new Date();
      editor.updateCursorPos(e);
      if (editor.run === 2) editor.render();
    });

    this.renderer.view.addEventListener('mousedown', function(e) {
      if (e.button == 0) {
        editor.click = true;
        editor.stopVelocity();
        if (editor.keys['SPACE']) editor.grabbing = true;
        editor.updateCursorPos(e);
        editor.updateCursorShape();
        if (editor.run === 2) editor.render();
      }
    });

    this.renderer.view.addEventListener('mouseup', function(e) {
      if (e.button == 0) {
        if ((new Date()) - editor.lastClickTS < editor.doubleClick) e.doubleClick = true;
        editor.execCurrentState('mouseup', e);
        if (editor.grabbing == true) {
          var cursorPos = editor.getCursorPos(e, true);
          var lastMoveDelayCoeff = Math.max(0, (editor.lastCursorMoveTS - new Date()) / 200 + 1);
          editor.startVelocity({
            x: editor.lastCursorMove.x * lastMoveDelayCoeff,
            y: editor.lastCursorMove.y * lastMoveDelayCoeff
          });
        }
        editor.click = false;
        editor.grabbing = false;
        editor.lastClickTS = new Date();
        editor.updateCursorPos(e);
        editor.updateCursorShape();
        if (editor.run === 2) editor.render();
      }
    });

    this.renderer.view.addEventListener('mousewheel', function(e) {
      var zoom = 1 - e.deltaY / 1000;
      var prevCursorPos = editor.getCursorPos(e);
      editor.zoom(zoom);
      editor.updateCursorPos(e);
      var stagePosition = editor.getStagePosition();
      editor.moveCameraRelative({
        x: (editor.lastCursorPos.x - prevCursorPos.x) * editor.stage.scale.x,
        y: (editor.lastCursorPos.y - prevCursorPos.y) * editor.stage.scale.y
      });
      if (editor.run === 2) editor.render();
    });

    window.addEventListener('keydown', function(e) {
      var key = KEYS[e.keyCode];
      editor.keys[key] = true;
      editor.updateCursorShape();
      if (editor.run === 2) editor.render();
    });

    window.addEventListener('keyup', function(e) {
      var key = KEYS[e.keyCode];
      editor.keys[key] = false;
      editor.updateCursorShape();
      if (editor.run === 2) editor.render();
    });
  };


  /* CURSOR */

  this.getCursorPos = function(e, absolute) {
    relative = absolute ? 0 : 1;
    return {
      x: (absolute ? 1 : 1 / this.stage.scale.x) * (((e.offsetX !== undefined) ? e.offsetX : e.layerX - e.target.offsetLeft) - this.stage.position.x * relative),
      y: (absolute ? 1 : 1 / this.stage.scale.y) * (((e.offsetY !== undefined) ? e.offsetY : e.layerY - e.target.offsetTop) - this.stage.position.y * relative)
    };
  };

  this.updateCursorPos = function(e) {
    this.lastCursorPos = this.getCursorPos(e);
    this.lastAbsCursorPos = this.getCursorPos(e, true);
  };

  this.updateCursorShape = function() {
    if (this.grabbing) {
      if (!this.renderer.view.classList.contains('grabbing')) this.renderer.view.classList.add('grabbing');
    }
    else if (this.keys['SPACE']) {
      this.renderer.view.classList.remove('grabbing');
      if (!this.renderer.view.classList.contains('grab')) this.renderer.view.classList.add('grab');
    }
    else  {
      this.renderer.view.classList.remove('grab');
      this.renderer.view.classList.remove('grabbing');
    }
  };


  /* CAMERA */

  this.moveCameraFromCursor = function(absCursorPos) {
    this.stage.position.x += absCursorPos.x - this.lastAbsCursorPos.x;
    this.stage.position.y += absCursorPos.y - this.lastAbsCursorPos.y;
  };

  this.moveCameraRelative = function(move) {
    this.stage.position.x += move.x;
    this.stage.position.y += move.y;
  };

  this.setStagePosition = function(pos) {
    this.stage.position.x = pos.x + this.renderer.width / 2;
    this.stage.position.y = pos.y + this.renderer.height / 2;
  };

  this.getStagePosition = function(pos) {
    return {
      x: this.stage.position.x - this.renderer.width / 2,
      y: this.stage.position.y - this.renderer.height / 2
    };
  };

  this.zoom = function(zoom) {
    var zoomFactor = Math.min(Math.max(this.stage.scale.x * zoom, 0.3), 15);
    this.stage.scale.x = zoomFactor;
    this.stage.scale.y = zoomFactor;
  };

  this.getLineSize = function(lineSize) {
    return (lineSize || 1) * 1.5 / ((this.stage.scale.x + 1) / 2);
  };

  this.startVelocity = function(vel) {
    this.processingVelocity = true;
    this.processVelocity(vel);
  };

  this.processVelocity = function(vel) {
    if (this.processingVelocity) {
      this.moveCameraRelative(vel);
      var editor = this;
      if (this.distance(vel) < 0.3) {
        this.processingVelocity = false;
      }
      else {
        requestAnimationFrame(function() {
          editor.processVelocity({
            x: vel.x * 0.8,
            y: vel.y * 0.8
          });
        });
      }
    }
  };

  this.stopVelocity = function() {
    this.processingVelocity = false;
  };


  /* STATE */

  this.initState = function() {
    var editor = this;
    var stateButtonModel = document.querySelector('#state-changer ul li');
    var ul = document.querySelector('#state-changer ul');
    ul.removeChild(stateButtonModel);
    for (var id in this.states) {
      var stateButton = stateButtonModel.cloneNode(true);
      stateButton.getElementsByTagName('i')[0].classList.add('fa-' + STATES_ICONS[this.states[id]]);
      stateButton.setAttribute('data-state', this.states[id]);
      stateButton.addEventListener('click', function() {
        editor.setState(this.getAttribute('data-state'));
      });
      ul.appendChild(stateButton);
    }
  };

  this.getState = function() {
    return this.states[this.state];
  };

  this.setState = function(state) {
    var index = this.states.indexOf(state);
    if (index != -1) {
      if (this.state != index) {
        if (this.state) this.execCurrentState('off');
        document.querySelector('#state-changer a i').classList.remove('fa-' + STATES_ICONS[this.states[this.state]]);
        this.state = index;
        document.querySelector('#state-changer a i').classList.add('fa-' + STATES_ICONS[this.states[index]]);
        // this.triggerEvent('stateChange', state);
        this.execCurrentState('on');
      }
    }
    else console.warn('Unknown state: ' + state);
  };

  this.execState = function(state, functionName) {
    var args = Array.prototype.slice.call(arguments, 2);
    state = state.substr(0, 1).toUpperCase() + state.substr(1);
    var func = this['state' + state + '_' + functionName];
    if (!func) console.warn('Unknown function name "' + 'state' + state + '_' + functionName + '"');
    else this['state' + state + '_' + functionName].apply(this, args);
  };

  this.execCurrentState = function(functionName) {
    this.execState.apply(this, [this.states[this.state]].concat(Array.prototype.slice.call(arguments)));
  };

  this.execAllStates = function(functionName/*, [...] */) {
    var args = Array.prototype.slice.call(arguments, 1);
    args.unshift(functionName);
    for (var id in this.states) {
      this.execState.apply(this, [this.states[id]].concat(args));
    }
  };

  this.getStateButton = function(state, action, child) {
    return document.querySelector('#canvas-container .state-buttons-container .' + state + ' [data-action=' + action + ']' + (child ? ' ' + child : ''));
  };


  /* STATE: SHAPE */

  this.stateShape_init = function() {
    this.stateShape_image = null;
    this.stateShape_points = [];
    this.stateShape_graphics = new PIXI.Graphics();
    this.stage.addChild(this.stateShape_graphics);
    this.execState('shape', 'initEvents');
  };

  this.stateShape_initEvents = function() {
    var editor = this;

    this.getStateButton('shape', 'reset').addEventListener('click', function(e) {
      var button = this;
      editor.execCurrentState('reset');
    });

    this.getStateButton('shape', 'import').addEventListener('click', function(e) {
      this.classList.remove('animate');
      editor.getStateButton('shape', 'import', 'input[type=file]').click();
    });

    this.getStateButton('shape', 'import', 'input[type=file]').addEventListener('change', function(e) {
      var file = e.target.files[0];
      var fileReader = new FileReader();

      fileReader.onload = function(e) {
        if (editor.stateShape_image) editor.stage.removeChild(editor.stateShape_image);
        editor.stateShape_image = PIXI.Sprite.fromImage(e.target.result);
        editor.stateShape_image.alpha = 0.5;
        editor.stateShape_image.anchor.x = editor.stateShape_image.width / 2;
        editor.stateShape_image.anchor.y = editor.stateShape_image.height / 2;
        editor.stage.addChild(editor.stateShape_image);
      };

      fileReader.readAsDataURL(file);
    });

/*    this.getStateButton('shape', 'export').addEventListener('click', function(e) {
      this.classList.remove('animate');
      var that = this;
      setTimeout(function() { that.classList.add('animate'); });
      var textarea = document.querySelector('#export-container textarea');
      var container = document.getElementById('export-container');
      textarea.innerHTML = JSON.stringify(editor.stateShape_points, null, 2);
      container.classList.remove('hide');
    });*/

    /*document.getElementById('export-container').addEventListener('click', function(e) {
      if (e.target === this) this.classList.add('hide');
    });

    document.querySelector('#export-container textarea').addEventListener('click', function(e) {
      this.select();
    });*/
  };

  this.stateShape_on = function() {
    this.render();
  };

  this.stateShape_off = function() {
    this.stateShape_graphics.clear();
  };

  this.stateShape_mouseup = function(e) {
    if (!this.keys['SPACE'] && !this.grabbing && this.drawing && this.click) {
      if (e.doubleClick && this.stateShape_points.length > 0) {
        this.execCurrentState('addPoint', {
          x: this.stateShape_points[0].x,
          y: this.stateShape_points[0].y
        });
      }
      else {
        this.execCurrentState('addPoint', this.getCursorPos(e));
        if (this.run === 2) this.render();
      }
    }
  };

  this.stateShape_addPoint = function(point) {
    if (this.stateShape_points[0] && this.distance(point, this.stateShape_points[0]) < this.loopMargin / this.stage.scale.x) {
      this.drawing = false;
    }
    else this.stateShape_points.push(point);
  };

  this.stateShape_reset = function() {
    if (this.stateShape_points.length > 0) this.stateShape_points = [];
    else if (editor.stateShape_image) editor.stage.removeChild(editor.stateShape_image);
    this.setStagePosition({
      x: 0,
      y: 0
    });
    this.stage.scale.x = 1;
    this.stage.scale.y = 1;
    this.drawing = true;
    if (editor.run === 2) editor.render();
  };

  this.stateShape_render = function() {
    if (this.stateShape_graphics) {
      this.stateShape_graphics.clear();
      if (this.stateShape_points.length > 0) {
        this.stateShape_graphics.lineStyle(this.getLineSize(), "0xEFEFEF");
        this.stateShape_graphics.beginFill("0x5D77C2");
        this.stateShape_graphics.moveTo(this.stateShape_points[0].x, this.stateShape_points[0].y);
        for (var i = 1 ; i < this.stateShape_points.length ; i++) {
          this.stateShape_graphics.lineTo(this.stateShape_points[i].x, this.stateShape_points[i].y);
        }
        if (this.drawing) {
          if (!this.grabbing && !this.keys['SPACE'] && this.lastCursorPos.x !== null && this.lastCursorPos.y !== null) {
            if (this.stateShape_points.length > 1 && this.distance(this.lastCursorPos, this.stateShape_points[0]) < this.loopMargin / this.stage.scale.x) {
              this.stateShape_graphics.lineTo(this.stateShape_points[0].x, this.stateShape_points[0].y);
            }
            else {
              this.stateShape_graphics.lineTo(this.lastCursorPos.x, this.lastCursorPos.y);
              this.stateShape_graphics.lineStyle(this.getLineSize(), "0x5D77C2");
              this.stateShape_graphics.lineTo(this.stateShape_points[0].x, this.stateShape_points[0].y);
            }
          }
          else {
            this.stateShape_graphics.lineStyle(this.getLineSize(), "0x5D77C2");
            this.stateShape_graphics.lineTo(this.stateShape_points[0].x, this.stateShape_points[0].y);
          }
          this.stateShape_graphics.endFill();
          this.stateShape_graphics.drawCircle(this.stateShape_points[0].x, this.stateShape_points[0].y, this.loopMargin / this.stage.scale.x);
        }
        this.stateShape_graphics.endFill();
      }
    }
  };


  /* RENDER */

  this.startActiveRender = function() {
    this.run = 1;
    this.render();
  };

  this.startPassiveRender = function() {
    this.run = 2;
    this.render();
  };

  this.stopRender = function() {
    this.run = 0;
  };

  this.render = function() {
    if (this.run !== 0) {
      var editor = this;

      this.execCurrentState('render');


      this.renderer.render(this.stage);
      if (this.run === 1) requestAnimationFrame(function() { editor.render(); });
    }
  };


  /* UTILS */

  this.distance = function(pA, pB) {
    if (pB) return Math.sqrt((pB.x - pA.x) * (pB.x - pA.x) + (pB.y - pA.y) * (pB.y - pA.y));
    else return Math.sqrt((pA.x) * (pA.x) + (pA.y) * (pA.y));
  };

  this.init();

};

window.editor = new Editor();





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
