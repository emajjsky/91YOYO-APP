import { describe, expect, it } from 'vitest';
import { normalizePhone, validatePhone } from './phoneValidation';

describe('validatePhone', () => {
  it('accepts an 11-digit Mainland China mobile number', () => {
    expect(validatePhone('13800138000')).toBeNull();
  });

  it('rejects a number with the wrong length or prefix', () => {
    expect(validatePhone('1380013800')).toBe('请输入有效的手机号');
    expect(validatePhone('12800138000')).toBe('请输入有效的手机号');
  });

  it('rejects blank input', () => {
    expect(validatePhone('   ')).toBe('请输入手机号');
  });

  it('normalizes a valid local number to E.164 for the SMS API', () => {
    expect(normalizePhone('13800138000')).toBe('+8613800138000');
  });
});
