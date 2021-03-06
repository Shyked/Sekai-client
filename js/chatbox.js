(function() {

var HISTORY_LENGTH = 40;

var EMOJIS_PATH = "./img/emojis/";

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
    111: "/"
};




var Chatbox = function() {

    // DOM

    this.chatbox = document.createElement('div');
    this.chatbox.id = "chatbox";
    this.chatbox.innerHTML =  '<div id="chatboxMessages"></div>'
                            + '<span class="preInput">&gt;</span>'
                            + '<input id="chatboxInput" type="text" value="" maxlength="300" />';

    document.body.appendChild(this.chatbox);

    this.chatboxInput = document.getElementById('chatboxInput');
    this.chatboxMessages = document.getElementById('chatboxMessages');


    // EVENTS

    var chatbox = this;
    this.chatbox.onmouseover = function() { chatbox.mouseOver(); };
    this.chatbox.onmouseout = function() { chatbox.mouseOut(); };
    this.chatboxInput.onfocus = function() { chatbox.onfocus(); };
    this.chatboxInput.onblur = function() { chatbox.onblur(); };
    this.chatboxMessages.onfocus = function() { console.log("r"); };
    this.chatboxInput.onkeydown = function(e) { return chatbox.onkeydown(e); };
    this.chatboxInput.onkeyup = function(e) { return chatbox.onkeyup(e); };
    this.chatboxMessages.onanimationended = function() { chatbox.hideChatbox(); };
    this.chatboxMessages.addEventListener("animationend", function() { chatbox.hideChatbox(); });
    this.chatboxMessages.addEventListener("WebkitAnimationEnd", function() { chatbox.hideChatbox(); });

    this.events = {
        "enter": [],
        "send": []
    };

    this.preventKeyRepeat = {};


    // VARS

    this.isMouseOver = false
    this.hideTimeout = null;
    this.focused = false;
    this.messageCount = 0;
    this.history = window.localStorage.history ? JSON.parse(window.localStorage.history) : [];
    this.historyPos = this.history.length;
    this.historyKeepLine = "";
    this.icons = {};

};

Chatbox.emojis = {
    "world": "svg",
    "left": "svg",
    "right": "svg",
    "smile": "png"
};

Chatbox.prototype.show = function() {
    this.chatbox.style.display = '';
};

Chatbox.prototype.hide = function() {
    this.chatbox.style.display = 'none';
};

Chatbox.prototype.mouseOver = function() {
    this.isMouseOver = true;
};

Chatbox.prototype.mouseOut = function() {
    /*this.isMouseOver = false;
    // console.log(this.focused);
    if (!this.focused) {
        this.onblur();
    }*/
};

Chatbox.prototype.focus = function() {
    this.chatboxInput.focus();
};

Chatbox.prototype.blur = function() {
    this.chatboxInput.blur();
};

Chatbox.prototype.onfocus = function() {
    this.chatbox.setAttribute("data-focus","true");
    this.focused = true;
    this.displayMessages(false);
};

Chatbox.prototype.onblur = function() {
    this.focused = false;
    //if (!this.isMouseOver) {
        this.chatbox.setAttribute("data-focus","");
        this.displayMessages(1);
    //}
};

Chatbox.prototype.onkeydown = function(e) {
    var key = KEYS[e.keyCode];
    if (!this.preventKeyRepeat[key]) {
        this.preventKeyRepeat[key] = true;

        if (key == "ENTER") {
            this.enter();
        }
        else if (key == "UP") {
            this.navHistory(-1);
            return false;
        }
        else if (key == "DOWN") {
            this.navHistory(1);
            return false;
        }

    }
};

Chatbox.prototype.onkeyup = function(e) {
    var key = KEYS[e.keyCode];
    this.preventKeyRepeat[key] = false;
};


Chatbox.prototype.send = function() {
    var text = this.chatboxInput.value;
    this.chatboxInput.value = "";
    this.displayMessages(1000);
    this.blur();

    // History
    this.history.push(text);
    if (this.history.length > HISTORY_LENGTH) this.history.splice(0, this.history.length - HISTORY_LENGTH);
    this.historyPos = this.history.length;

    window.localStorage.history = JSON.stringify(this.history);

    this.triggerEvent("send", text);
    return text;
};

Chatbox.prototype.enter = function() {
    if (this.focused) {
        if (this.chatboxInput.value.length > 0) return this.send();
        else this.blur();
    }
    else {
        this.focus();
    }
    return null;
};


Chatbox.prototype.addMessage = function(msg, nickname, color, type, style) {
    if (nickname == "" && type != 2) nickname = "Anonymous";


    var msgDOM = document.createElement("div");
    msgDOM.className = "message";
    if (type == 2) {
        msgDOM.className += " " + style;

        msgDOM.innerHTML = String(msg).escapeHtml();
    }
    else {
        var nicknameDOM = document.createElement("span");
        nicknameDOM.className = "nickname";
        nicknameDOM.style.color = "rgb(" + color.r + "," + color.g + "," + color.b + ")";
        nickname = String(nickname).escapeHtml();

        if (type == 0) nicknameDOM.innerHTML = "[" + nickname + "]";
        else if (type == 1) nicknameDOM.innerHTML = "&lt;" + nickname + "&gt;";

        msgDOM.innerHTML = nicknameDOM.outerHTML + String(msg).escapeHtml();
    }

    this.parseEmoji(msgDOM);

    this.chatboxMessages.appendChild(msgDOM);
    if (this.chatboxMessages.children.length > 8) this.chatboxMessages.removeChild(this.chatboxMessages.children[0]);
    this.displayMessages(Math.min(6000 + msg.length*100, 13000));
};

Chatbox.prototype.displayMessages = function(hideTimeout) {
    this.chatbox.className = "displayMsg";
    this.chatboxMessages.style.display = "block";
    this.chatboxMessages.style.height = "";
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    if (hideTimeout) {
        this.chatboxMessages.style.height = this.chatboxMessages.offsetHeight + "px";
        var that = this;
        if (!this.focused) this.hideTimeout = setTimeout(
            function(){
                that.chatboxMessages.style.height = "0px";
                that.chatbox.className = "hideMsg";
            }
        , hideTimeout);
    }
};


Chatbox.prototype.hideChatbox = function() {
    if (this.chatbox.className == "hideMsg") {
        this.chatboxMessages.style.display = "none";
    }
};



Chatbox.prototype.navHistory = function(direction) {
    if (this.historyPos == this.history.length) {
        this.historyKeepLine = this.chatboxInput.value;
    }

    var newHistoryPos = this.historyPos + direction;
    if (newHistoryPos < 0 || newHistoryPos > this.history.length) return;
    this.historyPos = newHistoryPos;

    if (this.historyPos == this.history.length) {
        this.chatboxInput.value = this.historyKeepLine;
    }
    else {
        this.chatboxInput.value = this.history[this.historyPos];
    }

    this.chatboxInput.selectionStart = this.chatboxInput.value.length;
    this.chatboxInput.selectionEnd = this.chatboxInput.value.length;

};


Chatbox.prototype.parseEmoji = function(msgDOM) {
    var msgEmojis = msgDOM.innerHTML.match(/:[^ ]+:/g);
    var requested = {};
    for (var id in msgEmojis) {
        var emoji = msgEmojis[id].replace(/:/g, '');
        if (Chatbox.emojis[emoji] == "svg") {
            msgDOM.innerHTML = msgDOM.innerHTML.replace(new RegExp(msgEmojis[id], 'g'), '<svg class="emoji emoji-' + emoji + '"></svg>');
            if (!requested[msgEmojis[id]]) {
                requested[msgEmojis[id]] = true;
                this.getIcon(emoji, function(svg, iconName) {
                    var svgs = msgDOM.getElementsByClassName('emoji-' + iconName);
                    var container = document.createElement('div');
                    container.innerHTML = svg;
                    for (var i = 0 ; i < svgs.length ; i++) {
                        var className = svgs[i].className
                        svgs[i].innerHTML = container.children[0].innerHTML;
                        svgs[i].setAttribute('viewBox', container.children[0].getAttribute('viewBox'));
                    }
                })
            }
        }
        else if (Chatbox.emojis[emoji] == "png") msgDOM.innerHTML = msgDOM.innerHTML.replace(new RegExp(msgEmojis[id], 'g'), '<img class="emoji emoji-' + emoji + '" src="' + EMOJIS_PATH + emoji + '.png" />')
    }
};

Chatbox.prototype.getIcon = function(iconName, callback) {
    if (this.icons[iconName]) callback(this.icons[iconName]);
    var chatbox = this;
    ajaxSvg(iconName, function(svg) {
        chatbox.icons[iconName] = svg;
        callback(svg, iconName);
    });
};


Chatbox.prototype.debug = function(msg) {
    this.addMessage(msg, "DEBUG", {r: 190, g: 190, b: 190}, 0, "");
};



/**
 * triggerEvent()
 * Triggers an event with the parameters this and result
 */
Chatbox.prototype.triggerEvent = function(event, result) {
    for (var id in this.events[event]) {
        this.events[event][id](this, result);
    }
};

/**
 * addEventListener()
 * Adds a new event listener
 */
Chatbox.prototype.addEventListener = function(event, func) {
    this.events[event].push(func);
};







window.Chatbox = new Chatbox();







// Lib

String.prototype.replaceAt=function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
}

String.prototype.escapeHtml = function() {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return this.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function ajaxSvg(icon, callback) {
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            callback(xmlhttp.responseText);
        }
    }
    xmlhttp.open("GET", EMOJIS_PATH + icon + ".svg", true);
    xmlhttp.send();
}

})();
