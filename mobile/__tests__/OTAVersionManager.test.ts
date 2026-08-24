import { isUpdateAcceptable } from '../src/services/OTAVersionManager';

const NATIVE = '1.0';

describe('isUpdateAcceptable', () => {
  it('accepts strictly newer OTA version', () => {
    const r = isUpdateAcceptable('0.0.0', '0.1.0', NATIVE, NATIVE);
    expect(r.acceptable).toBe(true);
  });

  it('accepts newer OTA with multi-segment jump', () => {
    const r = isUpdateAcceptable('1.2.3', '1.3.0', NATIVE, NATIVE);
    expect(r.acceptable).toBe(true);
  });

  it('rejects same OTA version (no-op)', () => {
    const r = isUpdateAcceptable('1.0.0', '1.0.0', NATIVE, NATIVE);
    expect(r.acceptable).toBe(false);
  });

  it('rejects older OTA version (downgrade)', () => {
    const r = isUpdateAcceptable('1.5.0', '1.4.9', NATIVE, NATIVE);
    expect(r.acceptable).toBe(false);
  });

  it('rejects when native version mismatches', () => {
    const r = isUpdateAcceptable('0.0.0', '1.0.0', '2.0', NATIVE);
    expect(r.acceptable).toBe(false);
    expect(r.reason).toMatch(/native version mismatch/i);
  });

  it('accepts exact native version match', () => {
    const r = isUpdateAcceptable('0.0.0', '1.0.0', '1.0', '1.0');
    expect(r.acceptable).toBe(true);
  });

  it('rejects native version that is only a prefix match (not equal)', () => {
    const r = isUpdateAcceptable('0.0.0', '1.0.0', '1.0.0', '1.0');
    expect(r.acceptable).toBe(false);
  });
});
