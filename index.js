var view; // Just for debugging in the console
var synchronizer;
var NODE_URL;
if (/^(?!local)(?!home)(\w*\.)*shyked\.fr/.test(document.location.hostname)) {
	NODE_URL = "ws://sekai-server.herokuapp.com/"
}
else if (document.location.hostname == "") {
  NODE_URL = "ws://localhost:4433"
}
else NODE_URL = document.location.hostname + ":4433";


(function() {


    view = new window.View();
    synchronizer = new Synchronizer(view);




})();
