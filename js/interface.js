(function() {




    var Interface = function() {

    };


    Interface.prototype.display = function(interface, params) {
        var blackContainer = document.getElementById('blackContainer');

        if (interface == null) {
            blackContainer.style.display = "none";
        }
        else {
            blackContainer.style.display = "block";
        }

        // params[0] : onsubmit function
        if (interface == "nickname") {
            document.getElementById('nicknameContainer').style.display = "inline-block";
            document.getElementById('nicknameInput').focus();
            document.getElementById('nicknameForm').onsubmit = params[0];
        }
        else {
            document.getElementById('nicknameContainer').style.display = "none";
        }

        if (interface == "loading") {
            document.getElementById('loadingContainer').style.display = "inline-block";
        }
        else {
            document.getElementById('loadingContainer').style.display = "none";
        }
    };



    Interface.prototype.modify = function(what, params) {
        switch (what) {
            case "loading":
                if ((params[0] || params) < 1) document.getElementById('loadingBar').style.transitionDuration = "";
                document.getElementById('loadingBar').style.width = Math.floor((params[0] || params) * 100) + "%";
                if (!document.getElementById('loadingBar').style.tansitionDuration) document.getElementById('loadingBar').style.transitionDuration = "200ms";
                break;
        }
    };




    window.Interface = new Interface();

})();