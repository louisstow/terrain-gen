var Map = new Spineless.Event();
Map._map = {};
Map._regions = {};

var points = [];
var regionOwner = {};
var players = {
	0: "rgb(255,71,71)",
	1: "rgb(224,71,255)",
	2: "rgb(71,139,255)",
	3: "rgb(71,255,84)",
	4: "rgb(255,240,71)"
};

var numPlayers = 5;
var lloydChangeFlag = false;

var directions = [
	[ 0,-1], // UP
	[ 0, 1], // DOWN
	[-1, 0], // LEFT
	[ 1, 0], // RIGHT
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

function surroundingConnected (x, y, fn) {
	for (var i = 0; i < 4; ++i) {
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
	
	surroundingConnected(x, y, function (nx, ny) {
		found = true;
		return false;
	});

	return found;
}

function randomColor () {
	var r = clamp(0, 255, Math.random()) | 0;
	var g = clamp(0, 255, Math.random()) | 0;
	var b = clamp(0, 255, Math.random()) | 0;
	return "rgb(" + r + "," + g + "," + b + ")";
}

Map.render = function () {
	context.fillStyle = "rgb(180, 230, 255)";
	context.fillRect(0, 0, canvas.width, canvas.height);

	for (var key in Map._regions) {
		var pos = key.split(",");
		var regions = Map._regions[key];

		var color = players[regionOwner[key]];
		context.fillStyle = color;

		for (var i = 0; i < regions.length; ++i) {
			var pos2 = regions[i].split(",");
			context.fillRect(pos2[0] * BLOCK, pos2[1] * BLOCK, BLOCK, BLOCK);
		}

		context.fillStyle = "rgba(0, 0, 0, 0.2)";
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
 

// initial points generator
Map.generatePoints = function () {
	var keys = Object.keys(Map._map);

	for (var r = 0; r < 30; r++) {
		var idx = Math.random() * keys.length | 0;
		var point = keys[idx];

		// try again
		do {
			point = keys[idx++];
			
			if (!point) {
				idx = 0;
				point = keys[idx];
			}
		} while (!distanceFromPoints(points, point, 3));

		points.push(point);
	}

	return points;
};

function floodFill (startPoints) {
	var queue = [];
	var cost_so_far = {};
	var seed = {};

	for (var i = 0; i < startPoints.length; ++i) {
		var s = startPoints[i];

		queue.push(s);
		cost_so_far[s] = 0;
		seed[s] = s;
	}

	while (queue.length) {
		var current = queue.shift();
		var pos = current.split(",");

		surroundingConnected(+pos[0], +pos[1], function (nx, ny, next) {
			if (!(next in cost_so_far)) {
				queue.push(next);
				cost_so_far[next] = cost_so_far[current] + 1;
				seed[next] = seed[current];
			}
		});
	}

	return seed;
}

// use voroni to choose regions
Map.generateRegions = function () {
	Map._regions = {};
	var seeds = floodFill(points);

	for (var key in seeds) {
		var region = seeds[key];

		if (!Map._regions[region])
			Map._regions[region] = [];

		Map._regions[region].push(key);		
	}
};

function boundingBox (start) {
	var list = Map._regions[start];

	var minX =  Infinity;
	var minY =  Infinity;
	var maxX = -Infinity;
	var maxY = -Infinity;

	for (var i = 0; i < list.length; ++i) {
		var pos = list[i].split(",");
		pos[0] = +pos[0];
		pos[1] = +pos[1];

		if (pos[0] < minX)
			minX = pos[0];

		if (pos[0] > maxX)
			maxX = pos[0];

		if (pos[1] < minY)
			minY = pos[1];

		if (pos[1] > maxY)
			maxY = pos[1];
	}

	return {
		x0: minX,
		y0: minY,
		x1: maxX,
		y1: maxY
	};
}

Map.lloydRelaxation = function () {
	var newPoints = [];
	var newOwners = {};

	for (var key in Map._regions) {
		var b = boundingBox(key);
		var centerX = (b.x1 - b.x0) / 2 + b.x0 | 0;
		var centerY = (b.y1 - b.y0) / 2 + b.y0 | 0;
		var newKey = centerX + "," + centerY;

		if (!Map._map[newKey]) {
			surrounding(centerX, centerY, function (nx, ny) {
				centerX = nx;
				centerY = ny;
				newKey = centerX + "," + centerY;
				return false;
			});
		}

		if (newKey != key) { 
			console.log(newKey, key)
			lloydChangeFlag = true;
		}

		newOwners[newKey] = regionOwner[key];
		newPoints.push(newKey);
	}

	points = newPoints;
	regionOwner = newOwners;
};

Map.iterate = function () {
	Map.lloydRelaxation();
	Map.generateRegions();
	Map.render();
};

Map.animate = function () {
	setTimeout(function tick () {
		Map.iterate();
		console.log("iterate");

		if (lloydChangeFlag) {
			lloydChangeFlag = false;
			setTimeout(tick, 200);
		}
	}, 200);
};

Map.init = function () {
	for (var key in Map._map) {
		var pos = key.split(",");
		if (!hasNeighbour(+pos[0], +pos[1])) {
			delete Map._map[key];
		}
	}

	Map.generatePoints();
	Map.generateRegions();

	var start = 0;
	for (var key in Map._regions) {
		regionOwner[key] = start;
		start = (start + 1) % numPlayers;
	}
};
