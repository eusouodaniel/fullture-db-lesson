const { MongoClient } = require("mongodb");
 
let singleton;
 
module.exports = async function connect() {
    if (singleton) return singleton;
 
    const client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
 
    singleton = client.db(process.env.MONGO_DB_NAME);
    return singleton;
}