import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Example app (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('renders the seeded welcome template', () => {
    return request(app.getHttpServer())
      .get('/demo?name=Ada')
      .expect(200)
      .expect((res) => {
        expect(res.body.content).toContain('ADA'); // upper filter
        expect(res.body.subject).toContain('Acme'); // global
      });
  });

  it('returns a diagnostic 422 when a variable is missing', () => {
    return request(app.getHttpServer())
      .get('/demo/error')
      .expect(422)
      .expect((res) => {
        expect(res.body.code).toBe('TEMPLATE_RENDER_FAILED');
        expect(res.body.missingVariable).toBe('firstName');
        expect(res.body.contextKeys).toEqual([]);
      });
  });
});
