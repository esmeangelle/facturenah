// lib/auth.ts
export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0';
    window.location.href = '/login';
  }
  
  export function getUser() {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  
  export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }