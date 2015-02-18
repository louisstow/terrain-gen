var AI = Spineless.Event.extend({
	init: function (opts) {
		AI.super(this, "init", arguments);
		this.player = opts.player;
	},

	getRegions: function () {
		var list = [];

		for (var key in regionOwner) {
			if (regionOwner[key] == this.player)
				list.push(key);
		}

		return list;
	},

	getNeighbors: function (region) {
		var list = []

		for (var key in edges) {
			var regions = key.split("-");
			if (regions[0] === region) {
				if (regionOwner[regions[1]] !== this.player) {
					list.push(regions[1]);
				}
			} else if (regions[1] === region) {
				if (regionOwner[regions[0]] !== this.player) {
					list.push(regions[0]);
				}
			}
		}

		return list;
	},

	think: function (next) {
		var regions = this.getRegions();
		for (var i = 0; i < regions.length; ++i) {
			var r = regions[i];
			var myDice = regionDice[r];
			if (myDice === 1) continue;

			var neighbors = this.getNeighbors(r);
			
			for (var n = 0; n < neighbors.length; ++n) {
				var enemy = neighbors[n];
				var dice = regionDice[enemy];
				
				if (myDice >= dice) {
					attack(r, enemy, this.player);
					return this.think(next);
				}
			}
		}

		if (next)
			next();
	}
});