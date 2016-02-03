(function() {



    var REFRESH_INTERVAL = 200; // ms



    var FileLoader = function() {

        this.files = {};

        this.initEvents();

        this.currentProgress = null;

        this.refreshInterval = null;

    };



    FileLoader.prototype.initEvents = function() {
        this.events = {
            "refreshProgress": [],
            "filesLoaded": []
        };
    };



    FileLoader.prototype.unload = function() {
        this.files = {};
        this.currentProgress = null;
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
        this.initEvents();
    };


    FileLoader.prototype.loadWorld = function(worldId) {
        var fileLoader = this;
        ajax("getWorldFiles", {"world": worldId}, function(files) {
            for (var id in files.audio) {
                var audio = new Audio();
                audio.load(files.audio[id]);
                fileLoader.files[files.audio[id]] = audio;
            }
            for (var id in files.images) {
                var image = new Image();
                image.load(files.images[id]);
                fileLoader.files[files.images[id]] = image;
            }
            fileLoader.startInterval();
        });
    };


    FileLoader.prototype.refreshProgress = function() {
        var current = 0;
        var total = 0;
        for (var id in this.files) {
            total++;
            current += this.files[id].completed;
        }
        this.currentProgress = (total == 0) ? 1 : current / total;
        if (this.currentProgress == 1) {
            this.filesLoaded();
        }
        else this.triggerEvent("refreshProgress", this.currentProgress);
        return this.currentProgress;
    };

    FileLoader.prototype.startInterval = function() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshProgress();
        var fileLoader = this;
        this.refreshInterval = setInterval(function() { fileLoader.refreshProgress(); }, REFRESH_INTERVAL);
    };


    FileLoader.prototype.filesLoaded = function() {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
        this.triggerEvent("filesLoaded", null);
        this.initEvents();
    };








    /**
     * triggerEvent()
     * Triggers an event with the parameters this and result
     */
    FileLoader.prototype.triggerEvent = function(event, result) {
        for (var id in this.events[event]) {
            this.events[event][id](this, result);
        }
    };

    /**
     * addEventListener()
     * Adds a new event listener
     */
    FileLoader.prototype.addEventListener = function(event, func) {
        this.events[event].push(func);
    };








    window.FileLoader = new FileLoader();






    // http://stackoverflow.com/questions/14218607/javascript-loading-progress-of-an-image
    var load = function(url) {
        var that = this;
        var xmlHTTP = new XMLHttpRequest();
        xmlHTTP.open('GET', url,true);
        xmlHTTP.responseType = 'arraybuffer';
        xmlHTTP.onload = function(e) {
            var blob = new Blob([this.response]);
            that.src = window.URL.createObjectURL(blob);
        };
        xmlHTTP.onprogress = function(e) {
            that.completed = parseInt(e.loaded / e.total);
        };
        xmlHTTP.onloadstart = function() {
            that.completed = 0;
        };
        xmlHTTP.send();
    };


    Image.prototype.load = load;

    Image.prototype.completed = 0; // 0 ~ 1


    Audio.prototype.load = load;

    Audio.prototype.completed = 0; // 0 ~ 1



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