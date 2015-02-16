var Map = new Spineless.Event();
Map._map = {};
Map._regions = [];

var directions = [
	[ 0,-1], // UP
	[ 0, 1], // DOWN
	[-1, 0], // LEFT
	[ 0, 1], // RIGHT
	[-1,-1], // UP LEFT
	[-1, 1], // DOWN LEFT
	[ 1,-1], // UP RIGHT
	[ 1, 1]  // DOWN RIGHT
];

function surrounding (x, y, fn) {
	for (var i = 0; i < directions.length; ++i) {
		var key = [
			x + directions[i][0],
			y + directions[i][1]
		];

		var k = key.join(",");

		if (Map._map[k]) {
			var ret = fn(key[0], key[1], k);
			if (ret === false) return ret;
		}
	}
}

function hasNeighbour (x, y) {
	var found = false;
	
	surrounding(x, y, function (nx, ny) {
		found = true;
		return false;
	});

	return found;
}

Map.render = function () {
	context.fillStyle = "rgb(200, 200, 200)";
	context.fillRect(0, 0, canvas.width, canvas.height);

	var points = Map.generatePoints();

	for (var key in Map._map) {
		var pos = key.split(",");

		if (points.indexOf(key) !== -1) {
			context.fillStyle = "rgb(200, 20, 20)";
		} else {
			context.fillStyle = "rgb(100, 100, 100)";
		}

		context.fillRect(pos[0] * BLOCK, pos[1] * BLOCK, BLOCK, BLOCK);
	}
};

Map.set = function (x, y) {
	Map._map[x + "," + y] = 1;
};

function distanceFromPoints (points, pos, min) {
	var pos = pos.split(",");
	pos[0] = +pos[0];
	pos[1] = +pos[1];

	for (var i = 0; i < points.length; ++i) {
		var point = points[i].split(",");
		point[0] = +point[0];
		point[1] = +point[1];

		var diff_x = Math.abs(point[0] - pos[0]);
		var diff_y = Math.abs(point[1] - pos[1]);

		var distance = Math.sqrt((diff_x * diff_x) + (diff_y * diff_y));
		
		if (distance < min) {
			return false;
		}
	}

	return true;
}

Map.generatePoints = function () {
	var keys = Object.keys(Map._map);
	var points = [];

	for (var r = 0; r < 25; r++) {
		var idx = Math.random() * keys.length | 0;
		var point = keys[idx];

		// try again
		do {
			point = keys[idx++];
			
			if (!point) {
				idx = Math.random() * keys.length | 0;
				point = keys[idx];
			}
		} while (!distanceFromPoints(points, point, 3));

		points.push(point);
	}

	return points;
};

Map.init = function () {
	for (var key in Map._map) {
		var pos = key.split(",");
		if (!hasNeighbour(+pos[0], +pos[1])) {
			delete Map._map[key];
		}
	}
};