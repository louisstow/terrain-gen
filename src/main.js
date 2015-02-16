function clamp (min, max, n) {
	return n * (max - min) + min;
}

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

canvas.width = WIDTH;
canvas.height = HEIGHT;

Terrain.setCenter(GRID_WIDTH / 2, GRID_HEIGHT / 2);
Terrain.setEdge(EDGE);

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