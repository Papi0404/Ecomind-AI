const jwt = require('jsonwebtoken');

const JWT_SECRET = 'ecomind_jwt_secret_rotation_key_12345!';

// Simulate signToken
const payload = { userId: '123', email: 'test@test.com', role: 'ADMIN' };
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
console.log('Generated Token:', token);

// Simulate verifyJwt from middleware using node crypto (which implements Web Crypto API)
const { webcrypto } = require('crypto');
const crypto = webcrypto;

function base64urlToArrayBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = Buffer.from(padded, 'base64').toString('binary');
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

async function verifyJwt(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { success: false, reason: 'parts' };

    const [header, payloadStr, signature] = parts;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = `${header}.${payloadStr}`;
    const dataBuffer = encoder.encode(data);
    const sigBuffer = base64urlToArrayBuffer(signature);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      sigBuffer,
      dataBuffer
    );

    if (!isValid) return { success: false, reason: 'signature_invalid' };

    const decodedPayload = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf-8'));
    
    if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
      return { success: false, reason: 'expired' };
    }

    return { success: true, payload: decodedPayload };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

verifyJwt(token, JWT_SECRET).then(res => {
  console.log('Verification Result:', res);
});
