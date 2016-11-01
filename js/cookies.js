(function() {

  window.cookie = function(name, value) {
    name = "sekai_" + name;

    // Parsing
    var cookiesStr = document.cookie.split(";");
    var cookies = {};
    for (var id in cookiesStr) {
      var cookie = cookiesStr[id].split("=");
      cookies[cookie[0].replace(/^ /, "")] = cookie[1];
    }

    // Replacing
    if (value !== undefined) {
      document.cookie = name + "=" + value;
      cookies[name] = value;
    }

    return cookies[name];
  }

})();
