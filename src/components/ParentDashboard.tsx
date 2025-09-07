import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { GraduationCap, MessageSquare, Download, Send, TrendingUp, Calendar, Bell, Camera } from 'lucide-react';

interface ParentDashboardProps {
  userData: any;
  onLogout: () => void;
}

export function ParentDashboard({ userData, onLogout }: ParentDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChild, setSelectedChild] = useState(userData.children[0]);
  const [selectedTerm, setSelectedTerm] = useState('1st-term');
  const [newMessage, setNewMessage] = useState('');

  // Mock data for selected child
  const childResults = [
    { id: 'R001', subject: 'Mathematics', term: '1st Term', score: 85, grade: 'A', teacher: 'Mrs. Adebayo', date: '2024-01-10' },
    { id: 'R002', subject: 'English Language', term: '1st Term', score: 78, grade: 'B', teacher: 'Mr. Ogundimu', date: '2024-01-10' },
    { id: 'R003', subject: 'Physics', term: '1st Term', score: 92, grade: 'A+', teacher: 'Dr. Oladele', date: '2024-01-10' },
    { id: 'R004', subject: 'Chemistry', term: '1st Term', score: 88, grade: 'A', teacher: 'Mrs. Fagbemi', date: '2024-01-10' },
    { id: 'R005', subject: 'Yoruba Language', term: '1st Term', score: 82, grade: 'A-', teacher: 'Baba Ajayi', date: '2024-01-10' },
  ];

  const attendanceData = [
    { month: 'January', present: 18, absent: 2, total: 20, percentage: 90 },
    { month: 'December', present: 19, absent: 1, total: 20, percentage: 95 },
    { month: 'November', present: 17, absent: 3, total: 20, percentage: 85 },
    { month: 'October', present: 20, absent: 0, total: 20, percentage: 100 },
  ];

  const messages = [
    { id: 'M001', from: 'Mrs. Adebayo (Mathematics Teacher)', subject: `${selectedChild.name}'s Excellent Progress`, content: `${selectedChild.name} has shown remarkable improvement in Mathematics this term.`, date: '2024-01-14', status: 'unread' },
    { id: 'M002', from: 'Admin Office', subject: 'Parent-Teacher Meeting', content: 'Upcoming parent-teacher meetings scheduled for next week.', date: '2024-01-13', status: 'read' },
    { id: 'M003', from: 'Mr. Ogundimu (English Teacher)', subject: 'Reading Assignment', content: `Please ensure ${selectedChild.name} completes the assigned reading over the weekend.`, date: '2024-01-12', status: 'read' },
  ];

  const upcomingEvents = [
    { date: '2024-01-18', event: 'Parent-Teacher Meeting', time: '2:00 PM' },
    { date: '2024-01-22', event: 'Inter-House Sports', time: '10:00 AM' },
    { date: '2024-01-25', event: 'End of Term Examination', time: '9:00 AM' },
  ];

  const notifications = [
    { id: 'N001', title: 'New message from Mrs. Adebayo', content: 'Regarding Temilade\'s performance', time: '5 minutes ago', read: false },
    { id: 'N002', title: 'Assignment deadline reminder', content: 'Chemistry assignment due tomorrow', time: '2 hours ago', read: false },
    { id: 'N003', title: 'School event notification', content: 'Inter-house sports next week', time: '1 day ago', read: true },
  ];

  const unreadCount = messages.filter(msg => msg.status === 'unread').length;
  const unreadNotifications = notifications.filter(notif => !notif.read).length;

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

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
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">Parent Dashboard</p>
                {userData.children.length > 1 && (
                  <Select value={selectedChild.id} onValueChange={(value: string) => {
                    const child = userData.children.find((c: any) => c.id === value);
                    setSelectedChild(child);
                  }}>
                    <SelectTrigger className="w-48 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {userData.children.map((child: any) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.name} ({child.class})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
            
            <Button variant="outline" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-muted-foreground">Current Class</p>
                  <p className="font-medium">{selectedChild.class}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-muted-foreground">Overall Average</p>
                  <p className="font-medium">85.0%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-muted-foreground">Attendance</p>
                  <p className="font-medium">92.5%</p>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="results">Academic Results</TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              Messages
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Academic Performance</CardTitle>
                  <CardDescription>Latest test results and grades for {selectedChild.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {childResults.slice(0, 3).map((result) => (
                      <div key={result.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{result.subject}</p>
                          <p className="text-muted-foreground">Teacher: {result.teacher}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${getGradeColor(result.grade)}`}>{result.grade}</p>
                          <p className="text-muted-foreground">{result.score}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                  <CardDescription>Monthly attendance overview for {selectedChild.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attendanceData.slice(0, 3).map((record, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{record.month}</p>
                          <p className="text-muted-foreground">{record.present}/{record.total} days</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${record.percentage >= 90 ? 'text-green-600' : record.percentage >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {record.percentage}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Important dates and schedules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingEvents.map((event, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-center min-w-16">
                          <p className="text-sm">{new Date(event.date).getDate()}</p>
                          <p className="text-xs">{new Date(event.date).toLocaleDateString('en', { month: 'short' })}</p>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{event.event}</p>
                          <p className="text-muted-foreground">{event.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Academic Results - {selectedChild.name}</CardTitle>
                    <CardDescription>View and download your child's academic performance</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st-term">1st Term</SelectItem>
                        <SelectItem value="2nd-term">2nd Term</SelectItem>
                        <SelectItem value="3rd-term">3rd Term</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download Report
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {childResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.subject}</TableCell>
                        <TableCell>{result.teacher}</TableCell>
                        <TableCell>{result.score}%</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(result.grade)} variant="outline">
                            {result.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.date}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">View Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Term Summary for {selectedChild.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-muted-foreground">Overall Average</p>
                      <p className="font-medium">85.0%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Class Position</p>
                      <p className="font-medium">3rd out of 35</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Subjects</p>
                      <p className="font-medium">8 Subjects</p>
                    </div>
                  </div>
                </div>
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
                    <CardDescription>Communications from teachers and school administration</CardDescription>
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
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin Office</SelectItem>
                        <SelectItem value="math-teacher">Mrs. Adebayo (Math Teacher)</SelectItem>
                        <SelectItem value="english-teacher">Mr. Ogundimu (English Teacher)</SelectItem>
                        <SelectItem value="class-teacher">Class Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Regarding Child</Label>
                    <Select value={selectedChild.id} onValueChange={(value: string) => {
                      const child = userData.children.find((c: any) => c.id === value);
                      setSelectedChild(child);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {userData.children.map((child: any) => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.name} ({child.class})
                          </SelectItem>
                        ))}
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

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Parent Information</CardTitle>
                  <CardDescription>Update your profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture Section */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="" alt={userData.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {getInitials(userData.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Change Photo
                      </Button>
                      <p className="text-muted-foreground">JPG, PNG or GIF. Max size 2MB</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input defaultValue={userData.name} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input defaultValue={userData.email} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input defaultValue={userData.phone || "+234 803 123 4567"} />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea defaultValue="Obafemi Awolowo University, Ile-Ife, Osun State" rows={3} />
                    </div>
                    <Button>Update Profile</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Children Information</CardTitle>
                  <CardDescription>Your children's school details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userData.children.map((child: any) => (
                    <div key={child.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="" alt={child.name} />
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            {getInitials(child.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{child.name}</h3>
                          <p className="text-muted-foreground">Student ID: {child.id}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <p className="text-muted-foreground">Class</p>
                          <p className="font-medium">{child.class}</p>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-muted-foreground">Roll Number</p>
                          <p className="font-medium">{child.rollNo}</p>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-muted-foreground">Academic Session</p>
                          <p className="font-medium">2023/2024</p>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-muted-foreground">Class Teacher</p>
                          <p className="font-medium">Mrs. Adebayo</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}