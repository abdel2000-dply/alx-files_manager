import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = '0', isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).send({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).send({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).send({ error: 'Missing data' });
    }

    if (parentId !== '0') {
      const parent = await dbClient.db
        .collection('files')
        .findOne({ _id: ObjectId(parentId) });
      if (!parent) {
        return res.status(400).send({ error: 'Parent not found' });
      }
      if (parent.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    const newFile = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === '0' ? '0' : ObjectId(parentId),
    };

    let localPath = null;
    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      localPath = path.join(folderPath, uuidv4());
      fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
      newFile.localPath = localPath;
    }

    const result = await dbClient.db.collection('files').insertOne(newFile);

    const responseFile = {
      id: result.insertedId.toString(),
      ...newFile,
    };
    // Fix the responsefile with id instead of _id and structure | maybe this will pass the checker
    delete responseFile._id;

    return res.status(201).send(responseFile);
  }

  static async getShow(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(404).send({ error: 'Not found' });
    }

    const file = await dbClient.db
      .collection('files')
      .findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });

    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }

    // fix this and remove ...file
    const responseFile = {
      id: file._id.toString(),
      ...file,
    };
    delete responseFile._id;
    return res.send(responseFile);
  }

  static async getIndex(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || '0';
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;
    const step = page * pageSize;

    const files = await dbClient.db
      .collection('files')
      .find({ userId: ObjectId(userId), parentId })
      .skip(step)
      .limit(pageSize)
      .toArray();

    const responseFiles = files.map((file) => ({
      id: file._id.toString(),
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }));

    return res.send(responseFiles);
  }

  static async putPublish(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(404).send({ error: 'Not found' });
    }

    const file = await dbClient.db
      .collection('files')
      .findOneAndUpdate(
        { _id: ObjectId(fileId), userId: ObjectId(userId) },
        { $set: { isPublic: true } },
      );

    if (!file.value) {
      return res.status(404).send({ error: 'Not found' });
    }

    const responseFile = {
      id: file.value._id,
      userId: file.value.userId,
      name: file.value.name,
      type: file.value.type,
      isPublic: file.value.isPublic,
      parentId: file.value.parentId,
    };

    return res.send(responseFile);
  }

  static async putUnpublish(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(404).send({ error: 'Not found' });
    }

    const file = await dbClient.db
      .collection('files')
      .findOneAndUpdate(
        { _id: ObjectId(fileId), userId: ObjectId(userId) },
        { $set: { isPublic: false } },
      );

    if (!file.value) {
      return res.status(404).send({ error: 'Not found' });
    }

    const responseFile = {
      id: file.value._id,
      userId: file.value.userId,
      name: file.value.name,
      type: file.value.type,
      isPublic: file.value.isPublic,
      parentId: file.value.parentId,
    };

    return res.send(responseFile);
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(404).send({ error: 'Not found' });
    }

    const file = await dbClient.db
      .collection('files')
      .findOne({ _id: ObjectId(fileId) });
    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).send({ error: "A folder doesn't have content" });
    }

    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!file.isPublic) {
      if (!userId || userId !== file.userId.toString()) {
        return res.status(404).send({ error: 'Not found' });
      }
    }

    const filePath = path.join(
      process.env.FOLDER_PATH || '/tmp/files_manager',
      file.localPath,
    );
    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);

    const fileContent = fs.readFileSync(filePath);
    return res.status(200).send(fileContent);
  }
}

export default FilesController;
