const BASE = import.meta.env.VITE_API_BASE || "";

function getToken() {
  return localStorage.getItem("auth_token") || "";
}

async function http(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `${res.status}` }));
    throw new Error(err.error || `${method} ${path} → ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export async function http_upload(path, file, fieldName = "file") {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const form = new FormData();
  form.append(fieldName, file);

  const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: form, credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `${res.status}` }));
    throw new Error(err.error || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export const http_get = (p) => http("GET", p);
export const http_post = (p, b) => http("POST", p, b);
export const http_put = (p, b) => http("PUT", p, b);
export const http_del = (p) => http("DELETE", p);
