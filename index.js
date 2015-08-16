var view; // Just for debugging in the console
var NODE_URL = "http://shyked.fr.to:4433";

(function() {


    view = new window.View(null);
    Synchronizer.init(view);

    view.addEventListener('mouseleftdown', function(view, e) {
		var x = (e.offsetX != undefined) ? e.offsetX : e.layerX - e.target.offsetLeft;
		var y = (e.offsetY != undefined) ? e.offsetY : e.layerY - e.target.offsetTop;
    	var pos = view.removeOffset({x: x, y: y})
    	Synchronizer.mouseDown(pos.x, pos.y);
    });



})();