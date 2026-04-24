import API_URL from './config';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

export const facturesAPI = {

  getAll: async () => {
    const res = await fetch(`${API_URL}/api/factures`, { headers: headers() });
    return res.json();
  },

  getTrash: async () => {
    const res = await fetch(`${API_URL}/api/factures/trash`, { headers: headers() });
    return res.json();
  },

  create: async (data: object) => {
    const res = await fetch(`${API_URL}/api/factures`, {
      method: 'POST', headers: headers(), body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: string, data: object) => {
    const res = await fetch(`${API_URL}/api/factures/${id}`, {
      method: 'PUT', headers: headers(), body: JSON.stringify(data),
    });
    return res.json();
  },

  updateStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_URL}/api/factures/${id}/status`, {
      method: 'PUT', headers: headers(), body: JSON.stringify({ status }),
    });
    return res.json();
  },

  moveToTrash: async (id: string) => {
    const res = await fetch(`${API_URL}/api/factures/${id}`, {
      method: 'DELETE', headers: headers(),
    });
    return res.json();
  },

  restore: async (id: string) => {
    const res = await fetch(`${API_URL}/api/factures/${id}/restore`, {
      method: 'POST', headers: headers(),
    });
    return res.json();
  },

  deletePermanent: async (id: string) => {
    const res = await fetch(`${API_URL}/api/factures/${id}/permanent`, {
      method: 'DELETE', headers: headers(),
    });
    return res.json();
  },
};