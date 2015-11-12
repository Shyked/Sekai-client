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







// Chatbox

var chatboxInput;
var chatbox;
var chatboxMessages;

window.newOnload(function() {
    chatboxInput = document.getElementById('chatboxInput');
    chatbox = document.getElementById('chatbox');
    chatboxMessages = document.getElementById('chatboxMessages');

    chatboxInput.onfocus = function() {
        chatbox.setAttribute("data-focus","true");
        chatboxMessages.displayMessages(false);
        if (chatboxInput.lastMessage == undefined) chatboxInput.lastMessage = "";
    };

    chatboxInput.onblur = function() {
        chatbox.setAttribute("data-focus","");
        chatboxMessages.displayMessages(1);
    };

    chatboxInput.send = function() {
        var text = this.value;
        this.lastMessage = text;
        this.value = "";
        chatboxMessages.displayMessages(1000);
        this.blur();
        return text;
    };

    chatboxInput.enter = function() {
    	if (chatbox.getAttribute("data-focus") == "true") {
    		if (chatboxInput.value.length > 0) return chatboxInput.send();
    		else chatboxInput.blur();
    	}
    	else {
    		chatboxInput.focus();
    	}
    };

    chatboxMessages.addMessage = function(msg,nickname,color,type) {
        if (nickname == "") nickname = "Anonymous";
        var msgDOM = document.createElement("div");
        var nicknameDOM = document.createElement("span");
        msgDOM.className = "message";
        nicknameDOM.className = "nickname";
        nicknameDOM.style.color = "rgb(" + color.r + "," + color.g + "," + color.b + ")";
        if (type == 0) nicknameDOM.innerHTML = "[" + nickname + "]";
        else if (type == 1) nicknameDOM.innerHTML = "&lt;" + nickname + "&gt;";
        else if (type == 2) nicknameDOM.innerHTML = nickname;
        msgDOM.innerHTML = nicknameDOM.outerHTML + msg.escapeHtml();
        this.appendChild(msgDOM);
        if (this.children.length > 8) this.removeChild(this.children[0]);
        this.displayMessages(Math.min(6000 + msg.length*100,13000));
    };

    chatboxMessages.displayMessages = function(hideTimeout) {
        chatbox.className = "displayMsg";
        this.style.display = "block";
        if (this.hideTimeout) clearTimeout(this.hideTimeout);
        if (hideTimeout) {
            if (chatbox.getAttribute("data-focus") != "true") this.hideTimeout = setTimeout(function(){chatbox.className="hideMsg";},hideTimeout);
        }
    };

    chatboxMessages.onanimationended = function() {
        if (chatbox.className == "hideMsg") {
            this.style.display = "none";
        }
    };

    chatboxMessages.addEventListener("animationend", chatboxMessages.onanimationended);
    chatboxMessages.addEventListener("WebkitAnimationEnd", chatboxMessages.onanimationended);
});