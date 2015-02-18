var Map = new Spineless.Event();
Map._map = {};
Map._regions = {};

var points = [];
var regionOwner = {};
var regionDice = {};

var numPlayers = 5;
var lloydChangeFlag = false;

var edges = {};
var selectedRegion = null;
var attackRegion = null;

var currentPlayer = 0;
var currentTurn = -1;

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

var playerOrder = [0,1,2,3,4];

var ais = {};
for (var i = 1; i < numPlayers; ++i) {
	ais[i] = new AI({player: i});
}

var inputAvailable = false;

Input.on("touch", function (x, y, key) {
	var region = Map.regionByTile(key);
	var owner = regionOwner[region];
	var n = regionDice[region];

	console.log(region, owner)

	if (!region || (selectedRegion && region === selectedRegion)) {
		selectedRegion = null;
		attackRegion = null;
	} else if (selectedRegion) {
		if (owner === currentPlayer) {
			if (n > 1) selectedRegion = region;
		} else if (Map.isConnected(selectedRegion, region)) {
			attackRegion = region;

			attack(selectedRegion, attackRegion, currentPlayer);
			selectedRegion = null;
			attackRegion = null;
		}
	} else {
		if (owner === currentPlayer && n > 1) {
			selectedRegion = region;
		}
	}

	Map.render();
});

Input.on("endTurn", function () {
	console.log("END TURN");
	if (inputAvailable)
		turn();
});

function turn () {
	var player;

	if (currentTurn !== -1) {
		// distribute dice
		player = playerOrder[currentTurn];
		distributeDice(player);
	}

	currentTurn = (currentTurn + 1) % numPlayers;
	player = playerOrder[currentTurn];

	console.log(currentPlayer, player);
	if (player === currentPlayer) {
		// enable controls again
		inputAvailable = true;
	} else {
		// disable controls
		inputAvailable = true;
		ais[player].think(turn);
	}
}

function attack (from, to, player) {
	var n = regionDice[from];
	var m = regionDice[to];

	var score1 = 0;
	var score2 = 0;

	for (var i = 0; i < n; ++i) {
		score1 += clamp(1, 7, Math.random()) | 0;
	}

	for (var i = 0; i < m; ++i) {
		score2 += clamp(1, 7, Math.random()) | 0;
	}

	console.log(n, "vs", m, score1, score2)
	if (score1 > score2) {
		regionOwner[to] = player;
		regionDice[to] = n - 1;
		regionDice[from] = 1;
	} else {
		regionDice[from] = 1;
	}

	Map.render();
}

function randomize (a, b) {
	return Math.round(clamp(-1, 2, Math.random()));
}

function distributeDice (player) {
	var regions = Map.regionsByPlayer(player);
	var total = 0;

	var visited = {};
	
	// count connected regions
	for (var i = 0; i < regions.length; ++i) {
		for (var j = 0; j < regions.length; ++j) {
			var key1 = regions[i] + "," + regions[j];
			var key2 = regions[j] + "," + regions[i];
			
			if (visited[key1] || visited[key2])
				continue;

			visited[key1] = true;
			visited[key2] = true;

			if (Map.isConnected(regions[i], regions[j])) {
				total++;
				break;
			}
		}
	}

	for (var i = 0; i < regions.length; ++i) {
		var dice = regionDice[regions[i]];
		if (dice === 8) {
			total -= 2;
		}
	}

	for (var i = 0; i < total; ++i) {
		var index = Math.random() * regions.length | 0;
		var region = regions[index];
		var dice = regionDice[region];
		
		if (dice !== 8)
			regionDice[region]++;
	}

	console.log("TOTL", total);
	Map.render();
}

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

