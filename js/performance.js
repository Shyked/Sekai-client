(function() {




	var Performance = function() {

		this.variable = null;

	};

	Performance.prototype.linkVariable = function(variable) {
		this.variable = variable;
	};

	Performance.prototype.checkReferences = function(obj) {
		if (obj == undefined) obj = window;
		for (var id in obj) {
			if (obj[id] == this.variable) throw "Another reference ha been found.";
			try {
				if (typeof obj[id] == 'object') this.checkReferences(obj[id]);
			}
			catch(e) {
				console.log(e);
			}
		}
	};



	// browser
	if (typeof window === 'object' && typeof window.document === 'object') {
	    window.Performance = new Performance();
	}


})();