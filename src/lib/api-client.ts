export async function request<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  auth: {
    me: () => request('/api/auth/me'),
    login: (body: any) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body: any) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    verifyOtp: (body: any) => request('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),
    resendOtp: (body: any) => request('/api/auth/resend-otp', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request('/api/auth/logout', { method: 'POST' }),
    forgotPassword: (body: any) => request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
    resetPassword: (body: any) => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  },
  chat: {
    list: () => request('/api/chat'),
    create: () => request('/api/chat', { method: 'POST' }),
    get: (id: string) => request(`/api/chat/${id}`),
    update: (id: string, body: any) => request(`/api/chat/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request(`/api/chat/${id}`, { method: 'DELETE' }),
    send: (id: string, content: string) => request(`/api/chat/${id}/send`, { method: 'POST', body: JSON.stringify({ content }) }),
  },
  challenges: {
    list: () => request('/api/challenges'),
    start: (challengeId: string) => request('/api/challenges/start', { method: 'POST', body: JSON.stringify({ challengeId }) }),
    log: (userChallengeId: string) => request('/api/challenges/log', { method: 'POST', body: JSON.stringify({ userChallengeId }) }),
  },
  leaderboard: {
    get: () => request('/api/leaderboard'),
  },
  notifications: {
    list: () => request('/api/notifications'),
    markRead: (body?: { id: string }) => request('/api/notifications', { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  },
  profile: {
    get: () => request('/api/user/profile'),
    update: (body: any) => request('/api/user/profile', { method: 'PUT', body: JSON.stringify(body) }),
    upload: (formData: FormData) => request('/api/user/upload', { method: 'POST', body: formData }),
  },
  friends: {
    list: (search?: string) => request(`/api/friends${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    add: (email: string) => request('/api/friends', { method: 'POST', body: JSON.stringify({ email }) }),
    accept: (friendshipId: string) => request(`/api/friends/${friendshipId}`, { method: 'PATCH', body: JSON.stringify({ status: 'ACCEPTED' }) }),
    decline: (friendshipId: string) => request(`/api/friends/${friendshipId}`, { method: 'DELETE' }),
    chat: (friendId: string) => request(`/api/friends/chat/${friendId}`),
    sendDm: (friendId: string, content: string) => request(`/api/friends/chat/${friendId}`, { method: 'POST', body: JSON.stringify({ content }) }),
  },
  community: {
    verify: (claim: string) => request('/api/community/verify', { method: 'POST', body: JSON.stringify({ claim }) }),
    summarize: (text: string) => request('/api/community/summarize', { method: 'POST', body: JSON.stringify({ text }) }),
    classifyWaste: (item: string) => request('/api/community/classify-waste', { method: 'POST', body: JSON.stringify({ item }) }),
  },
  report: {
    submit: (body: any) => request('/api/report', { method: 'POST', body: JSON.stringify(body) }),
  },
  admin: {
    stats: () => request('/api/admin/stats'),
    users: () => request('/api/admin/users'),
    action: (body: any) => request('/api/admin/users', { method: 'POST', body: JSON.stringify(body) }),
    respondReport: (body: { reportId: string; responseMessage: string }) => request('/api/admin/reports', { method: 'POST', body: JSON.stringify(body) }),
  },
};
