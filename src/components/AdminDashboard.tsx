import { useState } from 'react';
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
import { Users, GraduationCap, UserCheck, School, TrendingUp, AlertCircle, Search, Plus, Edit, Trash2, Bell } from 'lucide-react';

interface AdminDashboardProps {
  userData: any;
  onLogout: () => void;
}

export function AdminDashboard({ userData, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data with Nigerian education system
  const schoolStats = {
    totalStudents: 1485,
    totalTeachers: 52,
    totalParents: 1180,
    totalClasses: 27,
    attendanceRate: 93.8,
    averageGrade: 78.5
  };

  const teachers = [
    { id: 'T001', name: 'Mrs. Adebayo Oluwaseun', subjects: ['Mathematics', 'Further Mathematics'], classes: 3, email: 'oluwaseun.adebayo@oauife.edu.ng', status: 'Active' },
    { id: 'T002', name: 'Dr. Oladele Babatunde', subjects: ['Physics', 'Chemistry'], classes: 4, email: 'babatunde.oladele@oauife.edu.ng', status: 'Active' },
    { id: 'T003', name: 'Mr. Ogundimu Ayodeji', subjects: ['English Language', 'Literature'], classes: 5, email: 'ayodeji.ogundimu@oauife.edu.ng', status: 'Active' },
    { id: 'T004', name: 'Mrs. Fagbemi Kehinde', subjects: ['Biology', 'Agricultural Science'], classes: 3, email: 'kehinde.fagbemi@oauife.edu.ng', status: 'On Leave' },
  ];

  const students = [
    { id: 'S001', name: 'Temilade Ogunkoya', class: 'JSS2 A', rollNo: 'JSS2A/001', parent: 'Mr. Babatunde Ogunkoya', email: 'temilade.ogunkoya@student.oauife.edu.ng', status: 'Active' },
    { id: 'S002', name: 'Chidinma Okoro', class: 'JSS3 B', rollNo: 'JSS3B/008', parent: 'Mrs. Ngozi Okoro', email: 'chidinma.okoro@student.oauife.edu.ng', status: 'Active' },
    { id: 'S003', name: 'Abdullahi Musa', class: 'SS1 A', rollNo: 'SS1A/015', parent: 'Alhaji Ibrahim Musa', email: 'abdullahi.musa@student.oauife.edu.ng', status: 'Active' },
    { id: 'S004', name: 'Grace Adeyemi', class: 'SS2 C', rollNo: 'SS2C/022', parent: 'Dr. Folake Adeyemi', email: 'grace.adeyemi@student.oauife.edu.ng', status: 'Active' },
  ];

  const parents = [
    { id: 'P001', name: 'Mr. Babatunde Ogunkoya', email: 'babatunde.ogunkoya@gmail.com', phone: '+234 803 123 4567', children: ['Temilade Ogunkoya', 'Olumide Ogunkoya'], status: 'Active' },
    { id: 'P002', name: 'Mrs. Ngozi Okoro', email: 'ngozi.okoro@yahoo.com', phone: '+234 805 987 6543', children: ['Chidinma Okoro'], status: 'Active' },
    { id: 'P003', name: 'Alhaji Ibrahim Musa', email: 'ibrahim.musa@hotmail.com', phone: '+234 807 456 7890', children: ['Abdullahi Musa'], status: 'Active' },
    { id: 'P004', name: 'Dr. Folake Adeyemi', email: 'folake.adeyemi@oauife.edu.ng', phone: '+234 809 234 5678', children: ['Grace Adeyemi'], status: 'Active' },
  ];

  const classes = [
    { id: 'C001', name: 'JSS1 A', students: 35, teacher: 'Mrs. Adebayo Oluwaseun', subjects: 9, room: 'Block A-101' },
    { id: 'C002', name: 'JSS2 B', students: 33, teacher: 'Mr. Ogundimu Ayodeji', subjects: 9, room: 'Block A-102' },
    { id: 'C003', name: 'JSS3 A', students: 32, teacher: 'Dr. Oladele Babatunde', subjects: 10, room: 'Block B-101' },
    { id: 'C004', name: 'SS1 A', students: 30, teacher: 'Mrs. Fagbemi Kehinde', subjects: 12, room: 'Block C-101' },
    { id: 'C005', name: 'SS2 B', students: 28, teacher: 'Mrs. Adebayo Oluwaseun', subjects: 12, room: 'Block C-102' },
    { id: 'C006', name: 'SS3 A', students: 25, teacher: 'Dr. Oladele Babatunde', subjects: 12, room: 'Block C-103' },
  ];

  const notifications = [
    { id: 'N001', type: 'warning', title: 'Low Attendance Alert', message: 'JSS3 B has attendance below 85% this week', date: '2024-01-15', read: false },
    { id: 'N002', type: 'info', title: 'New Teacher Registration', message: 'New teacher profile created for Mr. Adebola', date: '2024-01-14', read: false },
    { id: 'N003', type: 'urgent', title: 'Parent Complaint', message: 'Urgent complaint received regarding canteen services', date: '2024-01-13', read: true },
    { id: 'N004', type: 'info', title: 'System backup completed', message: 'Daily system backup completed successfully', date: '2024-01-12', read: true },
  ];

  const recentActivities = [
    { time: '10:30 AM', activity: 'New student registered: Kemi Olaoye (JSS1 C)', type: 'registration' },
    { time: '09:45 AM', activity: 'SS2 A results uploaded by Mrs. Adebayo', type: 'academic' },
    { time: '09:15 AM', activity: 'Parent-Teacher meeting scheduled for 2024-01-20', type: 'meeting' },
    { time: '08:30 AM', activity: 'Attendance marked for all classes', type: 'attendance' },
  ];

  const unreadNotifications = notifications.filter(notif => !notif.read).length;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt={userData.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(userData.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1>Welcome, {userData.name}</h1>
              <p className="text-muted-foreground">Administrator Dashboard - Faith-Life International College</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
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
            
            <Button variant="outline" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="parents">Parents</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

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
                        <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="bg-primary text-primary-foreground rounded-lg px-2 py-1 text-xs">
                            {activity.time}
                          </div>
                          <p className="flex-1">{activity.activity}</p>
                          <Badge variant="outline">{activity.type}</Badge>
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
                  <Dialog>
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
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input placeholder="Enter teacher's name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" placeholder="Enter email address" />
                        </div>
                        <div className="space-y-2">
                          <Label>Subjects</Label>
                          <Input placeholder="Enter subjects (comma separated)" />
                        </div>
                        <Button className="w-full">Add Teacher</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Classes</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" alt={teacher.name} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getInitials(teacher.name)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{teacher.name}</TableCell>
                        <TableCell>{teacher.subjects.join(', ')}</TableCell>
                        <TableCell>{teacher.classes}</TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>
                          <Badge variant={teacher.status === 'Active' ? 'default' : 'secondary'}>
                            {teacher.status}
                          </Badge>
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
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Student
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" alt={student.name} />
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell>{student.rollNo}</TableCell>
                        <TableCell>{student.parent}</TableCell>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Children</TableHead>
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
                        <TableCell className="font-medium">{parent.name}</TableCell>
                        <TableCell>{parent.email}</TableCell>
                        <TableCell>{parent.phone}</TableCell>
                        <TableCell>{parent.children.join(', ')}</TableCell>
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
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Class
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Class Teacher</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((classItem) => (
                      <TableRow key={classItem.id}>
                        <TableCell className="font-medium">{classItem.name}</TableCell>
                        <TableCell>{classItem.students}</TableCell>
                        <TableCell>{classItem.teacher}</TableCell>
                        <TableCell>{classItem.subjects}</TableCell>
                        <TableCell>{classItem.room}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">View Students</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}