function surroundingConnectedAll (x, y, fn) {
	for (var i = 0; i < 4; ++i) {
		var key = [
			x + directions[i][0],
			y + directions[i][1]
		];

		var k = key.join(",");

		var ret = fn(key[0], key[1], k);
		if (ret === false) return ret;
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

function translate (moveBy, pos) {
	var x = moveBy[0] + parseInt(pos[0], 10);
	var y = moveBy[1] + parseInt(pos[1], 10);
	return x + "," + y;
}

function drawRegion (key, regions, highlight) {
	var owner = regionOwner[key];
	var color = COLORS[owner];
	var bcolor = BORDER_COLORS[owner];

	for (var i = 0; i < regions.length; ++i) {
		var pos2 = regions[i].split(",");
		context.fillStyle = color;
		context.fillRect(pos2[0] * BLOCK, pos2[1] * BLOCK, BLOCK, BLOCK);

		var up = translate(directions[0], pos2);
		var down = translate(directions[1], pos2);
		var left = translate(directions[2], pos2);
		var right = translate(directions[3], pos2);

		context.fillStyle = bcolor;
		if (highlight) {
			context.globalAlpha = 0.3;
			context.fillStyle = "white";
			context.fillRect(pos2[0] * BLOCK, pos2[1] * BLOCK, BLOCK, BLOCK);
			context.globalAlpha = 1;
			context.fillStyle = "black";
		}

		if (!Map._map[up] || regions.indexOf(up) == -1) {
			context.fillRect(pos2[0] * BLOCK, pos2[1] * BLOCK - H_BORDER, BLOCK, BORDER);
		}

		if (!Map._map[down] || regions.indexOf(down) == -1) {
			context.fillRect(pos2[0] * BLOCK, pos2[1] * BLOCK + BLOCK - H_BORDER, BLOCK, BORDER);
		}

		if (!Map._map[left] || regions.indexOf(left) == -1) {
			context.fillRect(pos2[0] * BLOCK - H_BORDER, pos2[1] * BLOCK, BORDER, BLOCK);
		}
		
		if (!Map._map[right] || regions.indexOf(right) == -1) {
			context.fillRect(pos2[0] * BLOCK + BLOCK - H_BORDER, pos2[1] * BLOCK, BORDER, BLOCK);
		}
	}
};

Map.render = function () {
	// context.fillStyle = "rgb(180, 230, 255)";
	context.clearRect(-BLOCK, -BLOCK, canvas.width, canvas.height);
	// canvas.width = canvas.width;

	for (var key in Map._regions) {
		var regions = Map._regions[key];

		if (selectedRegion !== key && attackRegion !== key) {
			drawRegion(key, regions, false);
		}
	}

	if (selectedRegion) {
		drawRegion(selectedRegion, Map._regions[selectedRegion], true);
	}

	for (var key in Map._regions) {
		var pos = key.split(",");
		pos[0] = +pos[0];
		pos[1] = +pos[1];
		
		renderDice(key, pos);
	}
};

function renderDice (key, pos) {
	var x = pos[0] * BLOCK + 10;
	var y = pos[1] * BLOCK + 10;
	var n = regionDice[key];

	for (var i = 0; i < n; ++i) {
		var ny = y - ((i % 4) * 7);
		var nx = x;

		if (i > 3) {
			nx = x - 30;
		}

		var color = BORDER_COLORS[regionOwner[key]];
		var coinImage = coins[regionOwner[key]];
		context.shadowColor = color;
		context.shadowBlur = 10;
		context.drawImage(coinImage, nx, ny);
		context.shadowBlur = 0;
	}
}

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

Map.regionByTile = function (pos) {
	if (Map._regions[pos]) return pos;

	for (var r in Map._regions) {
		if (Map._regions[r].indexOf(pos) != -1)
			return r;
	}

	return false;
};

Map.regionsByPlayer = function (player) {
	var list = [];

	for (var key in regionOwner) {
		if (regionOwner[key] == player)
			list.push(key);
	}

	return list;
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
	Map.calculateEdges();
	Map.render();
};

Map.animate = function () {
	var frame = 0;
	var FPS = 1000 / 60;

	setTimeout(function tick () {
		Map.iterate();
		frame++;

		if (lloydChangeFlag && frame < 15) {
			lloydChangeFlag = false;
			setTimeout(tick, FPS);
		} else {
			Map.generateDice();
			Map.render();

			turn();
		}
	}, FPS);
};

Map.isConnected = function (pos1, pos2) {
	return edges[pos1 + "-" + pos2] || edges[pos2 + "-" + pos1];
};

Map.calculateEdges = function () {
	edges = {};

	for (var key in Map._regions) {
		var list = Map._regions[key];
		var local_edges = {};

		for (var i = 0; i < list.length; ++i) {
			var pos = list[i].split(",");
			pos[0] = +pos[0];			
			pos[1] = +pos[1];			

			surroundingConnected(pos[0], pos[1], function (nx, ny, next) {
				if (list.indexOf(next) == -1) {
					var region = Map.regionByTile(next);
					local_edges[region] = 1;
				}
			});
		}

		if (!Object.keys(local_edges).length) {
			console.log("NO EDGES", key);
			for (i = 0; i < list.length; ++i) {
				delete Map._map[list[i]];
			}

			delete Map._regions[key];
			delete regionOwner[key];
		}

		for (var k in local_edges) {
			edges[k + "-" + key] = true;
		}
	}
};

Map.generateDice = function () {
	for (var key in Map._regions) {
		regionDice[key] = clamp(2,5,Math.random()) | 0;
	}
}

Map.init = function () {
	for (var key in Map._map) {
		var pos = key.split(",");
		if (!hasNeighbour(+pos[0], +pos[1])) {
			delete Map._map[key];
		}
	}

	Map.generatePoints();
	Map.generateRegions();
	Map.calculateEdges();

	var start = 0;
	for (var key in Map._regions) {
		regionOwner[key] = start;
		start = (start + 1) % numPlayers;
	}

	playerOrder.sort(randomize);
};
