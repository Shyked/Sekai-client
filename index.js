var view; // Just for debugging in the console
var synchronizer;
var NODE_URL =
//"http://shyked.fr.to:4433";
//"http://lenovo-pc:4433";
document.location.hostname + ":4433";


(function() {


    view = new window.View(null);
    synchronizer = new Synchronizer(view);




})();