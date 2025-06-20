export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) return true;
  
  const now = Date.now() / 1000;
  return payload.exp < now;
};

export const getTokenExpirationTime = (token: string): number | null => {
  const payload = decodeJWT(token);
  return payload?.exp || null;
};

export const shouldRefreshToken = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) return true;
  
  const now = Date.now() / 1000;
  const timeUntilExpiry = payload.exp - now;
  
  // Refresh if token expires within 5 minutes (300 seconds)
  return timeUntilExpiry < 300;
};