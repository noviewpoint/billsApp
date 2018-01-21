const express      = require("express");
const bodyParser   = require("body-parser");
const path         = require("path");
const colors       = require("colors");
const cors         = require("cors");
const fs           = require("fs");
const pdf          = require("html-pdf");
const mongodb      = require("mongodb");
const assert       = require("assert"); // za testiranje kode (namesto preverjanja napak z if-om)
const readline     = require("readline");
const jwt          = require("jsonwebtoken");
const mongoose     = require("mongoose");
const serverConfig = require("./server-config.js"); // mora biti s pikco!!! drugace defaultno isce NPM modul

const {
    portHttpServer,
    dbConnectionString,
    usersCollection,
    postalCodesCollection,
    billsCollection
} = serverConfig;
const MongoClient           = mongodb.MongoClient;
const ObjectId              = mongodb.ObjectID;


var app          = null;
const secureRoutes = express.Router();
var httpServer   = null;
var db           = null;



initHttpServer();
initMongoDatabaseConnection();
// initListeningForKeyPress();



/* ------------------------- JWT ------------------------- */
process.env.SECRET_KEY = "mybadasskey"; // process is available all throughout the application



/* --------------------- MONGO BAZA ---------------------- */
function initMongoDatabaseConnection() {
    MongoClient.connect(dbConnectionString, function(err, database) {
        assert.equal(null, err);
        console.log("Connected correctly to the database.");
        db = database;
    }); 
}



/* -------------------- HTTP STREZNIK -------------------- */
function initHttpServer() {
    app = express();
    app.use(cors()); // MIDDLEWARE preden nastavis port!

    /* baje lahko uporablja oboje */
    app.use(bodyParser.urlencoded({extended: true})); // https://stackoverflow.com/questions/29960764/what-does-extended-mean-in-express-4-0
    // extended is false, you can not post "nested object"; extended is true, post whatever you like
    app.use(bodyParser.json()); // MIDDLEWARE

    app.use("/secure-api", secureRoutes);

	app.set("port", portHttpServer);
	app.use(express.static(path.join(__dirname, "dist"))); // najdi angular aplikacijo v mapi dist, zgenerirani ob 'ng build'
    httpServer = app.listen(app.get("port"), "0.0.0.0", logHttpServer); // 0.0.0.0 -> poslusaj na vseh interface-ih (za hosting na public IP-ju)
	httpServer.on("connection", httpConnection);
    httpServer.on("error", httpError);
    setRoutes();
    setSecureRoutes();
}

function setRoutes() {
    app.get("/authenticate", authenticate);
    app.get("/bills", getBills);
    app.get("/bills/:id", getBill);
    app.post("/bills", postBill);
    app.put("/bills/:id", putBill);
    app.delete("/bills/:id", deleteBill);
    
    app.get("/pdfs-dl/:id", getPdfForDownload);
    app.get("/pdfs-print/:id", getPdfForPrint);

    app.get("/clients/:client", getClients);
    app.get("/postalCodes/:postalCode", getPostalCodes);
    app.get("/postalNames/:postalName", getPostalNames);

    app.get("*", (request, response) => {
        response.sendFile(path.join(__dirname, "dist/index.html")); // send all other requests to the Angular app (/# ?)
    })
}

function setSecureRoutes() {
    // Validation Middleware
    secureRoutes.use(function(request, response, next) {
        // user can pass the token in the body or the header
        var token = request.body.token || request.headers["token"];
        if (token) {
            // response.send("You have a token. Congrats");
            jwt.verify(token, process.env.SECRET_KEY, function(error, decode) {
                if (error) {
                    response.status(500).send("Error happened! Invalid token!");
                } else {
                    // response.status(200).send("U are validated #1");
                    next();
                }
            });
        } else {
            response.send("Please send me the token");
        }
    });
    secureRoutes.get("/get-data", function(request, response) {
        response.status(200).send("U are validated #2");
    });
}



