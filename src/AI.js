var AI = Spineless.Event.extend({
	init: function (opts) {
		AI.super(this, "init", arguments);
		this.player = opts.player;
	},

	getRegions: function () {
		return Map.regionsByPlayer(this.player);
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
		var me = this;

		for (var i = 0; i < regions.length; ++i) {
			var r = regions[i];
			var myDice = regionDice[r];
			if (myDice === 1) continue;

			var neighbors = this.getNeighbors(r);
			neighbors.sort(randomize);
			
			for (var n = 0; n < neighbors.length; ++n) {
				var enemy = neighbors[n];
				var dice = regionDice[enemy];
				
				if (myDice >= dice) {
					selectedRegion = r;
					Map.render();

					setTimeout(function () {
						attackRegion = enemy;
						Map.render();

						setTimeout(function () {
							attack(r, enemy, me.player);
							selectedRegion = null;
							attackRegion = null;
							Map.render();

							setTimeout(function () {
								me.think(next);
							}, QUICK);
						}, SLOW);
					}, QUICK);

					return;
				}
			}
		}

		if (next)
			next();
	}
});