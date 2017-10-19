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
    app.get("/pdfs/:id", getPdf);
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
    var id = request.params.id;
    db.bills.remove({
        _id: mongojs.ObjectId(id)
    }, (err, doc) => {
        response.json(doc);
        logMongoDelete();
    });
}

function getPdf(request, response) {
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
        sendPdfFromDisk(response, doc);
    });
}

function sendPdfFromDisk(response, data) {
    var file = path.join(__dirname, "./server/Racun.html"); // Racun.pdf

    // response.download(file, function (err) { // downloada v broserju
    //     if (err) {
    //         console.log("Error");
    //         console.log(err);
    //     } else {
    //         console.log("Success");
    //     }
    // });

    // fs.readFile(file, function (err, data){ // odpre v browserju
    //     response.contentType("application/pdf");
    //     response.send(data);
    // });

    // var html = fs.readFileSync('./server/Racun.html', 'utf8');
    var html = changeHTMLTemplate(data);
    var base = "file://" + __dirname + "/server/";
    // console.log("BASE JE: %s".red, base);
    var options = { format: 'A4', base: base  }; // file:///C:/Users/david/Desktop/kalmia/newWay/billsApp/server/

    pdf.create(html, options).toFile('./server/businesscard2.pdf', function(err, res) {
        if (err) return console.log(err);
        // console.log(res); // { filename: '/app/businesscard.pdf' }

        response.contentType("application/pdf");
        
        fs.readFile('./server/businesscard2.pdf', function (err, data){ // odpre v browserju
            if (err) return console.log(err);
            response.contentType("application/pdf");
            response.send(data);
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

    // // create a document and pipe to a blob
    // var doc = new PDFDocument();
    // var stream = doc.pipe(blobStream());

    // // draw some text
    // doc.fontSize(25)
    // .text('Here is some vector graphics...', 100, 80);
    
    // // some vector graphics
    // doc.save()
    // .moveTo(100, 150)
    // .lineTo(100, 250)
    // .lineTo(200, 250)
    // .fill("#FF3300");
    
    // doc.circle(280, 200, 50)
    // .fill("#6600FF");
    
    // // an SVG path
    // doc.scale(0.6)
    // .translate(470, 130)
    // .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
    // .fill('red', 'even-odd')
    // .restore();
    
    // // and some justified text wrapped into columns
    // doc.text('And here is some wrapped text...', 100, 300)
    // .font('Times-Roman', 13)
    // .moveDown()
    // .text(lorem, {
    //     width: 412,
    //     align: 'justify',
    //     indent: 30,
    //     columns: 2,
    //     height: 300,
    //     ellipsis: true
    // });
    
    // // end and display the document in the iframe to the right
    // doc.end();
    // stream.on('finish', function() {
    //     iframe.src = stream.toBlobURL('application/pdf');
    // });
    //response.json(docs);
// }

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
        <p class="s1" style="padding-left: 8pt;text-indent: 0pt;text-align: left;">${data.postnaStevilka}, CITY, ${data.drzava}</p>
        <p class="s1" style="padding-left: 8pt;text-indent: 0pt;text-align: left;">${data.davcna}</p>
    
        <br /><br /><br />
    
        <h1 style="padding-top: 3pt;padding-left: 320pt;text-indent: 0pt;text-align: left;">INVOICE# ${data.stevilkaRacuna}</h1>
        <p style="padding-top: 1pt;padding-left: 320pt;text-indent: 0pt;text-align: left;">Place: PLACE</p>
        <p style="padding-top: 1pt;padding-left: 320pt;text-indent: 0pt;text-align: left;">Ref. #: US00 ${data.stevilkaRacuna}</p>
        <p style="padding-top: 1pt;padding-left: 320pt;text-indent: 0pt;text-align: left;">Issued: ${getHumanReadableDate(new Date(data.datumIzdaje))}</p>
        <p style="padding-top: 1pt;padding-left: 320pt;text-indent: 0pt;text-align: left;">Due date: ${getHumanReadableDate(new Date(data.rokPlacila))}</p>
        <p style="padding-top: 1pt;padding-left: 320pt;text-indent: 0pt;text-align: left;">Service date: ${getHumanReadableDate(new Date(data.datumStoritve))}</p>
    
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
                        <p class="s2" style="padding-top: 1pt;padding-left: 15pt;text-indent: 0pt;line-height: 11pt;text-align: left;">${Number(data.storitve[i].price) * Number(data.storitve[i].quantity)}</p>
                    </td>
                    <td style="width:46pt;">
                        <p class="s2" style="padding-top: 1pt;padding-left: 10pt;text-indent: 0pt;line-height: 11pt;text-align: left;">${data.storitve[i].VAT}</p>
                    </td>
                    <td style="width:41pt;">
                        <p class="s2" style="padding-top: 1pt;padding-left: 12pt;text-indent: 0pt;line-height: 11pt;text-align: left;">${Number(data.storitve[i].VAT) * (Number(data.storitve[i].price) * Number(data.storitve[i].quantity)/100)}</p>
                    </td>
                    <td style="width:45pt;">
                        <p class="s2" style="padding-top: 1pt;padding-left: 12pt;text-indent: 0pt;line-height: 11pt;text-align: left;">${Number(data.storitve[i].VAT) / 100 * Number(data.storitve[i].price) * Number(data.storitve[i].quantity)}</p>
                    </td>
                </tr>`;
            }
    
            html += `

            <tr style="height:13pt"></tr>
            <tr style="height:13pt"></tr>

            <tr style="height:13pt"><td colspan="6"><p class="s2" style="border-bottom: 2px solid black;"></p></td><tr>
            </table>

            <h1 style="padding-left: 23pt;text-indent: 0pt;text-align: left;">TOTAL (EUR) ${data.znesek}</h1>

            <br /><br /><br /><br />

            <p class="s1" style="padding-left: 8pt;text-indent: 0pt;text-align: left;">CEO:</p>

            <p class="s1" style="padding-left: 8pt;text-indent: 0pt;text-align: left;">${data.drzava}</p>


            <br /><br /><br /><br /><br /><br />

            <p style="text-indent: 0pt;text-align: left;">
                <span>
                    <img width="690" height="85" alt="image" src="Image_003.png" />
                </span>
            </p>
        </body>

        </html>`;

    return html;
}