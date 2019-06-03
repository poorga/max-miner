const CryptoJS = require('crypto-js');
// const  Base64 = require('crypto-js/enc-base64');

const base64Encode = obj => btoa(JSON.stringify(obj));
// const base64Encode = obj => Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(obj)));

const sign = (key, content) => {
  const hasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
  return `${hasher.update(content).finalize()}`;
};


export const API_URL = 'https://max-api.maicoin.com';

export const v2Headers = (accessToken, payload) => {
  if (!accessToken || accessToken === '') return {};

  const encodedPayload = base64Encode(payload);
  const [accessKey, secretKey] = accessToken.split(':');
  return {
    'User-Agent': 'Mining MAX / v1.0',
    'Content-Type': 'application/json',
    'X-MAX-ACCESSKEY': accessKey,
    'X-MAX-PAYLOAD': encodedPayload,
    'X-MAX-SIGNATURE': sign(secretKey, encodedPayload),
  };
};
