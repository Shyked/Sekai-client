var view; // Just for debugging in the console
var synchronizer;
var NODE_URL;
if (document.location.hostname == "shyked.fr") {
	NODE_URL = "ws://sekai-server.herokuapp.com/"
}
else NODE_URL = document.location.hostname + ":4433";


(function() {


    view = new window.View(null);
    synchronizer = new Synchronizer(view);




})();