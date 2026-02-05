// lib/logout.js - Centralized logout utility

/**
 * Performs a complete logout:
 * 1. Calls the logout API to clear server-side cookie
 * 2. Clears localStorage
 * 3. Redirects to login page
 */
export async function performLogout(router) {
  try {
    // Clear server-side auth cookie
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Logout API call failed:", err);
    // Continue with client-side cleanup even if API fails
  }

  // Clear all client-side data
  localStorage.removeItem("user");
  localStorage.removeItem("authToken"); // Clear any other auth tokens
  
  // Redirect to login
  router.push("/login");
}

/**
 * React hook for logout functionality
 * Usage: const handleLogout = useLogout();
 */
export function useLogout() {
  if (typeof window === 'undefined') return () => {};
  
  // This will work in both pages router and app router contexts
  const performLogoutClient = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout API call failed:", err);
    }

    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    window.location.href = "/login"; // Hard redirect to ensure clean state
  };

  return performLogoutClient;
}
