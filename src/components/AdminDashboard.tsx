import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Users, GraduationCap, UserCheck, School, TrendingUp, AlertCircle, Search, Plus, Edit, Trash2, Bell, MessageSquare } from 'lucide-react';
import { 
  initializeLocalStorage,
  getTeachers, 
  getStudents, 
  getParents,
  getClasses,
  getEvents,
  getMessages,
  addTeacher, 
  updateTeacher, 
  deleteTeacher, 
  addStudent, 
  addClass, 
  addEvent,
  Teacher,
  Student,
  ClassItem,
  Event,
  Message
} from '../utils/localStorage.js';

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
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // Form states
  const [newTeacher, setNewTeacher] = useState({
    name: '', email: '', phone: '', subjects: '', classes: ''
  });
  const [newStudent, setNewStudent] = useState({
    name: '', class: '', rollNo: '', parentEmail: '', email: ''
  });
  const [newClass, setNewClass] = useState({
    name: '', teacherId: '', subjects: '', room: '', students: '0'
  });
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', date: '', time: '', type: 'meeting'
  });

  useEffect(() => {
    // Initialize localStorage and load data
    initializeLocalStorage();
    loadData();
  }, []);

  const loadData = () => {
    setTeachers(getTeachers());
    setStudents(getStudents());
    setParents(getParents());
    setClasses(getClasses());
    setEvents(getEvents());
    setMessages(getMessages());
  };

  // Calculate dynamic stats
  const schoolStats = {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalParents: parents.length,
    totalClasses: classes.length,
    attendanceRate: 93.8, // Default value, could be calculated from actual data
    averageGrade: 78.5 // Default value, could be calculated from actual data
  };

  const handleAddTeacher = () => {
    if (!newTeacher.name || !newTeacher.email) return;
    
    const teacher = {
      ...newTeacher,
      subjects: newTeacher.subjects.split(',').map(s => s.trim()),
      classes: newTeacher.classes.split(',').map(c => c.trim()),
      status: 'Active'
    };
    
    if (addTeacher(teacher)) {
      setTeachers(getTeachers());
      setNewTeacher({ name: '', email: '', phone: '', subjects: '', classes: '' });
      setIsAddTeacherOpen(false);
    }
  };

  const handleDeleteTeacher = (teacherId: string) => {
    if (deleteTeacher(teacherId)) {
      setTeachers(getTeachers());
    }
  };

  const handleUpdateTeacherStatus = (teacherId: string, status: string) => {
    if (updateTeacher(teacherId, { status })) {
      setTeachers(getTeachers());
    }
  };

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.class || !newStudent.rollNo) return;
    
    const student = {
      ...newStudent,
      parentId: 'P001', // For now, assign to default parent
      status: 'Active'
    };
    
    if (addStudent(student)) {
      setStudents(getStudents());
      setNewStudent({ name: '', class: '', rollNo: '', parentEmail: '', email: '' });
      setIsAddStudentOpen(false);
    }
  };

  const handleAddClass = () => {
    if (!newClass.name || !newClass.teacherId) return;
    
    const classData = {
      ...newClass,
      subjects: newClass.subjects.split(',').map(s => s.trim()),
      students: parseInt(newClass.students) || 0
    };
    
    if (addClass(classData)) {
      setClasses(getClasses());
      setNewClass({ name: '', teacherId: '', subjects: '', room: '', students: '0' });
      setIsAddClassOpen(false);
    }
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    
    if (addEvent(newEvent)) {
      setEvents(getEvents());
      setNewEvent({ title: '', description: '', date: '', time: '', type: 'meeting' });
      setIsAddEventOpen(false);
    }
  };

  // Dynamic notifications and activities
  const generateNotifications = () => {
    const notifications = [];
    
    // Check for low attendance classes
    classes.forEach(classItem => {
      if (classItem.students < 25) {
        notifications.push({
          id: `low-students-${classItem.id}`,
          type: 'warning',
          title: 'Low Student Count',
          message: `${classItem.name} has only ${classItem.students} students`,
          date: new Date().toISOString().split('T')[0],
          read: false
        });
      }
    });

    // Check for teachers on leave
    const onLeaveTeachers = teachers.filter(t => t.status === 'On Leave');
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
    teachers.slice(-3).forEach(teacher => {
      activities.push({
        time: '10:30 AM',
        activity: `Teacher profile: ${teacher.name} (${teacher.subjects.join(', ')})`,
        type: 'registration'
      });
    });

    // Recent student additions
    students.slice(-2).forEach(student => {
      activities.push({
        time: '09:45 AM',
        activity: `Student enrolled: ${student.name} (${student.class})`,
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
                          <Label>Phone</Label>
                          <Input 
                            placeholder="Enter phone number" 
                            value={newTeacher.phone}
                            onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})}
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
                      {teachers.filter(teacher => 
                        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" alt={teacher.name} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {getInitials(teacher.name)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <p>{teacher.name}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">{teacher.subjects.join(', ')}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {teacher.subjects.map((subject, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">{subject}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {teacher.classes.map((cls, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">{cls}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{teacher.email}</TableCell>
                          <TableCell>
                            <Select
                              value={teacher.status}
                              onValueChange={(value: string) => handleUpdateTeacherStatus(teacher.id, value)}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="On Leave">On Leave</SelectItem>
                                <SelectItem value="Suspended">Suspended</SelectItem>
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
                            <Input 
                              placeholder="e.g., SS1 A" 
                              value={newStudent.class}
                              onChange={(e) => setNewStudent({...newStudent, class: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Roll Number</Label>
                            <Input 
                              placeholder="e.g., SS1A/001" 
                              value={newStudent.rollNo}
                              onChange={(e) => setNewStudent({...newStudent, rollNo: e.target.value})}
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
                      {students.filter(student => 
                        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        student.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        student.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
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
                              <p className="text-xs text-muted-foreground sm:hidden">{student.class}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline">{student.class}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{student.rollNo}</TableCell>
                          <TableCell className="hidden lg:table-cell">{student.email}</TableCell>
                          <TableCell>
                            <Badge variant="default">{student.status}</Badge>
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
                    {parents.map((parent) => (
                      <TableRow key={parent.id}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" alt={parent.name} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getInitials(parent.name)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <p>{parent.name}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">{parent.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{parent.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{parent.phone}</TableCell>
                        <TableCell className="hidden lg:table-cell">{parent.children.join(', ')}</TableCell>
                        <TableCell>
                          <Badge variant="default">{parent.status}</Badge>
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
                    ))}
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
                                  <SelectItem key={teacher.id} value={teacher.id}>
                                    {teacher.name}
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
                      {classes.filter(classItem => 
                        classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (classItem.teacherName && classItem.teacherName.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).map((classItem) => (
                        <TableRow key={classItem.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{classItem.name}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">
                                {classItem.teacherName || 'No teacher assigned'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{classItem.students} students</Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {classItem.teacherName || 'No teacher assigned'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {classItem.subjects.slice(0, 3).map((subject, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">{subject}</Badge>
                              ))}
                              {classItem.subjects.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{classItem.subjects.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{classItem.room}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Users className="h-4 w-4" />
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
                                <p className="text-muted-foreground">To: {message.recipient}</p>
                              </div>
                              <span className="text-xs text-muted-foreground">{message.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}