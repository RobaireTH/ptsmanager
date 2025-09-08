import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PhoneInput } from './ui/phone-input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Users, GraduationCap, UserCheck, School, TrendingUp, AlertCircle, Search, Plus, Edit, Trash2, Bell, MessageSquare } from 'lucide-react';
import { createTeacher, updateTeacher, deleteTeacher, createStudent, createClass, createEvent, createUser, updateStudent, updateClass, createParent, Teacher } from '../lib/api'; // createUser reserved for future admin user creation
import { 
  useTeachers,
  useStudents,
  useParents,
  useClasses,
  useEvents,
  useMessages,
  useUsers,
  useCreateTeacher,
  useCreateStudent,
  useCreateClass,
  useCreateEvent,
  useDeleteTeacher,
  useUpdateTeacher,
  qk
} from '../lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { createTeacherSchema } from '../validation/teacher';

interface AdminDashboardProps {
  userData: {
    name: string;
    role: string;
  };
  onLogout: () => void;
}

export function AdminDashboard({ userData, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: parents = [], isLoading: parentsLoading } = useParents();
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: messages = [], isLoading: messagesLoading } = useMessages();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const loading = teachersLoading || studentsLoading || parentsLoading || classesLoading || eventsLoading || messagesLoading || usersLoading;
  const error = undefined; // central toast handles errors
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);

  // Form states
  const [newTeacher, setNewTeacher] = useState({
    name: '', email: '', phone: '', subjects: '', classes: ''
  });
  const [newStudent, setNewStudent] = useState({
    name: '', classId: '', roll_no: '', parentEmail: '', email: ''
  });
  const [newClass, setNewClass] = useState({
    name: '', teacherId: '', subjects: '', room: '', students: '0'
  });
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', date: '', time: '', type: 'meeting'
  });

  const createTeacherMutation = useCreateTeacher();
  const createStudentMutation = useCreateStudent();
  const createClassMutation = useCreateClass();
  const createEventMutation = useCreateEvent();
  const deleteTeacherMutation = useDeleteTeacher();
  const updateTeacherMutation = useUpdateTeacher();
  const qc = useQueryClient();

  // Editing state
  const [editStudent, setEditStudent] = useState<{ id: number; name: string; classId: string; parentEmail: string; roll_no?: string; email?: string } | null>(null);
  const [editClass, setEditClass] = useState<{ id: number; name: string; teacherId: string } | null>(null);

  // Helper accessors for teacher related user data
  const teacherName = (t: Teacher) => users.find(u=>u.id===t.user_id)?.name || 'Unknown';
  const teacherEmail = (t: Teacher) => users.find(u=>u.id===t.user_id)?.email || 'Unknown';
  const teacherStatus = (t: Teacher) => t.status || users.find(u=>u.id===t.user_id)?.status || 'Unknown';

  // Calculate dynamic stats
  const schoolStats = {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalParents: parents.length,
    totalClasses: classes.length,
    attendanceRate: 93.8, // Default value, could be calculated from actual data
    averageGrade: 78.5 // Default value, could be calculated from actual data
  };

  const handleAddTeacher = async () => {
    // Validate input
    const parsed = createTeacherSchema.safeParse(newTeacher);
    if (!parsed.success) {
      toast.error(parsed.error.issues.map(i=>i.message).join(', '));
      return;
    }
    
    try {
      await createTeacherMutation.mutateAsync({
        name: newTeacher.name,
        email: newTeacher.email,
        phone: newTeacher.phone,
        subjects: newTeacher.subjects.split(',').map(s=>s.trim()).filter(Boolean)
      });
      setNewTeacher({ name: '', email: '', phone: '', subjects: '', classes: '' });
      setIsAddTeacherOpen(false);
      toast.success('Teacher added');
    } catch (err: any) {
      console.error('Error adding teacher:', err);
  toast.error(err.message || 'Failed to add teacher');
    }
  };

  const handleDeleteTeacher = async (teacherId: number) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    
    try {
  await deleteTeacherMutation.mutateAsync(teacherId);
  toast.success('Teacher deleted');
    } catch (err: any) {
      console.error('Error deleting teacher:', err);
  toast.error(err.message || 'Failed to delete teacher');
    }
  };

  const handleUpdateTeacherStatus = async (teacherId: number, status: string) => {
    try {
  await updateTeacherMutation.mutateAsync({ id: teacherId, data: { status } });
  toast.success('Status updated');
    } catch (err: any) {
      console.error('Error updating teacher status:', err);
  toast.error(err.message || 'Failed to update teacher status');
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name) return;
    try {
      let parentId: number | undefined = undefined;
      const parentEmail = (newStudent.parentEmail || '').trim().toLowerCase();
      if (parentEmail) {
        const user = users.find(u => u.email.toLowerCase() === parentEmail && u.role === 'parent');
        if (!user) {
          toast.error('Parent user not found for provided email');
          return;
        }
        let parent = parents.find(p => p.user_id === user.id);
        if (!parent) {
          // Create parent record (admin-only)
          parent = await createParent({ user_id: user.id });
          await qc.invalidateQueries({ queryKey: qk.parents });
        }
        parentId = parent.id;
      }

      const classIdNum = newStudent.classId ? Number(newStudent.classId) : undefined;

      await createStudentMutation.mutateAsync({
        name: newStudent.name,
        class_id: classIdNum,
        roll_no: newStudent.roll_no || undefined,
        parent_id: parentId,
        email: newStudent.email || undefined,
        status: 'active'
      } as any);
      setNewStudent({ name: '', classId: '', roll_no: '', parentEmail: '', email: '' });
      setIsAddStudentOpen(false);
      toast.success('Student added');
    } catch (e:any) {
      toast.error(e.message || 'Failed to add student');
    }
  };

  const handleAddClass = async () => {
    if (!newClass.name) return;
    try {
      await createClassMutation.mutateAsync({
        name: newClass.name,
        teacher_id: newClass.teacherId ? Number(newClass.teacherId) : undefined,
        room: newClass.room || undefined,
        expected_students: newClass.students ? Number(newClass.students) : 0,
        subjects: newClass.subjects.split(',').map(s=>s.trim()).filter(Boolean)
      });
  setNewClass({ name: '', teacherId: '', subjects: '', room: '', students: '0' });
  setIsAddClassOpen(false);
  toast.success('Class added');
    } catch(e:any){
  toast.error(e.message || 'Failed to add class');
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title) return;
    try {
      await createEventMutation.mutateAsync({
        title: newEvent.title,
        description: newEvent.description || undefined,
        date: newEvent.date || undefined,
        time: newEvent.time || undefined,
        type: newEvent.type || 'meeting'
      });
  setNewEvent({ title: '', description: '', date: '', time: '', type: 'meeting' });
  setIsAddEventOpen(false);
  toast.success('Event added');
    } catch(e:any){
  toast.error(e.message || 'Failed to add event');
    }
  };

  // Save edits for student (assign class and link parent)
  const handleSaveStudentEdit = async () => {
    if (!editStudent) return;
    try {
      // Resolve parent linkage
      let parentIdPayload: number | null | undefined = undefined;
      const parentEmail = (editStudent.parentEmail || '').trim().toLowerCase();
      if (parentEmail === '') {
        parentIdPayload = null; // unlink
      } else if (parentEmail) {
        const user = users.find(u => u.email.toLowerCase() === parentEmail && u.role === 'parent');
        if (!user) {
          toast.error('Parent user not found for provided email');
          return;
        }
        let parent = parents.find(p => p.user_id === user.id);
        if (!parent) {
          parent = await createParent({ user_id: user.id });
          await qc.invalidateQueries({ queryKey: qk.parents });
        }
        parentIdPayload = parent.id;
      }

      const classIdPayload = editStudent.classId ? Number(editStudent.classId) : null;

      await updateStudent(editStudent.id, {
        class_id: classIdPayload as any,
        parent_id: parentIdPayload as any,
        roll_no: editStudent.roll_no,
        email: editStudent.email,
      });

      await qc.invalidateQueries({ queryKey: qk.students });
      setIsEditStudentOpen(false);
      setEditStudent(null);
      toast.success('Student updated');
    } catch (e:any) {
      toast.error(e.message || 'Failed to update student');
    }
  };

  // Save edits for class (assign teacher)
  const handleSaveClassEdit = async () => {
    if (!editClass) return;
    try {
      const teacherIdPayload = editClass.teacherId ? Number(editClass.teacherId) : null;
      await updateClass(editClass.id, { teacher_id: teacherIdPayload as any });
      await qc.invalidateQueries({ queryKey: qk.classes });
      setIsEditClassOpen(false);
      setEditClass(null);
      toast.success('Class updated');
    } catch (e:any) {
      toast.error(e.message || 'Failed to update class');
    }
  };

  // Dynamic notifications and activities
  const generateNotifications = () => {
    const notifications = [];
    
    // Check for classes with low expected enrollment
    classes.forEach(classItem => {
      const expected = classItem.expected_students || 0;
      if (expected > 0 && expected < 25) {
        notifications.push({
          id: `low-expected-${classItem.id}`,
          type: 'warning',
          title: 'Low Expected Enrollment',
          message: `${classItem.name} expects only ${expected} students`,
          date: new Date().toISOString().split('T')[0],
          read: false
        });
      }
    });

    // Check for teachers on leave
  const onLeaveTeachers = teachers.filter(t => (t.status||'').toLowerCase() === 'on_leave');
    if (onLeaveTeachers.length > 0) {
      notifications.push({
        id: 'teachers-on-leave',
        type: 'info',
        title: 'Teachers on Leave',
        message: `${onLeaveTeachers.length} teacher(s) currently on leave`,
        date: new Date().toISOString().split('T')[0],
        read: false
      });
    }

    return notifications;
  };

  const generateRecentActivities = () => {
    const activities: Array<{time: string, activity: string, type: string}> = [];
    
    // Recent teacher additions
  teachers.slice(-3).forEach(() => {
      activities.push({
        time: '10:30 AM',
        activity: `Teacher profile updated`,
        type: 'registration'
      });
    });

    // Recent student additions
    students.slice(-2).forEach(student => {
      const cls = classes.find(c => c.id === (student as any).class_id);
      activities.push({
        time: '09:45 AM',
        activity: `Student enrolled: ${student.name}${cls ? ` (${cls.name})` : ''}`,
        type: 'registration'
      });
    });

    return activities.slice(0, 4);
  };

  const notifications = generateNotifications();
  const recentActivities = generateRecentActivities();
  const unreadNotifications = notifications.filter(notif => !notif.read).length;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt={userData.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(userData.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg sm:text-xl">Welcome, {userData.name}</h1>
                <p className="text-muted-foreground text-sm sm:text-base">Administrator Dashboard - Faith-Life International College</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadNotifications > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-2">
                    <h4 className="font-medium">Notifications</h4>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div key={notification.id} className={`p-2 rounded-md border ${!notification.read ? 'bg-accent' : 'bg-background'}`}>
                          <div className="flex items-start gap-2">
                            <AlertCircle className={`h-4 w-4 mt-1 ${
                              notification.type === 'urgent' ? 'text-red-500' : 
                              notification.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                            }`} />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-xs text-muted-foreground">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notification.date}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="outline" onClick={onLogout} className="whitespace-nowrap">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="container mx-auto px-4 py-2">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Loading Display */}
      {loading && (
        <div className="container mx-auto px-4 py-2">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
              Loading...
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-muted-foreground">Students</p>
                  <p className="font-medium">{schoolStats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-muted-foreground">Teachers</p>
                  <p className="font-medium">{schoolStats.totalTeachers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-muted-foreground">Parents</p>
                  <p className="font-medium">{schoolStats.totalParents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-muted-foreground">Classes</p>
                  <p className="font-medium">{schoolStats.totalClasses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-muted-foreground">Attendance</p>
                  <p className="font-medium">{schoolStats.attendanceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-muted-foreground">Avg Grade</p>
                  <p className="font-medium">{schoolStats.averageGrade}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="grid grid-cols-6 min-w-fit w-full sm:w-auto">
              <TabsTrigger value="overview" className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">Overview</TabsTrigger>
              <TabsTrigger value="teachers" className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">Teachers</TabsTrigger>
              <TabsTrigger value="students" className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">Students</TabsTrigger>
              <TabsTrigger value="parents" className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">Parents</TabsTrigger>
              <TabsTrigger value="classes" className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">Classes</TabsTrigger>
              <TabsTrigger value="reports" className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">Reports</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest activities across the school system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 border rounded-lg">
                          <div className="bg-primary text-primary-foreground rounded-lg px-2 py-1 text-xs w-fit">
                            {activity.time}
                          </div>
                          <p className="flex-1 text-sm">{activity.activity}</p>
                          <Badge variant="outline" className="w-fit">{activity.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>Important alerts and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.slice(0, 4).map((notification) => (
                      <div key={notification.id} className="border rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className={`h-4 w-4 mt-1 ${
                            notification.type === 'urgent' ? 'text-red-500' : 
                            notification.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-muted-foreground text-xs">{notification.message}</p>
                            <p className="text-muted-foreground text-xs mt-1">{notification.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Teacher Management</CardTitle>
                    <CardDescription>Manage teaching staff and their assignments</CardDescription>
                  </div>
                  <Dialog open={isAddTeacherOpen} onOpenChange={setIsAddTeacherOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Teacher
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Teacher</DialogTitle>
                        <DialogDescription>Create a new teacher profile</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input 
                              placeholder="Enter teacher's name" 
                              value={newTeacher.name}
                              onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input 
                              type="email" 
                              placeholder="Enter email address" 
                              value={newTeacher.email}
                              onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <PhoneInput
                            label="Phone"
                            placeholder="Enter phone number"
                            value={newTeacher.phone}
                            onChange={(value) => setNewTeacher({...newTeacher, phone: value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Subjects</Label>
                          <Input 
                            placeholder="Enter subjects (comma separated)" 
                            value={newTeacher.subjects}
                            onChange={(e) => setNewTeacher({...newTeacher, subjects: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Classes</Label>
                          <Input 
                            placeholder="Enter classes (comma separated)" 
                            value={newTeacher.classes}
                            onChange={(e) => setNewTeacher({...newTeacher, classes: e.target.value})}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setIsAddTeacherOpen(false)} className="flex-1">
                            Cancel
                          </Button>
                          <Button onClick={handleAddTeacher} className="flex-1">Add Teacher</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profile</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Subjects</TableHead>
                        <TableHead className="hidden md:table-cell">Classes</TableHead>
                        <TableHead className="hidden lg:table-cell">Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachers.length === 0 && !teachersLoading && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-6">Nothing to see here</TableCell>
                        </TableRow>
                      )}
                      {teachers.filter(teacher => {
                        const name = teacherName(teacher).toLowerCase();
                        const email = teacherEmail(teacher).toLowerCase();
                        const q = searchQuery.toLowerCase();
                        return name.includes(q) || email.includes(q);
                      }).map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" alt={teacherName(teacher)} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {getInitials(teacherName(teacher))}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <p>{teacherName(teacher)}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">{(teacher.subjects||[]).join(', ')}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {(teacher.subjects||[]).map((subject, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">{subject}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {/* classes not implemented */}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{teacherEmail(teacher)}</TableCell>
                          <TableCell>
                            <Select
                              value={teacherStatus(teacher)}
                              onValueChange={(value: string) => handleUpdateTeacherStatus(teacher.id, value)}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="on_leave">On Leave</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteTeacher(teacher.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Student Management</CardTitle>
                    <CardDescription>Manage student records and information</CardDescription>
                  </div>
                  <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>Register a new student</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input 
                              placeholder="Enter student's name" 
                              value={newStudent.name}
                              onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Class</Label>
                            <Select
                              value={newStudent.classId}
                              onValueChange={(value: string) => setNewStudent({ ...newStudent, classId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                              <SelectContent>
                                {classes.map((c) => (
                                  <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Roll Number</Label>
                            <Input 
                              placeholder="e.g., SS1A/001" 
                              value={newStudent.roll_no}
                              onChange={(e) => setNewStudent({...newStudent, roll_no: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Student Email</Label>
                            <Input 
                              type="email"
                              placeholder="student@school.edu.ng" 
                              value={newStudent.email}
                              onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Parent Email</Label>
                          <Input 
                            type="email"
                            placeholder="parent@email.com" 
                            value={newStudent.parentEmail}
                            onChange={(e) => setNewStudent({...newStudent, parentEmail: e.target.value})}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setIsAddStudentOpen(false)} className="flex-1">
                            Cancel
                          </Button>
                          <Button onClick={handleAddStudent} className="flex-1">Add Student</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profile</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Class</TableHead>
                        <TableHead className="hidden md:table-cell">Roll No</TableHead>
                        <TableHead className="hidden lg:table-cell">Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.length === 0 && !studentsLoading && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nothing to see here</TableCell>
                        </TableRow>
                      )}
                      {students.filter(student => 
                        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (classes.find(c=>c.id===student.class_id)?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (student.roll_no || '').toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" alt={student.name} />
                              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                                {getInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <p>{student.name}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">{classes.find(c=>c.id===student.class_id)?.name || '—'}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline">{classes.find(c=>c.id===student.class_id)?.name || 'Unassigned'}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{student.roll_no}</TableCell>
                          <TableCell className="hidden lg:table-cell">{student.email}</TableCell>
                          <TableCell>
                            <Badge variant="default">{student.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => {
                                // Pre-fill edit form
                                const parent = parents.find(p => p.id === (student as any).parent_id);
                                const parentUserEmail = parent ? (users.find(u => u.id === parent.user_id)?.email || '') : '';
                                setEditStudent({
                                  id: student.id,
                                  name: student.name,
                                  classId: student.class_id ? String(student.class_id) : '',
                                  parentEmail: parentUserEmail,
                                  roll_no: student.roll_no,
                                  email: student.email || ''
                                });
                                setIsEditStudentOpen(true);
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parents Tab */}
          <TabsContent value="parents">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Parent Management</CardTitle>
                    <CardDescription>Manage parent accounts and contact information</CardDescription>
                  </div>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Parent
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profile</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead className="hidden md:table-cell">Phone</TableHead>
                        <TableHead className="hidden lg:table-cell">Children</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parents.length === 0 && !parentsLoading && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-6">No parents yet</TableCell>
                        </TableRow>
                      )}
                      {parents.map((parent) => {
                        const parentUser = users.find(u => u.id === parent.user_id);
                        const displayName = parentUser?.name || `Parent #${parent.id}`;
                        const displayEmail = parentUser?.email || '—';
                        const displayStatus = parentUser?.status || '—';
                        return (
                          <TableRow key={parent.id}>
                            <TableCell>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src="" alt={displayName} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {getInitials(displayName)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>
                                <p>{displayName}</p>
                                <p className="text-xs text-muted-foreground sm:hidden">{displayEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{displayEmail}</TableCell>
                            <TableCell className="hidden md:table-cell">{parent.phone || '—'}</TableCell>
                            <TableCell className="hidden lg:table-cell">-</TableCell>
                            <TableCell>
                              <Badge variant="default">{displayStatus}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Class Management</CardTitle>
                    <CardDescription>Manage classes and their assignments</CardDescription>
                  </div>
                  <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Class
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Class</DialogTitle>
                        <DialogDescription>Create a new class</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Class Name</Label>
                            <Input 
                              placeholder="e.g., SS1 A" 
                              value={newClass.name}
                              onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Class Teacher</Label>
                            <Select 
                              value={newClass.teacherId} 
                              onValueChange={(value: string) => setNewClass({...newClass, teacherId: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map((teacher) => (
                                  <SelectItem key={teacher.id} value={String(teacher.id)}>
                                    {teacherName(teacher)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Room</Label>
                            <Input 
                              placeholder="e.g., Block A-101" 
                              value={newClass.room}
                              onChange={(e) => setNewClass({...newClass, room: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Expected Students</Label>
                            <Input 
                              type="number"
                              placeholder="30" 
                              value={newClass.students}
                              onChange={(e) => setNewClass({...newClass, students: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Subjects</Label>
                          <Input 
                            placeholder="Mathematics, English, Physics (comma separated)" 
                            value={newClass.subjects}
                            onChange={(e) => setNewClass({...newClass, subjects: e.target.value})}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setIsAddClassOpen(false)} className="flex-1">
                            Cancel
                          </Button>
                          <Button onClick={handleAddClass} className="flex-1">Add Class</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class Name</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead className="hidden sm:table-cell">Class Teacher</TableHead>
                        <TableHead className="hidden md:table-cell">Subjects</TableHead>
                        <TableHead className="hidden lg:table-cell">Room</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes.length === 0 && !classesLoading && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No classes yet</TableCell>
                        </TableRow>
                      )}
                      {classes.filter(classItem => {
                        const teacherUser = users.find(u=>u.id===classItem.teacher_id);
                        const teacherNameSearch = teacherUser?.name?.toLowerCase() || '';
                        const q = searchQuery.toLowerCase();
                        return classItem.name.toLowerCase().includes(q) || teacherNameSearch.includes(q);
                      }).map((classItem) => {
                        const teacherUser = users.find(u=>u.id===classItem.teacher_id);
                        const tName = teacherUser?.name || 'No teacher assigned';
                        return (
                        <TableRow key={classItem.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{classItem.name}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">
                                {tName}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{classItem.expected_students || 0} expected</Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {tName}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {(classItem.subjects||[]).slice(0, 3).map((subject, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">{subject}</Badge>
                              ))}
                              {(classItem.subjects && classItem.subjects.length > 3) && (
                                <Badge variant="outline" className="text-xs">
                                  +{classItem.subjects.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{classItem.room}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditClass({ id: classItem.id, name: classItem.name, teacherId: classItem.teacher_id ? String(classItem.teacher_id) : '' });
                                setIsEditClassOpen(true);
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Users className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="space-y-6">
              {/* Events Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>School Events</CardTitle>
                      <CardDescription>Manage PTA meetings and school events</CardDescription>
                    </div>
                    <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Event
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Event</DialogTitle>
                          <DialogDescription>Create a new school event or meeting</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Event Title</Label>
                            <Input 
                              placeholder="e.g., PTA Meeting" 
                              value={newEvent.title}
                              onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea 
                              placeholder="Event details and agenda" 
                              value={newEvent.description}
                              onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Date</Label>
                              <Input 
                                type="date" 
                                value={newEvent.date}
                                onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Time</Label>
                              <Input 
                                type="time" 
                                value={newEvent.time}
                                onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Event Type</Label>
                            <Select 
                              value={newEvent.type} 
                              onValueChange={(value: string) => setNewEvent({...newEvent, type: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="meeting">PTA Meeting</SelectItem>
                                <SelectItem value="academic">Academic Event</SelectItem>
                                <SelectItem value="sports">Sports Event</SelectItem>
                                <SelectItem value="cultural">Cultural Event</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsAddEventOpen(false)} className="flex-1">
                              Cancel
                            </Button>
                            <Button onClick={handleAddEvent} className="flex-1">Add Event</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events.slice(0, 5).map((event) => (
                      <div key={event.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                              <span>📅 {event.date}</span>
                              <span>🕒 {event.time}</span>
                              <Badge variant="outline">{event.type}</Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No events scheduled. Click "Add Event" to create one.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Reports Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Reports</CardTitle>
                    <CardDescription>Generate comprehensive academic reports</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full justify-start">Overall School Performance Report</Button>
                    <Button className="w-full justify-start">Class-wise Academic Analysis</Button>
                    <Button className="w-full justify-start">Subject Performance Trends</Button>
                    <Button className="w-full justify-start">Student Progress Reports</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Administrative Reports</CardTitle>
                    <CardDescription>Generate operational and administrative reports</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full justify-start">Attendance Summary Report</Button>
                    <Button className="w-full justify-start">Teacher Performance Report</Button>
                    <Button className="w-full justify-start">Financial Summary Report</Button>
                    <Button className="w-full justify-start">Parent Engagement Report</Button>
                  </CardContent>
                </Card>
              </div>

              {/* Messages Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Message Center</CardTitle>
                  <CardDescription>Send messages to parents and teachers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Send Message to All Parents
                    </Button>
                    <Button className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Send Message to All Teachers
                    </Button>
                    <Button className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Send Message to Specific Class
                    </Button>
                    <Button className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      View Message History
                    </Button>
                  </div>
                  
                  {messages.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-4">Recent Messages</h4>
                      <div className="space-y-2">
                        {messages.slice(0, 3).map((message) => (
                          <div key={message.id} className="p-3 border rounded-lg text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{message.subject}</p>
                                <p className="text-muted-foreground">To: {message.recipient_role || '—'}</p>
                              </div>
                              <span className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.length === 0 && !messagesLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No messages yet</TableCell>
                    </TableRow>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Student Dialog */}
        <Dialog open={isEditStudentOpen} onOpenChange={setIsEditStudentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>Assign a class and link to a parent</DialogDescription>
            </DialogHeader>
            {editStudent && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select
                    value={editStudent.classId}
                    onValueChange={(value: string) => setEditStudent({ ...editStudent, classId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Parent Email (leave blank to unlink)</Label>
                  <Input
                    type="email"
                    placeholder="parent@example.com"
                    value={editStudent.parentEmail}
                    onChange={(e) => setEditStudent({ ...editStudent, parentEmail: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Roll Number</Label>
                    <Input
                      placeholder="e.g., SS1A/001"
                      value={editStudent.roll_no || ''}
                      onChange={(e) => setEditStudent({ ...editStudent, roll_no: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Student Email</Label>
                    <Input
                      type="email"
                      placeholder="student@school.edu.ng"
                      value={editStudent.email || ''}
                      onChange={(e) => setEditStudent({ ...editStudent, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditStudentOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveStudentEdit} className="flex-1">Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Class Dialog */}
        <Dialog open={isEditClassOpen} onOpenChange={setIsEditClassOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
              <DialogDescription>Assign or change class teacher</DialogDescription>
            </DialogHeader>
            {editClass && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Class Teacher</Label>
                  <Select
                    value={editClass.teacherId}
                    onValueChange={(value: string) => setEditClass({ ...editClass, teacherId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {teacherName(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditClassOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveClassEdit} className="flex-1">Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
