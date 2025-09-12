import { toast } from "sonner";

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
  role: "teacher" | "parent" | "admin" | string;
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
  class?: string;
  roll_no?: string;
  // Optional camelCase variant referenced in legacy code
  rollNo?: string;
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
  recipient_id?: number;
  recipient_role?: string;
  created_at: string;
  read_at?: string;
}

export interface Result {
  id: number;
  student_id: number;
  class_id?: number | null;
  teacher_id: number;
  subject: string;
  term: string;
  score: number;
  grade: string;
  date?: string;
  comments?: string;
  created_at?: string;
}

export interface Attendance {
  id: number;
  student_id: number;
  class_id?: number | null;
  teacher_id: number;
  date: string; // YYYY-MM-DD format
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceWithDetails extends Attendance {
  student_name?: string;
  class_name?: string;
  teacher_name?: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attended: number;
  percentage: number;
}

// Determine API base URL with smart defaults.
// Priority: window.__API_BASE__ (runtime) ?? VITE env var ?? defaultBase
// defaultBase = '' (same-origin) in non-localhost browsers, else 'http://localhost:8000' for dev.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isBrowser = typeof window !== "undefined";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runtimeBase = (isBrowser && (window as any).__API_BASE__) as
  | string
  | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const envBase = (import.meta as any).env?.VITE_API_BASE_URL as
  | string
  | undefined;
const isLocalhost =
  isBrowser && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
const defaultBase = isBrowser && !isLocalhost ? "" : "http://localhost:8000";
// Use nullish coalescing to allow '' (same-origin)
const API_BASE = ((runtimeBase ?? envBase ?? defaultBase) as string).replace(
  /\/$/,
  "",
);
// One-time diagnostic log (ignored by most users, helpful during deployment troubleshooting)
if (isBrowser && !(window as any).__API_BASE_LOGGED) {
  // eslint-disable-next-line no-console
  console.info("[api] Using API base:", API_BASE || "(same-origin)");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__API_BASE_LOGGED = true;
}

function getAuthToken(): string | null {
  return localStorage.getItem("authToken");
}

function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  _retried = false,
): Promise<T> {
  let token = getAuthToken();
  // Start with caller-provided headers so explicit Authorization can override any stored token
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  // Only inject Authorization from localStorage if the caller DID NOT provide one
  const hasExplicitAuth = Object.keys(baseHeaders).some(
    (k) => k.toLowerCase() === "authorization",
  );
  if (!hasExplicitAuth && token) {
    baseHeaders["Authorization"] = `Bearer ${token}`;
  }

  const doFetch = async (headers: Record<string, string>) =>
    fetch(`${API_BASE}${path}`, { ...options, headers });
  let res = await doFetch(baseHeaders);

  // Automatic 401 -> refresh retry once (skip if calling refresh or login endpoints)
  if (
    res.status === 401 &&
    !_retried &&
    !path.startsWith("/api/auth/refresh") &&
    !path.startsWith("/api/auth/login")
  ) {
    const rt = getRefreshToken();
    if (rt) {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: rt }),
        });
        if (refreshRes.ok) {
          const data: TokenResponse = await refreshRes.json();
          localStorage.setItem("authToken", data.access_token);
          localStorage.setItem("refreshToken", data.refresh_token);
          token = data.access_token;
          const retryHeaders = {
            ...baseHeaders,
            Authorization: `Bearer ${token}`,
          };
          res = await doFetch(retryHeaders);
        } else {
          // Invalidate tokens on failed refresh
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
        }
      } catch {
        // Swallow network errors here; will fall through to normal error handling
      }
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const msg = `HTTP ${res.status}: ${text}`;
    toast.error(text || `Request failed (${res.status})`);
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function login(
  email: string,
  password: string,
): Promise<TokenResponse> {
  return request<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function refresh(refresh_token: string): Promise<TokenResponse> {
  return request<TokenResponse>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token }),
  });
}

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  role: "teacher" | "parent" | "admin" | string;
}): Promise<UserMe> {
  return request<UserMe>("/api/users/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMe(token: string): Promise<UserMe> {
  return request<UserMe>("/api/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function requestEmailVerification(
  email: string,
): Promise<{ sent: boolean; verification_token?: string }> {
  return request("/api/auth/request-email-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyEmail(
  token: string,
): Promise<{ verified: boolean }> {
  return request("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function requestPasswordReset(
  email: string,
): Promise<{ sent: boolean; reset_token?: string }> {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  token: string,
  new_password: string,
): Promise<{ reset: boolean }> {
  return request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password }),
  });
}

