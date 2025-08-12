

'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  FileText,
  User,
  MessageSquare,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  Smile,
  Plus,
  Edit,
  TrendingUp,
  Activity,
  Award,
  Heart,
  Save,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface Appointment {
  id: number;
  date: string;
  time: string;
  doctor: string;
  treatment: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface Document {
  id: string | number;
  name: string;
  type: 'prescription' | 'budget' | 'report' | 'xray';
  date: string;
  downloadUrl: string;
  status?: string;
  total?: number;
}

interface Message {
  id: number;
  from: string;
  subject: string;
  date: string;
  read: boolean;
  preview: string;
}

interface PatientProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  birthDate?: string;
}

interface AppointmentRequest {
  date: string;
  time: string;
  treatment: string;
  notes?: string;
}

export default function PatientPortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentRequest>({
    date: '',
    time: '',
    treatment: '',
    notes: '',
  });
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  });

  // Fetch data functions
  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/patient-portal/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Error al cargar las citas');
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/patient-portal/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Error al cargar los documentos');
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/patient-portal/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.patient) {
          setProfile(data.patient);
          setProfileForm({
            firstName: data.patient.firstName || '',
            lastName: data.patient.lastName || '',
            phone: data.patient.phone || '',
            address: data.patient.address || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error al cargar el perfil');
    }
  };

  const loadMockMessages = () => {
    const mockMessages = [
      {
        id: 1,
        from: 'Clínica SmileSys',
        subject: 'Bienvenido al Portal del Paciente',
        date: new Date().toISOString(),
        read: false,
        preview: 'Te damos la bienvenida a nuestro portal. Aquí podrás gestionar tus citas y documentos...',
      },
      {
        id: 2,
        from: 'Dr. García',
        subject: 'Recordatorio de Cuidados',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        preview: 'Recuerda mantener una buena higiene oral y usar el enjuague recomendado...',
      },
      {
        id: 3,
        from: 'Clínica SmileSys',
        subject: 'Promociones del mes',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        preview: 'Este mes tenemos promociones especiales en blanqueamiento y limpieza dental...',
      }
    ];
    setMessages(mockMessages);
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/portal/login');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchAppointments(),
        fetchDocuments(),
        fetchProfile(),
      ]);
      loadMockMessages();
      setIsLoading(false);
    };

    loadData();
  }, [session, status, router]);

  // Handle form submissions
  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!appointmentForm.date || !appointmentForm.time || !appointmentForm.treatment) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/patient-portal/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentForm),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Cita solicitada exitosamente. Te contactaremos pronto para confirmar.');
        setIsAppointmentDialogOpen(false);
        setAppointmentForm({ date: '', time: '', treatment: '', notes: '' });
        await fetchAppointments(); // Wait for the fetch to complete
      } else {
        throw new Error(result.error || 'Error al crear la cita');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error(error instanceof Error ? error.message : 'Error al solicitar la cita');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/patient-portal/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        toast.success('Perfil actualizado exitosamente');
        setIsProfileDialogOpen(false);
        fetchProfile();
      } else {
        throw new Error('Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    }
  };

  const handleDocumentDownload = async (doc: Document) => {
    try {
      toast.success('Iniciando descarga...');
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = doc.downloadUrl;
      link.target = '_blank';
      link.download = `documento-${doc.id}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error al descargar el documento');
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/portal/login' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Programada</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'prescription':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'budget':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'report':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'xray':
        return <FileText className="w-5 h-5 text-orange-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  // Calculate progress and stats
  const upcomingAppointments = appointments.filter(a => a.status === 'scheduled').length;
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;
  const totalAppointments = appointments.length;
  const treatmentProgress = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Smile className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portal del Paciente</h1>
                <p className="text-sm text-gray-500">SmileSys</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback>
                    {session.user?.firstName?.[0]}{session.user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {session.user?.firstName} {session.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Paciente</p>
                </div>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-1" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenido, {session.user?.firstName}
          </h2>
          <p className="text-gray-600">
            Aquí puedes ver tus avances, citas, documentos y mantenerte en contacto con la clínica.
          </p>
        </div>

        {/* Progress Dashboard */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Mi Progreso de Tratamiento</span>
              </CardTitle>
              <CardDescription>
                Resumen de tu avance en los tratamientos dentales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Progreso General</span>
                    <span className="text-sm font-medium">{Math.round(treatmentProgress)}%</span>
                  </div>
                  <Progress value={treatmentProgress} className="w-full" />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{completedAppointments}</p>
                    <p className="text-sm text-gray-600">Citas Completadas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{upcomingAppointments}</p>
                    <p className="text-sm text-gray-600">Próximas Citas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Próximas Citas</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingAppointments}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Documentos</p>
                  <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mensajes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {messages.filter(m => !m.read).length}
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Salud Dental</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(treatmentProgress)}%</p>
                </div>
                <Heart className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="appointments">Mis Citas</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="messages">Mensajes</TabsTrigger>
            <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle>Últimas Citas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {appointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{appointment.treatment}</h3>
                            <p className="text-sm text-gray-600">
                              {appointment.date} - {appointment.doctor}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Health Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Avances en Salud</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Award className="w-8 h-8 text-yellow-500" />
                      <div>
                        <h3 className="font-medium text-gray-900">Tratamiento Activo</h3>
                        <p className="text-sm text-gray-600">Progreso general del {Math.round(treatmentProgress)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Activity className="w-8 h-8 text-green-500" />
                      <div>
                        <h3 className="font-medium text-gray-900">Salud Oral</h3>
                        <p className="text-sm text-gray-600">Muy buena condición general</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Heart className="w-8 h-8 text-red-500" />
                      <div>
                        <h3 className="font-medium text-gray-900">Próximo Control</h3>
                        <p className="text-sm text-gray-600">
                          {upcomingAppointments > 0 ? 'Tienes citas programadas' : 'Sin citas programadas'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Mis Citas</CardTitle>
                    <CardDescription>
                      Historial y próximas citas médicas
                    </CardDescription>
                  </div>
                  <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Solicitar Cita
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Solicitar Nueva Cita</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAppointmentSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Fecha Preferida</Label>
                          <Input
                            id="date"
                            type="date"
                            value={appointmentForm.date}
                            onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time">Hora Preferida</Label>
                          <Select
                            value={appointmentForm.time}
                            onValueChange={(value) => setAppointmentForm({...appointmentForm, time: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una hora" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="08:00">8:00 AM</SelectItem>
                              <SelectItem value="09:00">9:00 AM</SelectItem>
                              <SelectItem value="10:00">10:00 AM</SelectItem>
                              <SelectItem value="11:00">11:00 AM</SelectItem>
                              <SelectItem value="14:00">2:00 PM</SelectItem>
                              <SelectItem value="15:00">3:00 PM</SelectItem>
                              <SelectItem value="16:00">4:00 PM</SelectItem>
                              <SelectItem value="17:00">5:00 PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="treatment">Tipo de Tratamiento</Label>
                          <Select
                            value={appointmentForm.treatment}
                            onValueChange={(value) => setAppointmentForm({...appointmentForm, treatment: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tratamiento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Consulta General">Consulta General</SelectItem>
                              <SelectItem value="Limpieza Dental">Limpieza Dental</SelectItem>
                              <SelectItem value="Blanqueamiento">Blanqueamiento</SelectItem>
                              <SelectItem value="Ortodoncia">Ortodoncia</SelectItem>
                              <SelectItem value="Endodoncia">Endodoncia</SelectItem>
                              <SelectItem value="Implantes">Implantes</SelectItem>
                              <SelectItem value="Urgencia">Urgencia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notas Adicionales</Label>
                          <Textarea
                            id="notes"
                            value={appointmentForm.notes}
                            onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
                            placeholder="Describe tu situación o síntomas..."
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setIsAppointmentDialogOpen(false)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button type="submit">
                            <Save className="w-4 h-4 mr-2" />
                            Solicitar Cita
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{appointment.treatment}</h3>
                          <p className="text-sm text-gray-600">
                            {appointment.date} a las {appointment.time}
                          </p>
                          <p className="text-sm text-gray-500">{appointment.doctor}</p>
                          {appointment.notes && (
                            <p className="text-sm text-gray-500 mt-1">{appointment.notes}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No tienes citas registradas</p>
                      <p className="text-sm">Solicita tu primera cita usando el botón de arriba</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Mis Documentos</CardTitle>
                <CardDescription>
                  Presupuestos, recetas y reportes disponibles para descarga
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getDocumentIcon(document.type)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{document.name}</h3>
                          <p className="text-sm text-gray-600">
                            Fecha: {new Date(document.date).toLocaleDateString('es-ES')}
                          </p>
                          {document.total && (
                            <p className="text-sm text-gray-500">
                              Total: ${document.total.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDocumentDownload(document)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No tienes documentos disponibles</p>
                      <p className="text-sm">Los documentos aparecerán aquí conforme se generen</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Mis Mensajes</CardTitle>
                <CardDescription>
                  Comunicación con la clínica y notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 ${
                        !message.read ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">{message.subject}</h3>
                          {!message.read && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Nuevo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{message.from}</p>
                        <p className="text-sm text-gray-500 mt-1">{message.preview}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(message.date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No tienes mensajes</p>
                      <p className="text-sm">Las notificaciones y mensajes aparecerán aquí</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Mi Perfil</CardTitle>
                    <CardDescription>
                      Información personal y configuración de cuenta
                    </CardDescription>
                  </div>
                  <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Perfil
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Actualizar Información Personal</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Nombre</Label>
                          <Input
                            id="firstName"
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Apellido</Label>
                          <Input
                            id="lastName"
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input
                            id="phone"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            placeholder="+1234567890"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Dirección</Label>
                          <Textarea
                            id="address"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                            placeholder="Tu dirección completa"
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setIsProfileDialogOpen(false)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button type="submit">
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      <AvatarFallback className="text-2xl">
                        {session.user?.firstName?.[0]}{session.user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {profile?.firstName} {profile?.lastName}
                      </h3>
                      <p className="text-gray-600">{profile?.email}</p>
                      <p className="text-sm text-gray-500">Paciente Activo</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <p className="text-gray-900">{profile?.firstName || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido
                      </label>
                      <p className="text-gray-900">{profile?.lastName || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900">{profile?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <p className="text-gray-900">{profile?.phone || 'No especificado'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <p className="text-gray-900">{profile?.address || 'No especificada'}</p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Resumen de Actividad
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{totalAppointments}</p>
                        <p className="text-sm text-gray-600">Total Citas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{completedAppointments}</p>
                        <p className="text-sm text-gray-600">Completadas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{documents.length}</p>
                        <p className="text-sm text-gray-600">Documentos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
