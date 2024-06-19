import { expect } from 'chai';
import app from '../server';

describe('API Endpoints', () => {
  it('GET /status', async () => {
    const res = await request(app).get('/status');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('redis');
    expect(res.body).to.have.property('db');
  });
});
