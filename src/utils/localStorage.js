// Local Storage Utility for School Management System

// Initialize default data structure
export const initializeLocalStorage = () => {
  const defaultData = {
    teachers: [
      {
        id: 'T001',
        name: 'Mrs. Adebayo Oluwaseun',
        subjects: ['Mathematics', 'Further Mathematics'],
        classes: ['JSS1 A', 'JSS2 B'],
        email: 'oluwaseun.adebayo@faith-life.edu.ng',
        status: 'Active',
        phone: '+234 803 456 7890'
      },
      {
        id: 'T002',
        name: 'Dr. Oladele Babatunde',
        subjects: ['Physics', 'Chemistry'],
        classes: ['SS1 A', 'SS2 A'],
        email: 'babatunde.oladele@faith-life.edu.ng',
        status: 'Active',
        phone: '+234 805 123 4567'
      },
      {
        id: 'T003',
        name: 'Mr. Ogundimu Ayodeji',
        subjects: ['English Language', 'Literature'],
        classes: ['JSS3 B', 'SS1 C'],
        email: 'ayodeji.ogundimu@faith-life.edu.ng',
        status: 'On Leave',
        phone: '+234 807 890 1234'
      }
    ],
    students: [
      {
        id: 'S001',
        name: 'Temilade Ogunkoya',
        class: 'JSS2 A',
        rollNo: 'JSS2A/001',
        parentId: 'P001',
        email: 'temilade.ogunkoya@student.faith-life.edu.ng',
        status: 'Active',
        results: {
          'Mathematics': { CA: 15, Exam: 70, Total: 85, Grade: 'A' },
          'English': { CA: 18, Exam: 65, Total: 83, Grade: 'A' },
          'Physics': { CA: 14, Exam: 68, Total: 82, Grade: 'A' }
        },
        attendance: { present: 145, total: 160, percentage: 90.6 }
      },
      {
        id: 'S002',
        name: 'Olumide Ogunkoya',
        class: 'SS1 B',
        rollNo: 'SS1B/015',
        parentId: 'P001',
        email: 'olumide.ogunkoya@student.faith-life.edu.ng',
        status: 'Active',
        results: {
          'Mathematics': { CA: 16, Exam: 72, Total: 88, Grade: 'A' },
          'Chemistry': { CA: 15, Exam: 69, Total: 84, Grade: 'A' },
          'Biology': { CA: 17, Exam: 71, Total: 88, Grade: 'A' }
        },
        attendance: { present: 152, total: 160, percentage: 95.0 }
      },
      {
        id: 'S003',
        name: 'Chidinma Okoro',
        class: 'JSS3 B',
        rollNo: 'JSS3B/008',
        parentId: 'P002',
        email: 'chidinma.okoro@student.faith-life.edu.ng',
        status: 'Active',
        results: {
          'Mathematics': { CA: 17, Exam: 75, Total: 92, Grade: 'A' },
          'English': { CA: 19, Exam: 73, Total: 92, Grade: 'A' },
          'Science': { CA: 18, Exam: 74, Total: 92, Grade: 'A' }
        },
        attendance: { present: 148, total: 160, percentage: 92.5 }
      }
    ],
    parents: [
      {
        id: 'P001',
        name: 'Mr. Babatunde Ogunkoya',
        email: 'babatunde.ogunkoya@gmail.com',
        phone: '+234 803 123 4567',
        children: ['S001', 'S002'],
        status: 'Active',
        profilePicture: null
      },
      {
        id: 'P002',
        name: 'Mrs. Ngozi Okoro',
        email: 'ngozi.okoro@yahoo.com',
        phone: '+234 805 987 6543',
        children: ['S003'],
        status: 'Active',
        profilePicture: null
      }
    ],
    classes: [
      {
        id: 'C001',
        name: 'JSS1 A',
        students: 35,
        teacherId: 'T001',
        subjects: ['Mathematics', 'English', 'Science', 'Social Studies'],
        room: 'Block A-101'
      },
      {
        id: 'C002',
        name: 'JSS2 A',
        students: 33,
        teacherId: 'T001',
        subjects: ['Mathematics', 'English', 'Science', 'Social Studies'],
        room: 'Block A-102'
      },
      {
        id: 'C003',
        name: 'JSS3 B',
        students: 32,
        teacherId: 'T003',
        subjects: ['Mathematics', 'English', 'Science', 'Social Studies'],
        room: 'Block B-101'
      },
      {
        id: 'C004',
        name: 'SS1 A',
        students: 30,
        teacherId: 'T002',
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'],
        room: 'Block C-101'
      }
    ],
    events: [
      {
        id: 'E001',
        title: 'PTA Meeting',
        description: 'Quarterly Parent-Teacher Association meeting',
        date: '2025-01-20',
        time: '10:00 AM',
        type: 'meeting',
        status: 'scheduled'
      },
      {
        id: 'E002',
        title: 'Sports Day',
        description: 'Annual sports competition for all classes',
        date: '2025-02-15',
        time: '8:00 AM',
        type: 'event',
        status: 'scheduled'
      }
    ],
    messages: [
      {
        id: 'M001',
        from: 'P001',
        to: 'T001',
        fromName: 'Mr. Babatunde Ogunkoya',
        toName: 'Mrs. Adebayo Oluwaseun',
        subject: 'Regarding Temilade\'s Mathematics performance',
        content: 'I would like to discuss my daughter\'s progress in Mathematics.',
        date: '2025-01-10',
        status: 'unread',
        type: 'parent-to-teacher'
      },
      {
        id: 'M002',
        from: 'T001',
        to: 'A001',
        fromName: 'Mrs. Adebayo Oluwaseun',
        toName: 'Dr. Folake Adeyemi',
        subject: 'Class Equipment Request',
        content: 'We need additional calculators for the Mathematics class.',
        date: '2025-01-12',
        status: 'read',
        type: 'teacher-to-admin'
      }
    ],
    attendance: {
      'S001': [
        { date: '2025-01-08', status: 'present' },
        { date: '2025-01-09', status: 'present' },
        { date: '2025-01-10', status: 'absent' }
      ],
      'S002': [
        { date: '2025-01-08', status: 'present' },
        { date: '2025-01-09', status: 'present' },
        { date: '2025-01-10', status: 'present' }
      ],
      'S003': [
        { date: '2025-01-08', status: 'present' },
        { date: '2025-01-09', status: 'present' },
        { date: '2025-01-10', status: 'present' }
      ]
    }
  };

  // Initialize if not exists
  Object.keys(defaultData).forEach(key => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(defaultData[key]));
    }
  });
};

