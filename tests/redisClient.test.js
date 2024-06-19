import { expect } from 'chai';
import redisClient from '../utils/redis';

describe('redisClient', () => {
  it('should set and get a value', async () => {
    await redisClient.set('key', 'value');
    const value = await redisClient.get('key');
    expect(value).to.equal('value');
  });

  it('should delete a value', async () => {
    await redisClient.set('key', 'value');
    await redisClient.del('key');
    const value = await redisClient.get('key');
    expect(value).to.be.null;
  });
});
