// lib/api-client.js
/**
 * Secure API client for frontend
 * Automatically includes credentials (httpOnly cookies) with all requests
 */

/**
 * Make an authenticated API request
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(url, options = {}) {
  const config = {
    ...options,
    credentials: "include", // Always include httpOnly cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  return fetch(url, config);
}

/**
 * Helper for GET requests
 */
export async function apiGet(url) {
  return apiFetch(url, { method: "GET" });
}

/**
 * Helper for POST requests
 */
export async function apiPost(url, data) {
  return apiFetch(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Helper for PUT requests
 */
export async function apiPut(url, data) {
  return apiFetch(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete(url) {
  return apiFetch(url, { method: "DELETE" });
}

/**
 * Handle logout
 */
export async function logout() {
  try {
    await apiPost("/api/auth/logout");
    // Clear any localStorage (if you're using it for non-sensitive data)
    localStorage.removeItem("user");
    window.location.href = "/login";
  } catch (e) {
    console.error("Logout failed:", e);
    // Redirect anyway
    window.location.href = "/login";
  }
}
