var Terrain = new Spineless.Event();

var center_x = null;
var center_y = null;
var edge = null;

Terrain.setCenter = function (x, y) {
	center_x = x;
	center_y = y;
};

Terrain.setEdge = function (e) {
	edge = e;
};

Terrain.getPosition = function (x, y) {
	var diff_x = Math.abs(x - center_x);
	var diff_y = Math.abs(y - center_y);
	var distance = Math.sqrt((diff_x * diff_x) + (diff_y * diff_y)) * clamp(.8, 1.2, Math.random());

	var normalized = distance / (center_x * 1.3);
	if (Math.abs(normalized - edge) < .05)
		normalized = Math.random();

	if (normalized > edge)
		return 1;

	var perlin = PerlinNoise.noise(x / 5, y / 5, 1);
	if (normalized < .5 && perlin > .55)
		normalized = 1;
	
	return normalized;
};