// User Management
export async function getUsers(): Promise<UserMe[]> {
  return request<UserMe[]>("/api/users/");
}

export async function updateUser(
  userId: number,
  data: Partial<UserMe>,
): Promise<UserMe> {
  return request<UserMe>(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(
  userId: number,
): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/users/${userId}`, {
    method: "DELETE",
  });
}

// Teacher Management
export async function getTeachers(): Promise<Teacher[]> {
  return request<Teacher[]>("/api/teachers/");
}

export async function createTeacher(data: {
  user_id: number;
  phone?: string;
  subjects?: string[];
}): Promise<Teacher> {
  return request<Teacher>("/api/teachers/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTeacher(
  teacherId: number,
  data: Partial<Teacher>,
): Promise<Teacher> {
  return request<Teacher>(`/api/teachers/${teacherId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTeacher(
  teacherId: number,
): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/teachers/${teacherId}`, {
    method: "DELETE",
  });
}

// Parent Management
export async function getParents(): Promise<Parent[]> {
  return request<Parent[]>("/api/parents/");
}

export async function createParent(data: {
  user_id: number;
  phone?: string;
  profile_picture_url?: string;
}): Promise<Parent> {
  return request<Parent>("/api/parents/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateParent(
  parentId: number,
  data: Partial<Parent>,
): Promise<Parent> {
  return request<Parent>(`/api/parents/${parentId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteParent(
  parentId: number,
): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/parents/${parentId}`, {
    method: "DELETE",
  });
}

// Student Management
export async function getStudents(): Promise<Student[]> {
  return request<Student[]>("/api/students/");
}

export async function createStudent(data: {
  name: string;
  class_id?: number;
  roll_no?: string;
  parent_id?: number;
  email?: string;
  status?: string;
}): Promise<Student> {
  return request<Student>("/api/students/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateStudent(
  studentId: number,
  data: Partial<Student>,
): Promise<Student> {
  return request<Student>(`/api/students/${studentId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteStudent(
  studentId: number,
): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/students/${studentId}`, {
    method: "DELETE",
  });
}

// Class Management
export async function getClasses(): Promise<Class[]> {
  return request<Class[]>("/api/classes/");
}

export async function createClass(data: {
  name: string;
  teacher_id?: number;
  room?: string;
  subjects?: string[];
  expected_students?: number;
}): Promise<Class> {
  return request<Class>("/api/classes/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateClass(
  classId: number,
  data: Partial<Class>,
): Promise<Class> {
  return request<Class>(`/api/classes/${classId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteClass(
  classId: number,
): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/classes/${classId}`, {
    method: "DELETE",
  });
}

// Event Management
export async function getEvents(): Promise<Event[]> {
  return request<Event[]>("/api/events/");
}

export async function createEvent(data: {
  title: string;
  description?: string;
  date?: string;
  time?: string;
  type?: string;
  status?: string;
}): Promise<Event> {
  return request<Event>("/api/events/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEvent(
  eventId: number,
  data: Partial<Event>,
): Promise<Event> {
  return request<Event>(`/api/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(
  eventId: number,
): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/events/${eventId}`, {
    method: "DELETE",
  });
}

// Message Management
export async function getMessages(): Promise<Message[]> {
  return request<Message[]>("/api/messages/");
}

export async function createMessage(data: {
  subject: string;
  body?: string;
  recipient_id?: number;
  recipient_role?: string;
}): Promise<Message> {
  return request<Message>("/api/messages/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Results
export async function getResults(params?: {
  student_id?: number;
  term?: string;
  offset?: number;
  limit?: number;
}): Promise<Result[]> {
  const q = new URLSearchParams();
  if (params?.student_id != null)
    q.set("student_id", String(params.student_id));
  if (params?.term) q.set("term", params.term);
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  const path = qs ? `/api/results/?${qs}` : "/api/results/";
  return request<Result[]>(path);
}

export async function createResult(data: {
  student_id: number;
  class_id?: number | null;
  subject: string;
  term: string;
  score: number;
  grade: string;
  date?: string;
  comments?: string;
}): Promise<Result> {
  return request<Result>("/api/results/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateResult(
  resultId: number,
  data: Partial<
    Omit<Result, "id" | "student_id" | "teacher_id" | "created_at">
  >,
): Promise<Result> {
  return request<Result>(`/api/results/${resultId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteResult(
  resultId: number,
): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/results/${resultId}`, {
    method: "DELETE",
  });
}

// Attendance Management
export async function getAttendance(params?: {
  student_id?: number;
  class_id?: number;
  date?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  offset?: number;
  limit?: number;
}): Promise<AttendanceWithDetails[]> {
  const q = new URLSearchParams();
  if (params?.student_id != null)
    q.set("student_id", String(params.student_id));
  if (params?.class_id != null) q.set("class_id", String(params.class_id));
  if (params?.date) q.set("date", params.date);
  if (params?.status) q.set("status", params.status);
  if (params?.date_from) q.set("date_from", params.date_from);
  if (params?.date_to) q.set("date_to", params.date_to);
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  const path = qs ? `/api/attendance/?${qs}` : "/api/attendance/";
  return request<AttendanceWithDetails[]>(path);
}

export async function createAttendance(data: {
  student_id: number;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  class_id?: number;
  notes?: string;
}): Promise<Attendance> {
  const q = new URLSearchParams();
  q.set("student_id", String(data.student_id));
  q.set("date", data.date);
  q.set("status", data.status);
  if (data.class_id != null) q.set("class_id", String(data.class_id));
  if (data.notes) q.set("notes", data.notes);

  return request<Attendance>(`/api/attendance/?${q.toString()}`, {
    method: "POST",
  });
}

export async function updateAttendance(
  attendanceId: number,
  data: {
    status?: "present" | "absent" | "late" | "excused";
    notes?: string;
  },
): Promise<Attendance> {
  const q = new URLSearchParams();
  if (data.status) q.set("status", data.status);
  if (data.notes !== undefined) q.set("notes", data.notes);

  return request<Attendance>(
    `/api/attendance/${attendanceId}?${q.toString()}`,
    {
      method: "PATCH",
    },
  );
}

export async function deleteAttendance(
  attendanceId: number,
): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/attendance/${attendanceId}`, {
    method: "DELETE",
  });
}

export async function getAttendanceSummary(params?: {
  student_id?: number;
  class_id?: number;
  date_from?: string;
  date_to?: string;
}): Promise<AttendanceSummary> {
  const q = new URLSearchParams();
  if (params?.student_id != null)
    q.set("student_id", String(params.student_id));
  if (params?.class_id != null) q.set("class_id", String(params.class_id));
  if (params?.date_from) q.set("date_from", params.date_from);
  if (params?.date_to) q.set("date_to", params.date_to);
  const qs = q.toString();
  const path = qs ? `/api/attendance/summary?${qs}` : "/api/attendance/summary";
  return request<AttendanceSummary>(path);
}

export async function getDailyAttendance(
  date: string,
  class_id?: number,
): Promise<any[]> {
  const q = new URLSearchParams();
  if (class_id != null) q.set("class_id", String(class_id));
  const qs = q.toString();
  const path = qs
    ? `/api/attendance/daily/${date}?${qs}`
    : `/api/attendance/daily/${date}`;
  return request<any[]>(path);
}
