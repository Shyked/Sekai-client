(function() {


  var Interface = function() {
    this.interfacesList = [
      "nickname",
      "loading",
      "reconnecting",
      "menu"
    ];
    this.current = null;

    this._initInterfacesFunctions();

    var that = this;
    window.addEventListener('load', function() { that._initInterfaces(); });

  };


  /* PUBLIC */

  Interface.prototype.display = function(interface, options) {
    var blackContainer = document.getElementById('blackContainer');

    if (interface === null || interface === undefined) {
      blackContainer.classList.remove('show');
    }
    else {
      blackContainer.classList.add('show');
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
    // onquit
    else if (interface == "menu") {
      this.modify(interface, {move: "down"});
      this.interfaces.menu.onquit = options["onquit"];
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
      case 'menu':
        if (params.players) {
          var playerList = document.getElementById('menuPlayerList');
          playerList.innerHTML = '';
          var div;
          for (var id in params.players) {
            div = document.createElement('div');
            div.className = "player";
            var imageContainer = document.createElement('div');
            imageContainer.className = 'imageContainer';
            var image = document.createElement('img');
            image.src = params.players[id].image;
            if (params.players[id].rotation) {
              div.classList.add('rotate');
              image.style.animationDelay = '-' + Math.floor(Math.random() * 2000) + 'ms';
              image.style.animationDuration = Math.floor(3000 + Math.random() * 2000) + 'ms';
            }
            var nickname = document.createElement('div');
            nickname.className = 'nickname';
            nickname.innerHTML = params.players[id].nickname;
            imageContainer.appendChild(image);
            div.appendChild(imageContainer);
            div.appendChild(nickname);
            playerList.appendChild(div);
          }
        }
        else if (params.move) {
          var currentIndex = null;
          var buttons = document.querySelectorAll('#menuButtons button');
          for (var i = 0 ; i < buttons.length ; i++) {
            if (buttons[i].classList.contains('focus')) currentIndex = i;
          }
          if (currentIndex == null) currentIndex = -1;
          if (params.move == "up") currentIndex--;
          else if (params.move == "down") currentIndex++;
          if (currentIndex < 0) currentIndex = buttons.length - 1;
          else if (currentIndex >= buttons.length) currentIndex = 0;
          buttons[currentIndex].focus();
        }
        break;
    }
  };


  Interface.prototype.keyDown = function(key) {
    switch (this.current) {
      case "menu":
        if (key == "DOWN") this.modify("menu", {move: "down"});
        else if (key == "UP") this.modify("menu", {move: "up"});
        else if (key == "ESCAPE") this.display(null);
        break;
    }
  };

  Interface.prototype.keyUp = function(key) {
    // body...
  };



  /* PRIVATE */

  Interface.prototype._initInterfaces = function() {
    var that = this;

    // Inputs
    var inputs = document.getElementsByTagName('input');
    for (var i = 0 ; i < inputs.length ; i++) {
      inputs[i].addEventListener('change', function(e) {
        if (this.value.length > 0) this.setAttribute('data-empty', 'false');
        else this.setAttribute('data-empty', 'true');
      });
    }

    // Menu
    var buttons = document.getElementById('menuButtons').getElementsByTagName('button');
    for (var i = 0 ; i < buttons.length ; i++) {
      buttons[i].addEventListener('mouseover', function() {
        this.focus();
      });
      buttons[i].addEventListener('focus', function() {
        if (!this.classList.contains('focus')) {
          this.classList.add('focus');
          var menuSelects = document.querySelectorAll('#menuButtons .menuSelect');
          var button = this;
          menuSelects.forEach(function(menuSelect) {
            menuSelect.style.top = "calc(" + button.offsetTop + "px + 0.5em)";
            menuSelect.style.left = "calc(" + button.offsetWidth + "px + 1em)";
          });
        }
      });
      buttons[i].addEventListener('blur', function() {
        this.classList.remove('focus');
      });
      buttons[i].addEventListener('click', function(e) { // Will be also triggered by pressing Enter
        that.interfaces.menu.validate(this);
      });
    }
    this.modify("menu", {move: "still"});
    window.addEventListener('resize', function() {
      if (that.current == "menu") that.modify("menu", {move: "still"});
    });
  };

  Interface.prototype._initInterfacesFunctions = function() {
    var that = this;
    this.interfaces = {
      menu: {
        validate: function(button) {
          console.trace();
          var currentIndex = null;
          var buttons = document.querySelectorAll('#menuButtons button');
          for (var i = 0 ; i < buttons.length ; i++) {
            if (button) {
              if (button == buttons[i]) currentIndex = i;
            }
            else {
              if (buttons[i].classList.contains('focus')) currentIndex = i;
            }
          }
          console.log(currentIndex);
          if (currentIndex == 0) that.display(null); // Resume
          else if (currentIndex == 1) {}
          else if (currentIndex == 2) this.onquit(); // Disconnect
        },
        onquit: function() {}
      }
    };
  };

  Interface.prototype._show = function(interface) {
    this.current = interface;
    var interfaceToShow = document.getElementById(interface + 'Container');
    for (var id in this.interfacesList) {
      if (this.interfacesList[id] == interface) interfaceToShow.classList.add('show');
      else {
        document.getElementById(this.interfacesList[id] + 'Container').classList.remove('show');
      }
    }
  };




  window.Interface = new Interface();

})();
