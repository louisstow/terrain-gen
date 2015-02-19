var Input = new Spineless.Event();

canvas.addEventListener("click", function (e) {
	var translatedX = ((e.clientX - frame.offsetLeft) - BLOCK) + window.scrollX;
	var translatedY = ((e.clientY - frame.offsetTop) - BLOCK) + window.scrollY;

	var gridX = Math.floor(translatedX / BLOCK);
	var gridY = Math.floor(translatedY / BLOCK);
	
	Input.emit("touch", gridX, gridY, gridX+","+gridY);
}, false);

var endTurn = document.getElementById("end");
endTurn.addEventListener("click", function () {
	Input.emit("endTurn");
});