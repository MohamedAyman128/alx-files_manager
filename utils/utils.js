export const getAuthHeader = (req) => {
  const header = req.headers.authorization;
  // if header does not exist
  if (!header) {
    return null;
  }
  return header;
};

export const decodeToken = (token) => {
  const decodedToken = Buffer.from(token, 'base64').toString('utf8');
  if (!decodedToken) {
    return null;
  }
  return decodedToken;
};

export function decodeBase64 (encodedString) {
  return Buffer.from(encodedString, 'base64').toString('utf-8');
}