// Generic storage operations
export const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting ${key} from storage:`, error);
    return null;
  }
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
    return false;
  }
};

// Specific entity operations
export const getTeachers = () => getFromStorage('teachers') || [];
export const saveTeachers = (teachers) => saveToStorage('teachers', teachers);

export const getStudents = () => getFromStorage('students') || [];
export const saveStudents = (students) => saveToStorage('students', students);

export const getParents = () => getFromStorage('parents') || [];
export const saveParents = (parents) => saveToStorage('parents', parents);

export const getClasses = () => getFromStorage('classes') || [];
export const saveClasses = (classes) => saveToStorage('classes', classes);

export const getEvents = () => getFromStorage('events') || [];
export const saveEvents = (events) => saveToStorage('events', events);

export const getMessages = () => getFromStorage('messages') || [];
export const saveMessages = (messages) => saveToStorage('messages', messages);

export const getAttendance = () => getFromStorage('attendance') || {};
export const saveAttendance = (attendance) => saveToStorage('attendance', attendance);

// Helper functions
export const generateId = (prefix) => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `${prefix}${timestamp}${random}`.toUpperCase();
};

export const addTeacher = (teacher) => {
  const teachers = getTeachers();
  const newTeacher = { ...teacher, id: generateId('T'), status: 'Active' };
  teachers.push(newTeacher);
  return saveTeachers(teachers);
};

export const updateTeacher = (teacherId, updates) => {
  const teachers = getTeachers();
  const index = teachers.findIndex(t => t.id === teacherId);
  if (index !== -1) {
    teachers[index] = { ...teachers[index], ...updates };
    return saveTeachers(teachers);
  }
  return false;
};

export const deleteTeacher = (teacherId) => {
  const teachers = getTeachers();
  const filtered = teachers.filter(t => t.id !== teacherId);
  return saveTeachers(filtered);
};

export const addStudent = (student) => {
  const students = getStudents();
  const newStudent = { 
    ...student, 
    id: generateId('S'), 
    status: 'Active',
    results: {},
    attendance: { present: 0, total: 0, percentage: 0 }
  };
  students.push(newStudent);
  return saveStudents(students);
};

export const updateStudent = (studentId, updates) => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1) {
    students[index] = { ...students[index], ...updates };
    return saveStudents(students);
  }
  return false;
};

export const addClass = (classData) => {
  const classes = getClasses();
  const newClass = { ...classData, id: generateId('C') };
  classes.push(newClass);
  return saveClasses(classes);
};

export const updateClass = (classId, updates) => {
  const classes = getClasses();
  const index = classes.findIndex(c => c.id === classId);
  if (index !== -1) {
    classes[index] = { ...classes[index], ...updates };
    return saveClasses(classes);
  }
  return false;
};

export const addEvent = (event) => {
  const events = getEvents();
  const newEvent = { ...event, id: generateId('E'), status: 'scheduled' };
  events.push(newEvent);
  return saveEvents(events);
};

export const sendMessage = (message) => {
  const messages = getMessages();
  const newMessage = { 
    ...message, 
    id: generateId('M'), 
    date: new Date().toISOString().split('T')[0],
    status: 'unread'
  };
  messages.push(newMessage);
  return saveMessages(messages);
};

export const markAttendance = (studentId, date, status) => {
  const attendance = getAttendance();
  if (!attendance[studentId]) {
    attendance[studentId] = [];
  }
  
  // Remove existing entry for the same date
  attendance[studentId] = attendance[studentId].filter(a => a.date !== date);
  
  // Add new entry
  attendance[studentId].push({ date, status });
  
  // Update student's attendance summary
  const students = getStudents();
  const studentIndex = students.findIndex(s => s.id === studentId);
  if (studentIndex !== -1) {
    const studentAttendance = attendance[studentId];
    const total = studentAttendance.length;
    const present = studentAttendance.filter(a => a.status === 'present').length;
    const percentage = total > 0 ? (present / total) * 100 : 0;
    
    students[studentIndex].attendance = { present, total, percentage: Math.round(percentage * 10) / 10 };
    saveStudents(students);
  }
  
  return saveAttendance(attendance);
};

// Parent management functions
export const addParent = (parentData) => {
  const parents = getParents();
  const newParent = {
    id: generateId(),
    ...parentData,
    profilePicture: null
  };
  parents.push(newParent);
  return saveParents(parents);
};

export const updateParent = (parentId, updates) => {
  const parents = getParents();
  const parentIndex = parents.findIndex(p => p.id === parentId);
  if (parentIndex !== -1) {
    parents[parentIndex] = { ...parents[parentIndex], ...updates };
    return saveParents(parents);
  }
  return false;
};

export const updateParentProfilePicture = (parentId, profilePictureData) => {
  return updateParent(parentId, { profilePicture: profilePictureData });
};

export const getParentById = (parentId) => {
  const parents = getParents();
  return parents.find(p => p.id === parentId) || null;
};

// File to base64 conversion utility
export const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
