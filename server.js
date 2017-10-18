const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const colors = require("colors");
const cors = require("cors");
const fs = require("fs");

// const pdfkit = require("pdfkit");
// const pdf2json = require("pdf2json");
// const json2pdf = require("pdf2json");

const mongojs = require("mongojs");
const db = mongojs('lulu:lulu@localhost:16666/appContacts', ['bills']); // se poveze v MongoDB
const portHttpServer = 12534;

let app = null; // const?
let httpServer = null; // const?

initHttpWebsocketServer();

/* -------------------- HTTP STREZNIK -------------------- */
function initHttpWebsocketServer() {
    app = express();
    // app.use(bodyParser.urlencoded({extended: true}));
    app.use(cors()); // preden nastavis port!
    app.use(bodyParser.json());
	app.set("port", portHttpServer);
	app.use(express.static(path.join(__dirname, "dist"))); // najdi angular aplikacijo v mapi dist, zgenerirani ob 'ng build'
    httpServer = app.listen(app.get("port"), "0.0.0.0", logHttpServer); // 0.0.0.0 -> poslusaj na vseh interface-ih (za hosting na public IP-ju)
	httpServer.on("connection", httpConnection);
    httpServer.on("error", httpError);
    setRoutes();
}

function setRoutes() {
    app.get("/bills", getBills);
    app.get("/bills/:id", getBill);
    app.post("/bills", postBill);
    app.put("/bills/:id", putBill);
    app.delete("/bills/:id", deleteBill);
}

function getBills(request, response) {
    console.log("GET request");
    db.bills.find((err, docs) => {
        response.json(docs);
        logMongoSelect();
    });
}

function getBill(request, response) {
    console.log("GET request");
    var id = request.params.id;
    db.bills.findOne({
        _id: mongojs.ObjectId(id)
    }, (err, doc) => {
        response.json(doc);
        logMongoSelect();
    });
}

function postBill(request, response) {
    console.log("POST request");
    db.bills.insert(request.body, (err, doc) => {
        response.json(doc);
        logMongoInsert();
    });
}

function putBill(request, response) {
    console.log("PUT request");
    var id = request.params.id;

    console.log(request.body, id);
    // var celObjekt = request.body;

    db.bills.findAndModify({
        query: {
            _id: mongojs.ObjectId(id)
        },
        update: {
            $set: {
                drzava: "Alžiristan"
            }
        },
        new: true
    }, (err, doc) => {
        response.json(doc);
        logMongoUpdate();
    });
}

function deleteBill(request, response) {
    console.log("DELETE request");
    var id = req.params.id;
    db.bills.remove({
        _id: mongojs.ObjectId(id)
    }, (err, doc) => {
        response.json(doc);
        logMongoDelete();
    });
}

/* -------------------- LOG FUNCTIONS -------------------- */
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
function logMongoSelect() {
    console.log(".find v Mongo uspesen".cyan);
}
function logMongoInsert() {
    console.log(".insert v Mongo uspesen".cyan);
}
function logMongoUpdate() {
    console.log(".findAndModify v Mongo uspesen".cyan);
}
function logMongoDelete() {
    console.log(".remove v Mongo uspesen".cyan);
}


// function ustvariPdf() {
//     var doc = new pdfkit();
//     doc.pipe(fs.createWriteStream("./server/file.pdf"));
    
//     // Set a title and pass the X and Y coordinates
//     doc.fontSize(15).text('Wally Gator !', 50, 50);
//     // Set the paragraph width and align direction
//     doc.text('Wally Gator is a swinging alligator in the swamp. He\'s the greatest percolator when he really starts to romp. There has never been a greater operator in the swamp. See ya later, Wally Gator.', {
//         width: 410,
//         align: 'left'
//     });

//     doc.end();


//     let pdfParser = new pdf2json();

//     pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
//     pdfParser.on("pdfParser_dataReady", pdfData => {
//         fs.writeFile("./server/test.json", JSON.stringify(pdfData));
//     });
 
//     pdfParser.loadPDF("./server/Racun.pdf");


//     let pdfParser2 = new pdf2json(this, 1);

//     pdfParser2.on("pdfParser_dataError", errData => console.error(errData.parserError) );
//     pdfParser2.on("pdfParser_dataReady", pdfData => {
//         fs.writeFile("./server/nov.txt", pdfParser.getRawTextContent());
//     });

//     pdfParser2.load("./server/test.json");
//     let jsonToPdf = new json2pdf();
//     console.log(json2pdf);

//     var pdf = require('html-pdf');
//     var html = fs.readFileSync('./server/Racun4.html', 'utf8');
//     var options = { format: 'Letter' };
     
//     pdf.create(html, options).toFile('./server/businesscard.pdf', function(err, res) {
//       if (err) return console.log(err);
//       console.log(res); // { filename: '/app/businesscard.pdf' }
//     });
// }