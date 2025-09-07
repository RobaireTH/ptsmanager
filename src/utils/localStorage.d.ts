export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  classes: string[];
  status: string;
}

export interface Student {
  id: string;
  name: string;
  class: string;
  rollNo: string;
  email: string;
  parentId: string;
  status: string;
}

export interface ClassItem {
  id: string;
  name: string;
  teacherId: string;
  teacherName?: string;
  subjects: string[];
  room: string;
  students: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: string;
}

export interface Message {
  id: string;
  subject: string;
  recipient: string;
  content: string;
  date: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  children: string[];
  status: string;
  profilePicture?: string | null;
  childrenDetails?: Array<{
    id: string;
    name: string;
    class: string;
    rollNo: string;
  }>;
}

export function initializeLocalStorage(): void;
export function getTeachers(): Teacher[];
export function saveTeachers(teachers: Teacher[]): void;
export function getStudents(): Student[];
export function saveStudents(students: Student[]): void;
export function getParents(): Parent[];
export function saveParents(parents: Parent[]): void;
export function getClasses(): ClassItem[];
export function saveClasses(classes: ClassItem[]): void;
export function getEvents(): Event[];
export function saveEvents(events: Event[]): void;
export function getMessages(): Message[];
export function saveMessages(messages: Message[]): void;
export function addTeacher(teacher: Omit<Teacher, 'id'>): boolean;
export function updateTeacher(id: string, updates: Partial<Teacher>): boolean;
export function deleteTeacher(id: string): boolean;
export function addStudent(student: Omit<Student, 'id'>): boolean;
export function addClass(classItem: Omit<ClassItem, 'id'>): boolean;
export function addEvent(event: Omit<Event, 'id'>): boolean;
export function sendMessage(message: Omit<Message, 'id'>): boolean;
export function addParent(parent: Omit<Parent, 'id'>): boolean;
export function updateParent(id: string, updates: Partial<Parent>): boolean;
export function updateParentProfilePicture(parentId: string, profilePictureData: string): boolean;
export function getParentById(parentId: string): Parent | null;
export function convertFileToBase64(file: File): Promise<string>;
export function generateId(): string;
