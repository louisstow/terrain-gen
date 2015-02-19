var Players = Spineless.View.extend({
	template: "players",
	map: {},

	select: function (n) {
		console.log(n);
		for (var key in this.map) {
			console.log(key)
			this.map[key].set("selected", n == key);
		}
	}
});

var Player = Spineless.View.extend({
	defaults: {
		regions: 0,
		color: "",
		selected: false
	},

	template: [
		{tag: "img", id: "icon"},
		{tag: "span", id: "label"}
	],

	render: function () {
		if (this.model.regions == 0) {
			return this.removeFromParent();
		}

		console.log(this.model.selected)
		if (this.model.selected) {
			this.container.classList.add("selected");
		} else {
			this.container.classList.remove("selected");
		}

		this.setText(this.label, this.model.regions);
		this.icon.src = "coin-" + this.model.color + ".png";
	}
});