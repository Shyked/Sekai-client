(function() {


    var Interface = function() {
        this.interfaces = [
            "nickname",
            "loading"
        ];
        this.current = null;

        window.addEventListener('load', function(e) {
            var inputs = document.getElementsByTagName('input');
            for (var i = 0 ; i < inputs.length ; i++) {
                inputs[i].addEventListener('change', function(e) {
                    if (this.value.length > 0) this.setAttribute('data-empty', 'false');
                    else this.setAttribute('data-empty', 'true');
                });
            }
        });

    };


    /* PUBLIC */

    Interface.prototype.display = function(interface, options) {
        var blackContainer = document.getElementById('blackContainer');

        if (interface === null || interface === undefined) {
            removeClass(blackContainer, "show");
        }
        else {
            addClass(blackContainer, "show");
        }

        this._show(interface);

        var that = this;

        // onnickname, onlogin, onsignup, onguest
        if (interface == "nickname") {
            document.getElementById('nicknameInput').focus();
            document.getElementById('nicknameNicknameForm').onsubmit = function(e) {
                options["onnickname"](this);
                e.preventDefault(); return false;
            };
            document.getElementById('nicknameSignUpForm').onsubmit = function(e) {
                options["onsignup"](this);
                e.preventDefault(); return false;
            };
            document.getElementById('nicknameLogInForm').onsubmit = function(e) {
                options["onlogin"](this);
                e.preventDefault(); return false;  
            };
            document.getElementById('nicknameBackForm').onsubmit = function(e) {
                options["onsignup"](this);
                e.preventDefault(); return false;
            };
            var guestButtons = document.getElementsByClassName('nicknameStartButton');
            for (var i = 0 ; i < guestButtons.length ; i++) {
                guestButtons[i].onclick = function(e) {
                    options["onstart"](this);
                    e.preventDefault();
                    return false;
                };
            }
            var resetButtons = document.getElementsByClassName('nicknameResetButton');
            for (var i = 0 ; i < resetButtons.length ; i++) {
                resetButtons[i].onclick = function(e) {
                    that.modify('nickname', { state: 'nickname' });
                    e.preventDefault();
                    return false;
                };
            }
        }
    };

    Interface.prototype.modify = function(interface, params) {
        switch (interface) {
            case 'nickname':
                if (params['state']) {
                    document.getElementById('nicknameContainer').setAttribute('data-last-state', document.getElementById('nicknameContainer').getAttribute('data-state'));
                    if (params['nickname']) {
                        document.getElementById('nicknameInput').value = params['nickname'];
                    }
                    if (params['state'] == 'nickname') {
                        document.getElementById('nicknameInput').readOnly = false;
                        document.getElementById('nicknameInput').focus();
                    }
                    else {
                        document.getElementById('nicknameInput').readOnly = true;
                    }
                    if (params['state'] == 'signup') {
                        document.getElementById('nicknameCaptionSignUp').innerHTML = document.getElementById('nicknameNicknameForm').nickname.value;
                        document.getElementById('nicknameSignUpForm').email.focus();
                    }
                    else if (params['state'] == 'login') {
                        document.getElementById('nicknameCaptionLogIn').innerHTML = document.getElementById('nicknameNicknameForm').nickname.value;
                        document.getElementById('nicknameLogInForm').password.focus();
                    }
                    else if (params['state'] == 'back') {
                        if (params['nickname']) {
                            document.getElementById('nicknameNicknameForm').nickname.value = params['nickname'];
                            document.getElementById('nicknameNicknameForm').nickname.setAttribute('data-empty', false);
                            document.getElementById('nicknameCaptionBack').innerHTML = params['nickname'];
                            document.getElementById('nicknameBackForm').nickname.value = params['nickname'];
                            document.getElementById('nicknameBackForm').nickname.setAttribute('data-empty', false);
                            document.getElementById('nicknameBackForm').email.focus();
                        }
                        if (params['trigger']) {
                            if (params['trigger'] == "ALREADY_EXISTS") {
                                document.getElementById('nicknameBackForm').nickname.focus();
                                document.getElementById('nicknameBackForm').nickname.setAttribute('data-invalid', 'true');
                                document.getElementById('nicknameBackForm').nickname.setAttribute('data-already-taken', 'true');
                            }
                        }
                    }
                    else if (params['state'] == 'backConnected') {
                        document.getElementById('nicknameCaptionBackConnected').innerHTML = params['nickname'];
                        document.getElementById('nicknameBackConnected').getElementsByClassName('nicknameStartButton')[0].focus();
                    }
                    document.getElementById('nicknameContainer').setAttribute('data-state', params['state']);
                }
                break;
            case 'loading':
                if (params["progress"] < 1) document.getElementById('loadingBar').style.transitionDuration = "";
                document.getElementById('loadingBar').style.width = Math.floor(params["progress"] * 100) + "%";
                if (!document.getElementById('loadingBar').style.tansitionDuration) document.getElementById('loadingBar').style.transitionDuration = "200ms";
                break;
        }
    };



    /* PRIVATE */

    Interface.prototype._show = function(interface) {
        this.current = interface;
        for (var id in this.interfaces) {
            if (this.interfaces[id] == interface) addClass(interface + 'Container', "show");
            else removeClass(this.interfaces[id] + 'Container', "show");
        }
    };





    /* UTILS */

    var addClass = function(target, klass) {
        var element;
        if (typeof target == "string") element = document.getElementById(target);
        else element = target;
        removeClass(element, klass);
        element.className += ' ' + klass;
    };

    var removeClass = function(target, klass) {
        var element;
        if (typeof target == "string") element = document.getElementById(target);
        else element = target;
        var reg = new RegExp('(\\s|^)' + klass + '(\\s|$)');
        element.className = element.className.replace(reg, ' ');
    };

    var hasClass = function(target, klass) {
        var element;
        if (typeof target == "string") element = document.getElementById(target);
        else element = target;
        var reg = new RegExp('(\\s|^)' + klass + '(\\s|$)');
        return reg.test(element.className);
    };



    window.Interface = new Interface();

})();
