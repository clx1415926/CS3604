
const { validateIdCard18, validatePhone, convert15to18, encrypt, decrypt } = require('../src/utils/security');

describe('Security Utils Unit Tests', () => {
  
  describe('validateIdCard18', () => {
    test('should validate correct 18-digit ID', () => {
      // 11010119900307715X is valid
      expect(validateIdCard18('11010119900307715X')).toBe(true);
    });

    test('should reject invalid checksum', () => {
      // 110101199003077158 (last digit should be X)
      expect(validateIdCard18('110101199003077158')).toBe(false);
    });

    test('should reject invalid date (future date)', () => {
      expect(validateIdCard18('11010120990101123X')).toBe(false);
    });

    test('should reject invalid format (not 18 digits)', () => {
      expect(validateIdCard18('123')).toBe(false);
      expect(validateIdCard18('11010119900307715')).toBe(false); // 17 digits
    });
  });

  describe('convert15to18', () => {
    test('should convert 15-digit ID to 18-digit correctly', () => {
      // 15-digit: 110101900307715 -> 18-digit: 11010119900307715X
      const id15 = '110101900307715';
      const expected = '11010119900307715X';
      expect(convert15to18(id15)).toBe(expected);
    });

    test('should return original if not 15 digits', () => {
      expect(convert15to18('123')).toBe('123');
    });
  });

  describe('validatePhone', () => {
    test('should validate correct CN mobile', () => {
      expect(validatePhone('+86', '13812345678')).toBe(true);
      expect(validatePhone('+86', '15012345678')).toBe(true);
      expect(validatePhone('+86', '19912345678')).toBe(true);
      expect(validatePhone('+86', '19212345678')).toBe(true); // CBN
      expect(validatePhone('+86', '17012345678')).toBe(true); // MVNO
      expect(validatePhone(undefined, '13812345678')).toBe(true); // Default to +86
    });

    test('should reject invalid CN mobile', () => {
      expect(validatePhone('+86', '12345678901')).toBe(false); // Starts with 12
      expect(validatePhone('+86', '11112345678')).toBe(false); // Starts with 11
      expect(validatePhone('+86', '1381234567')).toBe(false); // 10 digits
      expect(validatePhone('+86', '138123456789')).toBe(false); // 12 digits
      expect(validatePhone('+86', 'abc12345678')).toBe(false); // Non-digits
    });

    test('should validate international numbers loosely', () => {
      expect(validatePhone('+852', '12345678')).toBe(true);
      expect(validatePhone('+1', '1234567890')).toBe(true);
    });
  });

  describe('Encryption', () => {
    test('should encrypt and decrypt correctly', () => {
      const plain = '11010119900307715X';
      const encrypted = encrypt(plain);
      expect(encrypted).not.toBe(plain);
      expect(encrypted).toContain(':'); // IV:Cipher
      
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plain);
    });

    test('should handle empty string', () => {
      expect(encrypt('')).toBe('');
      expect(decrypt('')).toBe('');
    });

    test('should return original if decrypt fails (backward compat)', () => {
      expect(decrypt('not-encrypted')).toBe('not-encrypted');
    });
  });

});