/* ---------------------- KEYPRESS ----------------------- */
function initListeningForKeyPress() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on("keypress", (str, key) => {
      if (key.ctrl && key.name === "c") {
        process.exit();
      } else if (key.name === "w") {
        // https://stackoverflow.com/questions/6456864/why-does-node-js-fs-readfile-return-a-buffer-instead-of-string
        fs.readFile("./seznam_post.txt", "utf8", (err, data) => { // odpre v browserju
            assert.equal(err, null);

            // preoblikuj txt v array json objektov
            let parsedData = data.split(/\r\n/);
            parsedData.splice(-1, 1);
            parsedData = parsedData.map(x => {
                let delimiter = /\t/;
                if (x.indexOf(delimiter) === -1) {
                    delimiter = /\s{4}/;
                }
                let splitLine = x.split(delimiter);
                let obj = {
                    stevilka: splitLine[0],
                    ime: splitLine[1]
                };
                return obj;
            });
            console.log(parsedData);
            insertPostalCodesQuery(parsedData, postalCodesCollection);
        });
      } else {
        console.log(`You pressed the "${str}" key`);
        console.log();
        console.log(key);
        console.log();
      }
    });
    console.log("Press any key...");
}



/* ----------------------- ROUTES ------------------------ */
function authenticate(request, response) {
    var user = {
        username: "test",
        email: "test@test.com"
    }
    var token = jwt.sign(user, process.env.SECRET_KEY, {
        expiresIn: 4000 // in seconds
    });
    response.json({
        success: true,
        token: token
    })
}
function getBills(request, response) {
    // console.log("GET request getBills");
    findBillsQuery().then(x => {
        logMongoFind();
        response.json(x);
    });
}
function getBill(request, response) {
    // console.log("GET request getBill");
    findOneBillQuery(request.params.id).then(x => {
        logMongoFindOne();
        response.json(x);
    });
}
function postBill(request, response) {
    // console.log("POST request postBill");
    insertOneBillQuery(request.body).then(x => {
        logMongoInsertOne();
        response.json(x);
    });
}
function putBill(request, response) {
    // console.log("PUT request putBill");
    updateOneBillQuery(request.params.id, request.body).then(x => {
        logMongoUpdateOne();
        response.json(x);
    });
}
function deleteBill(request, response) {
    // console.log("DELETE request deleteBill");
    deleteOneBillQuery(request.params.id).then(x => {
        logMongoDeleteOne();
        response.json(x);
    });
}

function getPdfForDownload(request, response) {
    // console.log("GET request getPdfForDownload");
    if (!request.params.id) {
        throw "No element specified!";
    }
    findOneBillQuery(request.params.id).then(x => {
        generatePdf(x).then(x => {
            fs.readFile("./server/temp.pdf", (err, data) => { // odpre v browserju
                assert.equal(err, null);
                response.contentType("application/pdf");
                response.send(data);
            });
        });
    });
}
function getPdfForPrint(request, response) {
    // console.log("GET request getPdfForPrint");
    if (!request.params.id) {
        throw "No element specified!";
    }
    findOneBillQuery(request.params.id).then(x => {
        generatePdf(x).then(x => {
            response.contentType("application/pdf");
            response.download("./server/temp.pdf", err => { // downloada v broserju
                assert.equal(err, null);
            });
        });
    });
}

function getClients(request, response) {
    // console.log("GET request getClients");
    findClientsQuery(request.params.client).then(x => {
        logMongoFind();
        response.json(x);
    });
}

function getPostalCodes(request, response) {
    // console.log("GET request getPostalCodes");
    findPostalCodesQuery(request.params.postalCode, postalCodesCollection).then(x => {
        logMongoFind();
        response.json(x);
    });
}

function getPostalNames(request, response) {
    // console.log("GET request getPostalNames");
    findPostalNamesQuery(request.params.postalName, postalCodesCollection).then(x => {
        logMongoFind();
        response.json(x);
    });
}


/* --------------------- DB QUERIES ---------------------- */
function costumSort(input, numProp, textProp) {
    if (input === undefined) {
        return;
    }
    if (numProp === undefined) {
        numProp = "znesek";
    }
    if (textProp === undefined) {
        textProp = "stranka";
    }

    return input.sort((a, b) => {
        if (a[numProp] - b[numProp] !== 0) { // sortiraj po stevilih
            return a[numProp] - b[numProp];
        }
        if (a[textProp] > b[textProp]) { // sortiraj po abecedi
            return 1;
        } else if (a[textProp] < b[textProp]) {
            return -1;
        }
        return 0;
    });
}

