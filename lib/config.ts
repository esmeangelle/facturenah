const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' 
    ? `http://${window.location.hostname}:5000`
    : 'http://localhost:5000');

export default API_URL;

