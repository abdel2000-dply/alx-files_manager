import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

function base64decode(str) {
  // base64 to utf-8 string
  return Buffer.from(str, 'base64').toString('utf-8');
}

class AuthController {
  static async getConnect(req, res) {
    const auth = req.header('Authorization');
    if (!auth || !auth.startsWith('Basic ')) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // Extract the base64 encoded string
    const authBody = auth.slice(6);
    const authDecoded = base64decode(authBody);
    if (!authDecoded.includes(':')) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // Extract user credentials, email and password
    const [email, password] = authDecoded.split(':');
    if (!email || !password) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const hashedPassword = sha1(password);

    // Check if the user exists
    const user = await dbClient.db
      .collection('users')
      .findOne({ email, password: hashedPassword });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // Generating a new token
    const token = uuidv4();
    const key = `auth_${token}`;

    // Store the token in Redis
    await redisClient.set(key, user._id.toString(), 86400); // 24 hours

    return res.send({ token });
  }

  static async getDisconnect(req, res) {
    // Extract the token from the header
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // Check if the token exists in Redis
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // Delete the token from Redis
    await redisClient.del(key);
    return res.status(204).send();
  }
}

export default AuthController;