function findBillsQuery() {
    var query = {};
    return new Promise((resolve, reject) => {
        var cursor = db.collection("bills").find(query);
        cursor.toArray((err, result) => {
            assert.equal(err, null);
            resolve(costumSort(result));
        });
    });
}
function findOneBillQuery(id) {
    var query = {"_id": ObjectId(id)};
    return new Promise((resolve, reject) => {
        db.collection("bills").findOne(query, (err, result) => {
            assert.equal(err, null);
            resolve(result);
        });
    });
}
function insertOneBillQuery(someData) { // argument is data in an object
    return new Promise((resolve, reject) => {
        db.collection("bills").insertOne(someData, (err, result) => {
            assert.equal(err, null);
            resolve(result);
        });
    });
}
function insertPostalCodesQuery(someData, mongoCollection) { // argument is array of objects
    return new Promise((resolve, reject) => {
        db.collection(mongoCollection).insertMany(someData, (err, result) => {
            assert.equal(err, null);
            console.log("Number of documents inserted: " + result.insertedCount);
            resolve(result);
        });
    });
}
function updateOneBillQuery(id, updatedData) {
    var query = {"_id": ObjectId(id)}; // find the object you want to update via _id
    return new Promise((resolve, reject) => {
        db.collection("bills").updateOne(query, updatedData, (err, result) => { // updates all but _id field
            assert.equal(err, null);
            resolve(result);
        });
    });
}
function deleteOneBillQuery(id) {
    var query = {"_id": ObjectId(id)};
    return new Promise((resolve, reject) => {
        db.collection("bills").deleteOne(query, (err, result) => {
            assert.equal(err, null);
            resolve(result);
        });
    });
}

function findClientsQuery(clientName) {
    var query = {"stranka": {$regex: "^" + clientName, $options: "i"}}; // case insensitive match!
    var sort = {"stranka": 1, "drzava": 1};
    return new Promise((resolve, reject) => {
        var cursor = db.collection("bills").find(query).sort(sort);
        cursor.toArray((err, result) => {
            assert.equal(err, null);
            resolve(result);
        });
    });
}

function findPostalCodesQuery(postalCode, mongoCollection) {
    var query = {"stevilka": {$regex: "^" + postalCode}};
    return new Promise((resolve, reject) => {
        var cursor = db.collection(mongoCollection).find(query);
        cursor.toArray((err, result) => {
            assert.equal(err, null);
            resolve(costumSort(result, "stevilka", "ime"));
        });
    });
}
function findPostalNamesQuery(postalName, mongoCollection) {
    var query = {"ime": {$regex: "^" + postalName, $options: "i"}}; // case insensitive match!
    return new Promise((resolve, reject) => {
        var cursor = db.collection(mongoCollection).find(query);
        cursor.toArray((err, result) => {
            assert.equal(err, null);
            resolve(costumSort(result, "stevilka", "ime"));
        });
    });
}


/* ------------------------ PDF -------------------------- */
function generatePdf(data) {
    var file = path.join(__dirname, "./server/Racun.html");
    var html = changeHTMLTemplate(data);
    var base = "file://" + __dirname + "/server/";
    var options = { format: 'A4', base: base  }; // file:///C:/Users/david/Desktop/kalmia/newWay/billsApp/server/

    return new Promise((resolve, reject) => {
        pdf.create(html, options).toFile('./server/temp.pdf', (err, result) => {
            assert.equal(err, null);
            resolve(result);
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
function logMongoFind() {
    console.log(".find v Mongo uspesen".cyan);
}
function logMongoFindOne() {
    console.log(".findOne v Mongo uspesen".cyan);
}
function logMongoInsertOne() {
    console.log(".insertOne v Mongo uspesen".green);
}
function logMongoUpdateOne() {
    console.log(".updateOne v Mongo uspesen".green);
}
function logMongoDeleteOne() {
    console.log(".deleteOne v Mongo uspesen".red);
}


/* -------------------- GENERATE PDF -------------------- */
function getHumanReadableDate(x) {
    return x.getDate() + "." + (x.getMonth() + 1) + "." + x.getFullYear();
}

function changeHTMLTemplate(data) {

    var html = `
    <!DOCTYPE  html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
    
            <tr style="height:13pt"></tr>
    `;

    for (let i = 0, length = data.storitve.length; i < length; i++) {
        html += `
            <tr style="height:13pt;">
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
            </tr>
        `;
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
    </html>
    `;

    return html;
}