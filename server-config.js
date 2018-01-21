module.exports = {
    portHttpServer:        12534,
    dbConnectionString:    process.env.MONGO || 'mongodb://localhost:27017',
    usersCollection:       "uporabniki",
    postalCodesCollection: "poste",
    billsCollection:       "bills"
};