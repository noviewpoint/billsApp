const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const colors = require("colors");
const cors = require("cors");

let app = null; // const?

const portHttpServer = 12534;
let httpServer = null; // const?

initHttpWebsocketServer();

/* ---------- HTTP STREZNIK ---------- */
function initHttpWebsocketServer() {
	app = express();
	app.use(cors()); // preden nastavis port!
	app.set("port", portHttpServer);
	app.use(express.static(path.join(__dirname, "dist"))); // najdi angular aplikacijo v mapi dist, zgenerirani ob 'ng build'
	httpServer = app.listen(app.get("port"), "0.0.0.0", logHttpServer); // 0.0.0.0 -> poslusaj na vseh interface-ih (za hosting na public IP-ju)
	httpServer.on("connection", httpConnection);
	httpServer.on("error", httpError);
}

function logHttpServer() {
	console.log("HTTP server poslusa na portu %s".yellow, httpServer.address().port);
}
function httpConnection(request) {
	var localAddress = request.localAddress + ":" + request.localPort;
	console.log("Vzpostavljena HTTP povezava z '%s'".green, localAddress);
}
function httpError(error) {
	console.log("Napaka HTTP serverja: %s".red, error.message);
}