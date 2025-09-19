import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTeachers,
  getStudents,
  getClasses,
  getMessages,
  getEvents,
  getUsers,
  getParents,
  ensureTeacher,
  ensureTeacherByEmail,
  createUser,
  createStudent,
  createClass,
  createEvent,
  deleteTeacher,
  updateTeacher,
  getResults,
  createResult,
  createTeacherWithUser,
  Teacher,
} from './api';

export const qk = {
  teachers: ['teachers'] as const,
  students: ['students'] as const,
  classes: ['classes'] as const,
  messages: ['messages'] as const,
  events: ['events'] as const,
  users: ['users'] as const,
  parents: ['parents'] as const,
  results: ['results'] as const,
  resultsByStudent: (studentId: number) => ['results', 'student', studentId] as const,
};

export function useTeachers() {
  return useQuery({ queryKey: qk.teachers, queryFn: getTeachers });
}
export function useStudents() {
  return useQuery({ queryKey: qk.students, queryFn: getStudents });
}
export function useClasses() {
  return useQuery({ queryKey: qk.classes, queryFn: getClasses });
}
export function useMessages() {
  return useQuery({ queryKey: qk.messages, queryFn: getMessages });
}
export function useEvents() {
  return useQuery({ queryKey: qk.events, queryFn: getEvents });
}
export function useUsers() {
  return useQuery({ queryKey: qk.users, queryFn: getUsers });
}
export function useParents() {
  return useQuery({ queryKey: qk.parents, queryFn: getParents });
}

export function useResults(params?: { student_id?: number; term?: string; offset?: number; limit?: number }) {
  return useQuery({ queryKey: qk.results, queryFn: () => getResults(params) });
}

export function useResultsByStudent(studentId: number) {
  return useQuery({ queryKey: qk.resultsByStudent(studentId), queryFn: () => getResults({ student_id: studentId }) });
}

// Example combined mutation: create teacher (user + teacher profile)
export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; email: string; phone?: string; subjects?: string[] }) => {
      // Use the new endpoint that handles both user creation and teacher profile creation
      return createTeacherWithUser({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        subjects: payload.subjects,
        password: 'TempPass123!' // Default password for admin-created accounts
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.teachers });
      qc.invalidateQueries({ queryKey: qk.users });
    }
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.students })
  });
}
export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createClass,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.classes })
  });
}
export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.events })
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTeacher(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.teachers });
    }
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Teacher> }) => updateTeacher(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.teachers })
  });
}

export function useCreateResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createResult,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: qk.results });
      if ((variables as any)?.student_id) {
        qc.invalidateQueries({ queryKey: qk.resultsByStudent((variables as any).student_id) });
      }
    }
  });
}
