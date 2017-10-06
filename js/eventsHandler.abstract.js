var EventsHandler = function() {
  this.events = {};
};

/**
 * triggerEvent()
 * Triggers an event with the parameters this and result
 */
EventsHandler.prototype.triggerEvent = function(event, result) {
  if (typeof this.events[event] === "undefined") this.events[event] = [];
  for (var id in this.events[event]) {
    this.events[event][id](this, result);
  }
};

/**
 * addEventListener()
 * Adds a new event listener
 */
EventsHandler.prototype.addEventListener = function(event, func) {
  if (typeof this.events[event] === "undefined") this.events[event] = [];
  this.events[event].push(func);
};
