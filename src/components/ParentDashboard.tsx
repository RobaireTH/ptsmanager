import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { PhoneInput } from "./ui/phone-input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  GraduationCap,
  MessageSquare,
  Download,
  Send,
  TrendingUp,
  Calendar,
  Bell,
  Camera,
} from "lucide-react";
import {
  getParents,
  updateParent,
  getStudents,
  getEvents,
  getMessages,
  getResults,
  getAttendance,
  getAttendanceSummary,
  Student,
  Event,
  Message,
  Result,
  AttendanceWithDetails,
  AttendanceSummary,
} from "../lib/api";

interface ParentDashboardProps {
  userData: any;
  onLogout: () => void;
}

export function ParentDashboard({ userData, onLogout }: ParentDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<Student | null>(null);
  const [selectedTerm, setSelectedTerm] = useState("1st-term");
  const [newMessage, setNewMessage] = useState("");
  const [parentData, setParentData] = useState({
    name: userData.name || "",
    email: userData.email || "",
    phone: userData.phone || "",
    profilePicture: userData.profilePicture || null,
  });
  const [profilePicture, setProfilePicture] = useState(
    userData.profilePicture || null
  );
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceWithDetails[]
  >([]);
  const [attendanceSummary, setAttendanceSummary] =
    useState<AttendanceSummary | null>(null);

  const convertFileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data from API on mount
  useEffect(() => {
    loadData();
  }, []);

  // Keep selectedChild in sync with fetched students for multi-child parents
  useEffect(() => {
    if (students.length === 0) {
      setSelectedChild(null);
      return;
    }
    if (!selectedChild) {
      setSelectedChild(students[0]);
      return;
    }
    const stillExists = students.find((s) => s.id === selectedChild.id);
    if (!stillExists) {
      setSelectedChild(students[0]);
    }
  }, [students]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        if (selectedChild) {
          const results = await getResults({
            student_id: Number(selectedChild.id),
          });
          setChildResults(
            results.map((r) => ({
              id: r.id,
              subject: r.subject,
              term: r.term,
              score: r.score,
              grade: r.grade,
              date: r.date,
            }))
          );
        } else {
          setChildResults([]);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchResults();
  }, [selectedChild]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        if (selectedChild) {
          const [attendanceData, summaryData] = await Promise.all([
            getAttendance({ student_id: Number(selectedChild.id) }),
            getAttendanceSummary({ student_id: Number(selectedChild.id) }),
          ]);
          setAttendanceRecords(attendanceData);
          setAttendanceSummary(summaryData);
        } else {
          setAttendanceRecords([]);
          setAttendanceSummary(null);
        }
      } catch (e) {
        console.error("Error fetching attendance:", e);
      }
    };
    fetchAttendance();
  }, [selectedChild]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsData, eventsData, messagesData] = await Promise.all([
        getStudents(),
        getEvents(),
        getMessages(),
      ]);

      setStudents(studentsData);
      setEvents(eventsData);
      setMessages(messagesData);

      // Students endpoint is scoped by backend for parent; use as-is
      const parentStudents = studentsData;
      if (parentStudents.length > 0) {
        setSelectedChild(parentStudents[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const base64Data = await convertFileToBase64(file);
      // For now just store locally (future: upload endpoint)
      setProfilePicture(base64Data);
      setParentData((prev) => ({ ...prev, profilePicture: base64Data }));
    } catch (error) {
      toast.error("Error uploading image");
      console.error("Profile picture upload error:", error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateProfile = async (updates: any) => {
    setLoading(true);
    setError(null);
    try {
      // Find the parent record for this user
      const parentRecord = await getParents();
      const parent = parentRecord.find((p) => p.user_id === userData.id);

      if (parent) {
        await updateParent(parent.id, updates);
        setParentData((prev) => ({ ...prev, ...updates }));
        return true;
      } else {
        setError("Parent record not found");
        return false;
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      console.error("Error updating profile:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mock data for selected child
  // Results for selected child fetched from API
  const [childResults, setChildResults] = useState<
    {
      id: number;
      subject: string;
      term: string;
      score: number;
      grade: string;
      teacher?: string;
      date?: string;
    }[]
  >([]);

  // Group attendance records by month for display
  const groupedAttendance = useMemo(() => {
    if (!attendanceRecords.length) return [];

    const monthlyData: {
      [key: string]: {
        present: number;
        absent: number;
        late: number;
        total: number;
      };
    } = {};

    attendanceRecords.forEach((record) => {
      const date = new Date(record.date);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { present: 0, absent: 0, late: 0, total: 0 };
      }

      monthlyData[monthKey].total++;
      if (record.status === "present") monthlyData[monthKey].present++;
      if (record.status === "absent") monthlyData[monthKey].absent++;
      if (record.status === "late") monthlyData[monthKey].late++;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        present: data.present + data.late, // Count late as attended
        absent: data.absent,
        total: data.total,
        percentage: Math.round(((data.present + data.late) / data.total) * 100),
      }))
      .slice(0, 4);
  }, [attendanceRecords]);

  const upcomingEvents = [
    { date: "2024-01-18", event: "Parent-Teacher Meeting", time: "2:00 PM" },
    { date: "2024-01-22", event: "Inter-House Sports", time: "10:00 AM" },
    { date: "2024-01-25", event: "End of Term Examination", time: "9:00 AM" },
  ];

  const notifications = [
    {
      id: "N001",
      title: "New message from Mrs. Adebayo",
      content: "Regarding Temilade's performance",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: "N002",
      title: "Assignment deadline reminder",
      content: "Chemistry assignment due tomorrow",
      time: "2 hours ago",
      read: false,
    },
    {
      id: "N003",
      title: "School event notification",
      content: "Inter-house sports next week",
      time: "1 day ago",
      read: true,
    },
  ];

  const unreadCount = 0; // backend Message currently lacks status field
  const unreadNotifications = notifications.filter(
    (notif) => !notif.read
  ).length;

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600";
    if (grade.startsWith("B")) return "text-blue-600";
    if (grade.startsWith("C")) return "text-yellow-600";
    return "text-red-600";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profilePicture || ""} alt={parentData.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(parentData.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg sm:text-xl">
                  Welcome, {parentData.name}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Parent Dashboard
                  </p>
                  {students.length > 1 && (
                    <Select
                      value={selectedChild ? String(selectedChild.id) : ""}
                      onValueChange={(value: string) => {
                        const child = students.find(
                          (s) => String(s.id) === String(value)
                        );
                        setSelectedChild(child || null);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-48 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((child) => (
                          <SelectItem key={child.id} value={String(child.id)}>
                            {child.name}
                            {child.class || child.class_id
                              ? ` (${child.class || `Class ${child.class_id}`})`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
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
                        <div
                          key={notification.id}
                          className={`p-2 rounded-md border ${
                            !notification.read ? "bg-accent" : "bg-background"
                          }`}
                        >
                          <p className="font-medium text-sm">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                onClick={onLogout}
                className="whitespace-nowrap"
              >
                Logout
              </Button>
            </div>
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
                  <p className="font-medium">
                    {selectedChild?.class ||
                      (selectedChild?.class_id
                        ? `Class ${selectedChild.class_id}`
                        : "—")}
                  </p>
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
                  <p className="font-medium">
                    {attendanceSummary
                      ? `${attendanceSummary.percentage}%`
                      : "N/A"}
                  </p>
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
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="overflow-x-auto">
            <TabsList className="grid grid-cols-4 min-w-fit w-full sm:w-auto">
              <TabsTrigger
                value="overview"
                className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2"
              >
                Results
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="relative px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2"
              >
                Messages
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2"
              >
                Profile
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Academic Performance</CardTitle>
                  <CardDescription>
                    Latest test results and grades{" "}
                    {selectedChild ? `for ${selectedChild.name}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {childResults.slice(0, 3).map((result) => (
                      <div
                        key={result.id}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{result.subject}</p>
                          <p className="text-muted-foreground">
                            Teacher: {result.teacher}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-medium ${getGradeColor(
                              result.grade
                            )}`}
                          >
                            {result.grade}
                          </p>
                          <p className="text-muted-foreground">
                            {result.score}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                  <CardDescription>
                    Monthly attendance overview{" "}
                    {selectedChild ? `for ${selectedChild.name}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {groupedAttendance.length > 0 ? (
                      groupedAttendance.slice(0, 3).map((record, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{record.month}</p>
                            <p className="text-muted-foreground">
                              {record.present}/{record.total} days
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-medium ${
                                record.percentage >= 90
                                  ? "text-green-600"
                                  : record.percentage >= 80
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {record.percentage}%
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        No attendance data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>
                    Important dates and schedules
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingEvents.map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-center min-w-16">
                          <p className="text-sm">
                            {new Date(event.date).getDate()}
                          </p>
                          <p className="text-xs">
                            {new Date(event.date).toLocaleDateString("en", {
                              month: "short",
                            })}
                          </p>
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
                    <CardTitle>
                      Academic Results{" "}
                      {selectedChild ? `- ${selectedChild.name}` : ""}
                    </CardTitle>
                    <CardDescription>
                      View and download your child's academic performance
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedTerm}
                      onValueChange={setSelectedTerm}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st-term">1st Term</SelectItem>
                        <SelectItem value="2nd-term">2nd Term</SelectItem>
                        <SelectItem value="3rd-term">3rd Term</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
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
                        <TableCell className="font-medium">
                          {result.subject}
                        </TableCell>
                        <TableCell>{result.teacher || "—"}</TableCell>
                        <TableCell>{result.score}%</TableCell>
                        <TableCell>
                          <Badge
                            className={getGradeColor(result.grade)}
                            variant="outline"
                          >
                            {result.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.date || "—"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {students.length === 0 && !loading && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-6"
                        >
                          No students yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">
                    Term Summary{" "}
                    {selectedChild ? `for ${selectedChild.name}` : ""}
                  </h3>
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
                    <CardDescription>
                      Communications from teachers and school administration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{message.subject}</p>
                              <p className="text-muted-foreground text-xs">
                                ID: {message.id}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground text-xs">
                                {new Date(message.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {message.body || "—"}
                          </p>
                          <Button size="sm" variant="outline">
                            Reply
                          </Button>
                        </div>
                      ))}
                      <div className="text-sm text-muted-foreground border rounded-lg p-6 text-center">
                        No messages yet
                      </div>
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
                        <SelectItem value="math-teacher">
                          Mrs. Adebayo (Math Teacher)
                        </SelectItem>
                        <SelectItem value="english-teacher">
                          Mr. Ogundimu (English Teacher)
                        </SelectItem>
                        <SelectItem value="class-teacher">
                          Class Teacher
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Regarding Child</Label>
                    <Select
                      value={selectedChild ? String(selectedChild.id) : ""}
                      onValueChange={(value: string) => {
                        const child = students.find(
                          (s) => String(s.id) === String(value)
                        );
                        setSelectedChild(child || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((child) => (
                          <SelectItem key={child.id} value={String(child.id)}>
                            {child.name}
                            {child.class || child.class_id
                              ? ` (${child.class || `Class ${child.class_id}`})`
                              : ""}
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
                  <CardDescription>
                    Update your profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture Section */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={profilePicture || ""}
                        alt={parentData.name}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {getInitials(parentData.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUpdatingProfile}
                      >
                        <Camera className="h-4 w-4" />
                        {isUpdatingProfile ? "Uploading..." : "Change Photo"}
                      </Button>
                      <p className="text-muted-foreground text-sm">
                        JPG, PNG or GIF. Max size 2MB
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        defaultValue={parentData.name}
                        onChange={(e) =>
                          setParentData({ ...parentData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        defaultValue={parentData.email}
                        onChange={(e) =>
                          setParentData({
                            ...parentData,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <PhoneInput
                      label="Phone Number"
                      value={parentData.phone || "+234 803 123 4567"}
                      onChange={(value) =>
                        setParentData({ ...parentData, phone: value })
                      }
                    />
                    <Button
                      onClick={async () => {
                        const success = await handleUpdateProfile({
                          name: parentData.name,
                          email: parentData.email,
                          phone: parentData.phone,
                        });
                        if (success) {
                          toast.success("Profile updated successfully!");
                        } else {
                          toast.error("Failed to update profile");
                        }
                      }}
                    >
                      Update Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Children Information</CardTitle>
                  <CardDescription>
                    Your children's school details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(userData.childrenDetails || userData.children || []).map(
                    (child: any) => (
                      <div
                        key={child.id}
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src="" alt={child.name} />
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                              {getInitials(child.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{child.name}</h3>
                            <p className="text-muted-foreground">
                              Student ID: {child.id}
                            </p>
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
                            <p className="text-muted-foreground">
                              Academic Session
                            </p>
                            <p className="font-medium">2023/2024</p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-muted-foreground">
                              Class Teacher
                            </p>
                            <p className="font-medium">Mrs. Adebayo</p>
                          </div>
                        </div>
                      </div>
                    )
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
