var Input = new Spineless.Event();

canvas.addEventListener("click", function (e) {
	var translatedX = e.clientX - canvas.offsetLeft;
	var translatedY = e.clientY - canvas.offsetTop;

	var gridX = Math.floor(translatedX / BLOCK);
	var gridY = Math.floor(translatedY / BLOCK);
	console.log(gridX, gridY);
	Input.emit("touch", gridX, gridY, gridX+","+gridY);
}, false);
