const BASE_URL = import.meta.env.VITE_API_URL || "/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http") ? path : BASE_URL + path;

  const r = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`HTTP ${r.status}: ${text}`);
  }

  if (r.status === 204) return null; 
  try {
    return await r.json();
  } catch {
    return null;
  }
}

export const api = {
  get(path: string) {
    return request(path, { method: "GET" });
  },
  post(path: string, body: any) {
    return request(path, { method: "POST", body: JSON.stringify(body) });
  },
  put(path: string, body: any) {
    return request(path, { method: "PUT", body: JSON.stringify(body) });
  },
  delete(path: string) {
    return request(path, { method: "DELETE" });
  },
};

