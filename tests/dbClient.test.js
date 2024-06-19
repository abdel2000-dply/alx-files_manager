import { expect } from 'chai';
import dbClient from '../utils/db';

describe('dbClient', () => {
  it('should be able to insert a document', async () => {
    const collection = dbClient.db.collection('test');
    const result = await collection.insertOne({ name: 'test' });
    expect(result.insertedCount).to.equal(1);
  });

  it('should find a document', async () => {
    const collection = dbClient.db.collection('test');
    await collection.insertOne({ name: 'test' });
    const doc = await collection.findOne({ name: 'test' });
    expect(doc).to.have.property('name', 'test');
  });

  it('should delete a document', async () => {
    const collection = dbClient.db.collection('test');
    await collection.insertOne({ name: 'test' });
    await collection.deleteOne({ name: 'test' });
    const doc = await collection.findOne({ name: 'test' });
    expect(doc).to.be.null;
  });
});
