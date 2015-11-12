// Onload functions

var onload_functions = [];

window.newOnload = function(fct) {
    onload_functions.push(fct);
}

window.onload = function() {
    for (var id in onload_functions) {
        onload_functions[id]();
    }
}