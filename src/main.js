function clamp (min, max, n) {
	return n * (max - min) + min;
}

var coins = {};
var color_list = ["red", "purple", "blue", "green", "yellow"];
for (var i = 0; i < color_list.length; ++i) {
	var c = color_list[i];
	coins[i] = new Image();
	coins[i].src = "coin-" + c + ".png";
}

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var frame = document.getElementById("frame");
var overlay = document.getElementById("overlay");
var win = document.getElementById("win");
var lose = document.getElementById("lose");

canvas.width = WIDTH + BLOCK * 2;
canvas.height = HEIGHT + BLOCK * 2;
context.translate(BLOCK, BLOCK);

Terrain.setCenter(GRID_WIDTH / 2, GRID_HEIGHT / 2);

for (var x = 0; x < GRID_WIDTH; ++x) {
	for (var y = 0; y < GRID_HEIGHT; ++y) {
		var height = Terrain.getPosition(x, y);

		if (height < 1) {
			Map.set(x, y);
		}
	}
}

Map.init();
Map.render();
Map.animate();

var playerView = new Players();

for (var i = 0; i < playerOrder.length; ++i) {
	var player = playerOrder[i];
	var color = color_list[player];

	var regions = Map.regionsByPlayer(player);

	var p = new Player({
		color: color,
		regions: regions.length,
		id: player
	});

	playerView.addChild(p);
	playerView.map[player] = p;
}

document.getElementById("restart").onclick = function () {
	window.location.reload();
};