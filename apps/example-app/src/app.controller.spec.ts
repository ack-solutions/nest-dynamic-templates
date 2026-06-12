import { AppController } from './app.controller';

describe('AppController', () => {
  it('exposes info listing the example endpoints', () => {
    const controller = new AppController({} as any, {} as any);
    const info = controller.info();
    expect(info.message).toContain('example');
    expect(info.try.length).toBeGreaterThan(0);
  });
});
