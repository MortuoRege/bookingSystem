// lib/security-headers.js
export function getSecurityHeaders() {
  const isProduction = process.env.NODE_ENV === "production";
  
  return {
    // Prevent clickjacking
    "X-Frame-Options": "DENY",
    
    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",
    
    // Enable XSS protection (legacy, but doesn't hurt)
    "X-XSS-Protection": "1; mode=block",
    
    // Referrer policy
    "Referrer-Policy": "strict-origin-when-cross-origin",
    
    // Content Security Policy
    // In production, remove unsafe-inline and unsafe-eval
    // For development, we allow them for Next.js hot reload
    "Content-Security-Policy": isProduction
      ? [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "connect-src 'self'",
          "frame-ancestors 'none'",
        ].join("; ")
      : [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "connect-src 'self'",
          "frame-ancestors 'none'",
        ].join("; "),
    
    // HSTS - Force HTTPS (only enable in production with HTTPS)
    ...(isProduction && {
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    }),
    
    // Permissions Policy - Disable unnecessary features
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  };
}

export function applySecurityHeaders(response) {
  const headers = getSecurityHeaders();
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
