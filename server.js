const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const colors = require("colors");
const cors = require("cors");
const fs = require("fs");

// const PDFDocument = require("pdfkit");
// const pdf2json = require("pdf2json");
// const json2pdf = require("pdf2json");
const pdf = require("html-pdf");

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
    app.get("/pdfs-dl/:id", getPdfDownload);
    app.get("/pdfs-print/:id", getPdfPrint);
}

function getBills(request, response) {
    console.log("GET request");
    db.bills.find().sort({znesek: 1}, (err, docs) => {
        console.log(docs);
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
    var celObjekt = request.body;

    db.bills.findOne({
        _id: mongojs.ObjectId(id)
    }, (err, doc) => {
        db.bills.update(doc, celObjekt, (err, doc) => {
            response.json(doc);
            logMongoUpdate();
        });
    });
}

function deleteBill(request, response) {
    console.log("DELETE request");
    var id = request.params.id;
    db.bills.remove({
        _id: mongojs.ObjectId(id)
    }, (err, doc) => {
        response.json(doc);
        logMongoDelete();
    });
}

function getPdfDownload(request, response) {
    console.log("GET request");
    var id = request.params.id;

    if (!id) {
        throw "No element specified through url";
        return;
    }

    db.bills.findOne({
        _id: mongojs.ObjectId(id)
    }, (err, doc) => {
        console.log(doc);
        sendPdfFromDiskDownload(response, doc);
    });
}

function getPdfPrint(request, response) {
    console.log("GET request");
    var id = request.params.id;

    if (!id) {
        throw "No element specified through url";
        return;
    }

    db.bills.findOne({
        _id: mongojs.ObjectId(id)
    }, (err, doc) => {
        console.log(doc);
        sendPdfFromDiskPrint(response, doc);
    });
}

function sendPdfFromDiskDownload(response, data) {
    var file = path.join(__dirname, "./server/Racun.html");
    var html = changeHTMLTemplate(data);
    var base = "file://" + __dirname + "/server/";
    var options = { format: 'A4', base: base  }; // file:///C:/Users/david/Desktop/kalmia/newWay/billsApp/server/

    pdf.create(html, options).toFile('./server/temp.pdf', function(err, res) {
        if (err) return console.log(err);

        response.contentType("application/pdf");
        
        fs.readFile('./server/temp.pdf', function (err, data){ // odpre v browserju
            if (err) return console.log(err);
            response.contentType("application/pdf");
            response.send(data);
        });
    });
}

function sendPdfFromDiskPrint(response, data) {
    var file = path.join(__dirname, "./server/Racun.html");
    var html = changeHTMLTemplate(data);
    var base = "file://" + __dirname + "/server/";
    var options = { format: 'A4', base: base  }; // file:///C:/Users/david/Desktop/kalmia/newWay/billsApp/server/

    pdf.create(html, options).toFile('./server/temp.pdf', function(err, res) {
        if (err) return console.log(err);

        response.contentType("application/pdf");

        response.download('./server/temp.pdf', function (err) { // downloada v broserju
            if (err) {
                console.log("Error");
                console.log(err);
            } else {
                console.log("Success");
            }
        });
        
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


/* -------------------- GENERATE PDF -------------------- */
function getHumanReadableDate(x) {
    return x.getDate() + "." + (x.getMonth() + 1) + "." + x.getFullYear();
}

function changeHTMLTemplate(data) {

    var html = `<!DOCTYPE  html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Racun</title>
        <style type="text/css">
            * {
                margin: 0;
                padding: 0;
                text-indent: 0;
            }
    
            .s1 {
                color: black;
                font-family: Calibri, sans-serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 10pt;
            }
    
            h1 {
                color: black;
                font-family: Calibri, sans-serif;
                font-style: normal;
                font-weight: bold;
                text-decoration: none;
                font-size: 10.5pt;
            }
    
            p {
                color: black;
                font-family: Calibri, sans-serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 10.5pt;
                margin: 0pt;
            }
    
            .s2 {
                color: black;
                font-family: Calibri, sans-serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 9pt;
            }
    
            .s3 {
                color: black;
                font-family: Calibri, sans-serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 9pt;
            }
    
            .s4 {
                color: black;
                font-family: Calibri, sans-serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 8pt;
            }
    
            .s5 {
                color: black;
                font-family: Calibri, sans-serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 7pt;
            }
    
            table,
            tbody {
                vertical-align: top;
                overflow: visible;
            }
        </style>
    </head>
    
    <body>
    
        <div>
            <img width="690" height="117" alt="image" src="Image_001.png" />
        </div>
    
        <p class="s1" style="padding-left: 8pt;text-indent: 0pt;text-align: left;">${data.stranka}</p>
        <p class="s1" style="padding-left: 8pt;text-indent: 0pt;text-align: left;">${data.naslov}</p>
        <p class="s1" style="padding-left: 8pt;text-indent: 0pt;text-align: left;">${data.postnaSt}, ${data.mesto}, ${data.drzava}</p>
        <p class="s1" style="padding-left: 8pt;text-indent: 0pt;text-align: left;">${data.davcnaSt}</p>
    
        <br /><br /><br />

        <div style="width: 670px;">
            <h1 style="padding-top: 3pt;padding-left: 320pt;text-indent: 0pt;text-align: left;">INVOICE# <span style="float: right;">${data.stRacuna}</span></h1>
            <p style="padding-top: 1pt;padding-left: 320pt;text-indent: 0pt;text-align: left;">Place: <span style="float: right;">${data.mesto}</span></p>
            <p style="padding-top: 1pt;padding-left: 320pt;text-indent: 0pt;text-align: left;">Ref. #: <span style="float: right;">US00 ${data.stRacuna}</span></p>
            <p style="padding-top: 1pt;padding-left: 320pt;text-indent: 0pt;text-align: left;">Issued: <span style="float: right;">${getHumanReadableDate(new Date(data.datumIzdaje))}</span> </p>
            <p style="padding-top: 1pt;padding-left: 320pt;text-indent: 0pt;text-align: left;">Due date: <span style="float: right;">${getHumanReadableDate(new Date(data.rokPlacila))}</span> </p>
            <p style="padding-top: 1pt;padding-left: 320pt;text-indent: 0pt;text-align: left;">Service date: <span style="float: right;">${getHumanReadableDate(new Date(data.datumStoritve))}</span> </p>
        </div>
        <br /><br />
    
        <p class="s1" style="padding-top: 2pt;padding-left: 8pt;text-indent: 0pt;text-align: left;">Remarks</p>
    
        <br />
    
    
        <table style="border-collapse:collapse;margin-left:5.70493pt" cellspacing="0">
            <tr style="height:13pt">
                <td style="width:15pt;border-top-style:solid;border-top-width:1pt;border-left-style:solid;border-left-width:1pt;border-bottom-style:solid;border-bottom-width:1pt;border-right-style:solid;border-right-width:1pt">
                    <p class="s2" style="padding-top: 1pt;padding-left: 4pt;text-indent: 0pt;line-height: 11pt;text-align: left;">#</p>
                </td>
                <td style="width:297pt;border-top-style:solid;border-top-width:1pt;border-left-style:solid;border-left-width:1pt;border-bottom-style:solid;border-bottom-width:1pt;border-right-style:solid;border-right-width:1pt">
                    <p class="s2" style="padding-top: 1pt;padding-left: 2pt;text-indent: 0pt;line-height: 11pt;text-align: left;">Service</p>
                </td>
                <td style="width:51pt;border-top-style:solid;border-top-width:1pt;border-left-style:solid;border-left-width:1pt;border-bottom-style:solid;border-bottom-width:1pt;border-right-style:solid;border-right-width:1pt">
                    <p class="s2" style="padding-top: 1pt;padding-left: 15pt;text-indent: 0pt;line-height: 11pt;text-align: left;">Price</p>
                </td>
                <td style="width:46pt;border-top-style:solid;border-top-width:1pt;border-left-style:solid;border-left-width:1pt;border-bottom-style:solid;border-bottom-width:1pt;border-right-style:solid;border-right-width:1pt">
                    <p class="s2" style="padding-top: 1pt;padding-left: 10pt;text-indent: 0pt;line-height: 11pt;text-align: left;">% VAT</p>
                </td>
                <td style="width:41pt;border-top-style:solid;border-top-width:1pt;border-left-style:solid;border-left-width:1pt;border-bottom-style:solid;border-bottom-width:1pt;border-right-style:solid;border-right-width:1pt">
                    <p class="s2" style="padding-top: 1pt;padding-left: 12pt;text-indent: 0pt;line-height: 11pt;text-align: left;">VAT</p>
                </td>
                <td style="width:45pt;border-top-style:solid;border-top-width:1pt;border-left-style:solid;border-left-width:1pt;border-bottom-style:solid;border-bottom-width:1pt;border-right-style:solid;border-right-width:1pt">
                    <p class="s2" style="padding-top: 1pt;padding-left: 12pt;text-indent: 0pt;line-height: 11pt;text-align: left;">Total</p>
                </td>
            </tr>
    
            <tr style="height:13pt"></tr>`;


            for (let i = 0, length = data.storitve.length; i < length; i++) {
                html += `<tr style="height:13pt;">
                    <td style="width:15pt;">
                        <p class="s2" style="padding-top: 1pt;padding-left: 4pt;text-indent: 0pt;line-height: 11pt;text-align: left;">${i + 1}</p>
                    </td>
                    <td style="width:297pt;">
                        <p class="s2" style="padding-top: 1pt;padding-left: 2pt;text-indent: 0pt;line-height: 11pt;text-align: left;">${data.storitve[i].name}, ${data.storitve[i].quantity}x</p>
                    </td>
                    <td style="width:51pt;">
                        <p class="s2" style="padding-top: 1pt;padding-left: 15pt;text-indent: 0pt;line-height: 11pt;text-align: left;">${(Number(data.storitve[i].price) * Number(data.storitve[i].quantity)).toFixed(2)}</p>
                    </td>
                    <td style="width:46pt;">
                        <p class="s2" style="padding-top: 1pt;padding-left: 19pt;text-indent: 0pt;line-height: 11pt;text-align: left;">${data.storitve[i].VAT}</p>
                    </td>
                    <td style="width:41pt;">
                        <p class="s2" style="padding-top: 1pt;padding-left: 12pt;text-indent: 0pt;line-height: 11pt;text-align: left;">${(Number(data.storitve[i].price) * Number(data.storitve[i].quantity) * (Number(data.storitve[i].VAT) / 100)).toFixed(2)}</p>
                    </td>
                    <td style="width:45pt;">
                        <p class="s2" style="padding-top: 1pt;padding-left: 12pt;text-indent: 0pt;line-height: 11pt;text-align: left;">${(Number(data.storitve[i].price) * Number(data.storitve[i].quantity) * (1 + Number(data.storitve[i].VAT) / 100)).toFixed(2)}</p>
                    </td>
                </tr>`;
            }
    
            html += `

            <tr style="height:13pt"></tr>
            <tr style="height:13pt"></tr>

            <tr style="height:13pt"><td colspan="6"><p class="s2" style="border-bottom: 2px solid black;"></p></td><tr>
            </table>

            <h1 style="padding-left: 23pt;text-indent: 0pt;text-align: left;"><span>TOTAL (EUR)</span><span style="display: inline-block; width:500px;"></span>${data.znesek}</h1>            

            <br /><br /><br /><br />

            <p class="s1" style="padding-left: 8pt;text-indent: 0pt;text-align: left;">Izdajatelj:</p>

            <p class="s1" style="padding-left: 8pt;text-indent: 0pt;text-align: left;">${data.vpisal}</p>


            <br /><br /><br /><br /><br /><br />

            <div>
                <img width="690" height="117" alt="image" src="Image_003.png" />
            </div>
        </body>

        </html>`;

    return html;
}