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