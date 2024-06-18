import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}`;

    this.connected = false;
    this.client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    this.client
      .connect()
      .then(() => {
        this.db = this.client.db(database);
        this.connected = true;
      })
      .catch((error) => {
        console.log('MongoDB connection error:', error);
      });
  }

  isAlive() {
    // check if the client is connected to the server
    return this.connected;
  }

  async nbUsers() {
    // return the number of documents in the collection users
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    // return the number of documents in the collection files
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
