import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    const redis = redisClient.isAlive();
    const db = dbClient.isAlive();
    res.json({ redis, db });
  }

  static getStats(req, res) {
    Promise.all([dbClient.nbUsers(), dbClient.nbFiles()])
      .then(([nbusers, nbfiles]) => {
        res.json({ users: nbusers, files: nbfiles });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send(error.message);
      });
  }
}

export default AppController;
