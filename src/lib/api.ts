import { toast } from 'sonner';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface UserMe {
  id: number;
  name: string;
  email: string;
  role: 'teacher' | 'parent' | 'admin' | string;
  status: string;
  email_verified: boolean;
}

export interface Teacher {
  id: number;
  user_id: number;
  phone?: string;
  subjects?: string[];
  status?: string;
}

export interface Parent {
  id: number;
  user_id: number;
  phone?: string;
  profile_picture_url?: string;
}

export interface Student {
  id: number;
  name: string;
  class_id?: number;
  roll_no?: string;
  parent_id?: number;
  email?: string;
  status?: string;
}

export interface Class {
  id: number;
  name: string;
  teacher_id?: number;
  room?: string;
  subjects?: string[];
  expected_students?: number;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  date?: string;
  time?: string;
  type?: string;
  status?: string;
}

export interface Message {
  id: number;
  subject: string;
  body?: string;
  sender_id: number;
  recipient_role?: string;
  created_at: string;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8000';

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

function getRefreshToken(): string | null { return localStorage.getItem('refreshToken'); }

async function request<T>(path: string, options: RequestInit = {}, _retried = false): Promise<T> {
  let token = getAuthToken();
  // Start with caller-provided headers so explicit Authorization can override any stored token
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string,string>) || {}),
  };
  // Only inject Authorization from localStorage if the caller DID NOT provide one
  const hasExplicitAuth = Object.keys(baseHeaders).some(k => k.toLowerCase() === 'authorization');
  if (!hasExplicitAuth && token) {
    baseHeaders['Authorization'] = `Bearer ${token}`;
  }

  const doFetch = async (headers: Record<string,string>) => fetch(`${API_BASE}${path}`, { ...options, headers });
  let res = await doFetch(baseHeaders);

  // Automatic 401 -> refresh retry once (skip if calling refresh or login endpoints)
  if (res.status === 401 && !_retried && !path.startsWith('/api/auth/refresh') && !path.startsWith('/api/auth/login')) {
    const rt = getRefreshToken();
    if (rt) {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt })
        });
        if (refreshRes.ok) {
          const data: TokenResponse = await refreshRes.json();
          localStorage.setItem('authToken', data.access_token);
          localStorage.setItem('refreshToken', data.refresh_token);
          token = data.access_token;
          const retryHeaders = { ...baseHeaders, Authorization: `Bearer ${token}` };
          res = await doFetch(retryHeaders);
        } else {
          // Invalidate tokens on failed refresh
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
        }
      } catch {
        // Swallow network errors here; will fall through to normal error handling
      }
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const msg = `HTTP ${res.status}: ${text}`;
    toast.error(text || `Request failed (${res.status})`);
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  return request<TokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function refresh(refresh_token: string): Promise<TokenResponse> {
  return request<TokenResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  });
}

export async function createUser(payload: { name: string; email: string; password: string; role: 'teacher' | 'parent' | 'admin' | string; }): Promise<UserMe> {
  return request<UserMe>('/api/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe(token: string): Promise<UserMe> {
  return request<UserMe>('/api/users/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function requestEmailVerification(email: string): Promise<{ sent: boolean; verification_token?: string }>{
  return request('/api/auth/request-email-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyEmail(token: string): Promise<{ verified: boolean }>{
  return request('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function requestPasswordReset(email: string): Promise<{ sent: boolean; reset_token?: string }>{
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, new_password: string): Promise<{ reset: boolean }>{
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password }),
  });
}

// User Management
export async function getUsers(): Promise<UserMe[]> {
  return request<UserMe[]>('/api/users/');
}

export async function updateUser(userId: number, data: Partial<UserMe>): Promise<UserMe> {
  return request<UserMe>(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: number): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/users/${userId}`, {
    method: 'DELETE',
  });
}

// Teacher Management
export async function getTeachers(): Promise<Teacher[]> {
  return request<Teacher[]>('/api/teachers/');
}

export async function createTeacher(data: { user_id: number; phone?: string; subjects?: string[] }): Promise<Teacher> {
  return request<Teacher>('/api/teachers/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTeacher(teacherId: number, data: Partial<Teacher>): Promise<Teacher> {
  return request<Teacher>(`/api/teachers/${teacherId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTeacher(teacherId: number): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/teachers/${teacherId}`, {
    method: 'DELETE',
  });
}

// Parent Management
export async function getParents(): Promise<Parent[]> {
  return request<Parent[]>('/api/parents/');
}

export async function createParent(data: { user_id: number; phone?: string; profile_picture_url?: string }): Promise<Parent> {
  return request<Parent>('/api/parents/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateParent(parentId: number, data: Partial<Parent>): Promise<Parent> {
  return request<Parent>(`/api/parents/${parentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteParent(parentId: number): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/parents/${parentId}`, {
    method: 'DELETE',
  });
}

// Student Management
export async function getStudents(): Promise<Student[]> {
  return request<Student[]>('/api/students/');
}

export async function createStudent(data: { name: string; class_id?: number; roll_no?: string; parent_id?: number; email?: string; status?: string }): Promise<Student> {
  return request<Student>('/api/students/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStudent(studentId: number, data: Partial<Student>): Promise<Student> {
  return request<Student>(`/api/students/${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteStudent(studentId: number): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/students/${studentId}`, {
    method: 'DELETE',
  });
}

// Class Management
export async function getClasses(): Promise<Class[]> {
  return request<Class[]>('/api/classes/');
}

export async function createClass(data: { name: string; teacher_id?: number; room?: string; subjects?: string[]; expected_students?: number }): Promise<Class> {
  return request<Class>('/api/classes/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClass(classId: number, data: Partial<Class>): Promise<Class> {
  return request<Class>(`/api/classes/${classId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteClass(classId: number): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/classes/${classId}`, {
    method: 'DELETE',
  });
}

// Event Management
export async function getEvents(): Promise<Event[]> {
  return request<Event[]>('/api/events/');
}

export async function createEvent(data: { title: string; description?: string; date?: string; time?: string; type?: string; status?: string }): Promise<Event> {
  return request<Event>('/api/events/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEvent(eventId: number, data: Partial<Event>): Promise<Event> {
  return request<Event>(`/api/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(eventId: number): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/events/${eventId}`, {
    method: 'DELETE',
  });
}

// Message Management
export async function getMessages(): Promise<Message[]> {
  return request<Message[]>('/api/messages/');
}

export async function createMessage(data: { subject: string; body?: string; recipient_role?: string }): Promise<Message> {
  return request<Message>('/api/messages/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
