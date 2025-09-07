import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Users, FileText, MessageSquare, CheckSquare, Upload, Send, Bell } from 'lucide-react';

interface TeacherDashboardProps {
  userData: any;
  onLogout: () => void;
}

export function TeacherDashboard({ userData, onLogout }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState('students');
  const [selectedClass, setSelectedClass] = useState(userData.classes[0]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');

  // Mock data with Nigerian education system
  const students = [
    { id: 'S001', name: 'Temilade Ogunkoya', rollNo: 'JSS2A/001', class: 'JSS2 A', attendance: '95%', lastSeen: '2024-01-15' },
    { id: 'S002', name: 'Chidinma Okoro', rollNo: 'JSS2A/002', class: 'JSS2 A', attendance: '88%', lastSeen: '2024-01-14' },
    { id: 'S003', name: 'Abdullahi Musa', rollNo: 'JSS2A/003', class: 'JSS2 A', attendance: '92%', lastSeen: '2024-01-15' },
    { id: 'S004', name: 'Grace Adeyemi', rollNo: 'JSS2A/004', class: 'JSS2 A', attendance: '78%', lastSeen: '2024-01-12' },
  ];

  const results = [
    { id: 'R001', student: 'Temilade Ogunkoya', subject: 'Mathematics', term: '1st Term', score: 85, grade: 'A', status: 'Published' },
    { id: 'R002', student: 'Chidinma Okoro', subject: 'Mathematics', term: '1st Term', score: 78, grade: 'B', status: 'Published' },
    { id: 'R003', student: 'Abdullahi Musa', subject: 'Mathematics', term: '1st Term', score: 92, grade: 'A+', status: 'Published' },
    { id: 'R004', student: 'Grace Adeyemi', subject: 'Mathematics', term: '1st Term', score: 65, grade: 'C+', status: 'Draft' },
  ];

  const messages = [
    { id: 'M001', from: 'Mr. Ogunkoya (Parent)', subject: 'Temilade\'s Progress', content: 'How is Temilade doing in Mathematics this term?', date: '2024-01-14', status: 'unread' },
    { id: 'M002', from: 'Principal\'s Office', subject: 'Monthly Report Due', content: 'Please submit your monthly class report by Friday.', date: '2024-01-13', status: 'read' },
    { id: 'M003', from: 'Mrs. Okoro (Parent)', subject: 'Chidinma\'s Attendance', content: 'Chidinma was absent due to illness yesterday.', date: '2024-01-12', status: 'read' },
  ];

  const attendanceData = [
    { date: '2024-01-15', present: 32, absent: 2, late: 1 },
    { date: '2024-01-14', present: 33, absent: 1, late: 1 },
    { date: '2024-01-13', present: 31, absent: 3, late: 1 },
    { date: '2024-01-12', present: 34, absent: 1, late: 0 },
  ];

  const notifications = [
    { id: 'N001', title: 'New message from parent', content: 'Mr. Ogunkoya sent a message about Temilade', time: '10 minutes ago', read: false },
    { id: 'N002', title: 'Results submission reminder', content: 'JSS2 A results due tomorrow', time: '1 hour ago', read: false },
    { id: 'N003', title: 'Staff meeting scheduled', content: 'Department meeting on Friday', time: '2 hours ago', read: true },
  ];

  const unreadCount = messages.filter(msg => msg.status === 'unread').length;
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
                <h1 className="text-lg sm:text-xl">Welcome back, {userData.name}</h1>
                <p className="text-muted-foreground text-sm sm:text-base">Teacher Dashboard - Faith-Life International College</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
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
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-muted-foreground">Total Students</p>
                  <p className="font-medium">105</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-muted-foreground">Today's Attendance</p>
                  <p className="font-medium">94%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-muted-foreground">Pending Results</p>
                  <p className="font-medium">6</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-muted-foreground">Unread Messages</p>
                  <p className="font-medium">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="grid grid-cols-4 min-w-fit w-full sm:w-auto">
              <TabsTrigger value="students" className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">Students</TabsTrigger>
              <TabsTrigger value="results" className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">Results</TabsTrigger>
              <TabsTrigger value="messages" className="relative px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">
                Messages
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
                    {unreadCount}
                  </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="attendance" className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">Attendance</TabsTrigger>
          </TabsList>
          </div>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Student Management</CardTitle>
                    <CardDescription>Manage your students and track their progress</CardDescription>
                  </div>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {userData.classes.map((cls: string) => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Last Seen</TableHead>
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
                        <TableCell>{student.rollNo}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell>{student.attendance}</TableCell>
                        <TableCell>{student.lastSeen}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">View Profile</Button>
                            <Button size="sm" variant="outline">Contact Parent</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Results Management</CardTitle>
                    <CardDescription>Upload and manage student results</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Results
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload New Results</DialogTitle>
                        <DialogDescription>
                          Upload results for your students
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Subject</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {userData.subjects.map((subject: string) => (
                                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Term</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select term" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1st-term">1st Term</SelectItem>
                              <SelectItem value="2nd-term">2nd Term</SelectItem>
                              <SelectItem value="3rd-term">3rd Term</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Upload File</Label>
                          <Input type="file" accept=".csv,.xlsx" />
                        </div>
                        <Button className="w-full">Upload Results</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{result.student}</TableCell>
                        <TableCell>{result.subject}</TableCell>
                        <TableCell>{result.term}</TableCell>
                        <TableCell>{result.score}%</TableCell>
                        <TableCell>{result.grade}</TableCell>
                        <TableCell>
                          <Badge variant={result.status === 'Published' ? 'default' : 'secondary'}>
                            {result.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">Edit</Button>
                            {result.status === 'Draft' && (
                              <Button size="sm">Publish</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>Communicate with parents and administration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className={`border rounded-lg p-4 space-y-2 ${message.status === 'unread' ? 'bg-accent/20 border-primary/20' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{message.subject}</p>
                              <p className="text-muted-foreground">{message.from}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground">{message.date}</p>
                              {message.status === 'unread' && (
                                <Badge variant="destructive">New</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm">{message.content}</p>
                          <Button size="sm" variant="outline">Reply</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Send Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Principal's Office</SelectItem>
                        <SelectItem value="parent1">Mr. Ogunkoya (Parent)</SelectItem>
                        <SelectItem value="parent2">Mrs. Okoro (Parent)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input placeholder="Message subject" />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button className="w-full flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Attendance Management</CardTitle>
                    <CardDescription>Track and manage student attendance</CardDescription>
                  </div>
                  <Button className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Take Attendance
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Attendance Rate</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.present}</TableCell>
                        <TableCell>{record.absent}</TableCell>
                        <TableCell>{record.late}</TableCell>
                        <TableCell>
                          {Math.round((record.present / (record.present + record.absent + record.late)) * 100)}%
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">View Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}