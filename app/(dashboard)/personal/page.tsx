
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Search,
  Filter,
  Shield,
  Activity,
  Mail,
  Phone,
  Calendar,
  Settings,
  Crown,
  Stethoscope,
  HeadphonesIcon as Reception,
  CheckCircle,
  XCircle,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import toast from 'react-hot-toast';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  especialidad?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  permissions?: string[];
}

interface StaffForm {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  especialidad: string;
  phone: string;
  permissions: string[];
  active: boolean;
}

const rolePermissions = {
  'Administrador': [
    'manage_staff',
    'view_all_patients',
    'manage_appointments',
    'view_financials',
    'manage_inventory',
    'system_settings',
    'export_reports',
    'manage_backups'
  ],
  'Dentista': [
    'view_assigned_patients',
    'manage_appointments',
    'create_treatments',
    'view_patient_history',
    'create_prescriptions',
    'manage_odontogram',
    'create_budgets'
  ],
  'Recepcionista': [
    'view_basic_patients',
    'schedule_appointments',
    'manage_calendar',
    'handle_payments',
    'basic_reports',
    'patient_communication'
  ]
};

const permissionLabels = {
  'manage_staff': 'Gestionar Personal',
  'view_all_patients': 'Ver Todos los Pacientes',
  'manage_appointments': 'Gestionar Citas',
  'view_financials': 'Ver Finanzas',
  'manage_inventory': 'Gestionar Inventario',
  'system_settings': 'Configuración del Sistema',
  'export_reports': 'Exportar Reportes',
  'manage_backups': 'Gestionar Respaldos',
  'view_assigned_patients': 'Ver Pacientes Asignados',
  'create_treatments': 'Crear Tratamientos',
  'view_patient_history': 'Ver Historial de Pacientes',
  'create_prescriptions': 'Crear Recetas',
  'manage_odontogram': 'Gestionar Odontograma',
  'create_budgets': 'Crear Presupuestos',
  'view_basic_patients': 'Ver Información Básica de Pacientes',
  'schedule_appointments': 'Programar Citas',
  'manage_calendar': 'Gestionar Calendario',
  'handle_payments': 'Manejar Pagos',
  'basic_reports': 'Reportes Básicos',
  'patient_communication': 'Comunicación con Pacientes'
};

export default function PersonalPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  
  const [staffForm, setStaffForm] = useState<StaffForm>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Recepcionista',
    especialidad: '',
    phone: '',
    permissions: [],
    active: true
  });

  // Check if user has permission to manage staff
  useEffect(() => {
    if (session?.user?.role !== 'Administrador') {
      toast.error('No tienes permisos para acceder a esta sección');
      router.push('/dashboard');
      return;
    }
    fetchStaff();
  }, [session, router]);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || []);
      } else {
        throw new Error('Error al cargar personal');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Error al cargar el personal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = selectedStaff ? `/api/staff/${selectedStaff.id}` : '/api/staff';
      const method = selectedStaff ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffForm),
      });

      if (response.ok) {
        const result = await response.json();
        if (!selectedStaff && result.tempPassword) {
          toast.success(
            `Personal agregado exitosamente. Contraseña temporal: ${result.tempPassword}`,
            { duration: 10000 }
          );
        } else {
          toast.success(selectedStaff ? 'Personal actualizado' : 'Personal agregado exitosamente');
        }
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setSelectedStaff(null);
        resetForm();
        fetchStaff();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el personal');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este miembro del personal?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Personal eliminado');
        fetchStaff();
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar el personal');
    }
  };

  const handleEdit = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setStaffForm({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      role: staffMember.role,
      especialidad: staffMember.especialidad || '',
      phone: staffMember.phone || '',
      permissions: staffMember.permissions || rolePermissions[staffMember.role as keyof typeof rolePermissions] || [],
      active: staffMember.active
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setStaffForm({
      firstName: '',
      lastName: '',
      email: '',
      role: 'Recepcionista',
      especialidad: '',
      phone: '',
      permissions: [],
      active: true
    });
    setSelectedStaff(null);
  };

  const updatePermissions = (role: string) => {
    const defaultPermissions = rolePermissions[role as keyof typeof rolePermissions] || [];
    setStaffForm(prev => ({
      ...prev,
      role,
      permissions: defaultPermissions
    }));
  };

  const togglePermission = (permission: string) => {
    setStaffForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Administrador':
        return <Crown className="w-5 h-5 text-yellow-600" />;
      case 'Dentista':
        return <Stethoscope className="w-5 h-5 text-blue-600" />;
      case 'Recepcionista':
        return <Reception className="w-5 h-5 text-green-600" />;
      default:
        return <Users className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Administrador':
        return 'bg-yellow-100 text-yellow-800';
      case 'Dentista':
        return 'bg-blue-100 text-blue-800';
      case 'Recepcionista':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando personal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="w-8 h-8 text-blue-600" />
            <span>Gestión de Personal</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Administra el equipo médico y administrativo de la clínica
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <UserPlus className="w-4 h-4 mr-2" />
              Agregar Personal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Personal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={staffForm.firstName}
                    onChange={(e) => setStaffForm({...staffForm, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={staffForm.lastName}
                    onChange={(e) => setStaffForm({...staffForm, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
                  placeholder="+57 300 123 4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={staffForm.role}
                  onValueChange={updatePermissions}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Dentista">Dentista</SelectItem>
                    <SelectItem value="Recepcionista">Recepcionista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {staffForm.role === 'Dentista' && (
                <div className="space-y-2">
                  <Label htmlFor="especialidad">Especialización</Label>
                  <Input
                    id="especialidad"
                    value={staffForm.especialidad}
                    onChange={(e) => setStaffForm({...staffForm, especialidad: e.target.value})}
                    placeholder="Ej: Ortodoncia, Endodoncia, Cirugía Oral"
                  />
                </div>
              )}
              
              <div className="space-y-3">
                <Label>Permisos del Rol</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={key}
                        checked={staffForm.permissions.includes(key)}
                        onChange={() => togglePermission(key)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={key} className="text-sm">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={staffForm.active}
                  onCheckedChange={(checked) => setStaffForm({...staffForm, active: checked})}
                />
                <Label>Activo</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar Personal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Personal</p>
                <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dentistas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staff.filter(s => s.role === 'Dentista').length}
                </p>
              </div>
              <Stethoscope className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recepcionistas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staff.filter(s => s.role === 'Recepcionista').length}
                </p>
              </div>
              <Reception className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Personal Activo</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staff.filter(s => s.active).length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Personal de la Clínica</CardTitle>
          <CardDescription>
            Lista completa del equipo médico y administrativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Roles</SelectItem>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Dentista">Dentista</SelectItem>
                  <SelectItem value="Recepcionista">Recepcionista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Staff List */}
          <div className="space-y-4">
            {filteredStaff.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {member.firstName[0]}{member.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </h3>
                      {member.active ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{member.email}</span>
                      </div>
                      
                      {member.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(member.createdAt).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                    
                    {member.especialidad && (
                      <p className="text-sm text-blue-600 mt-1">{member.especialidad}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={getRoleBadgeColor(member.role)}>
                    {getRoleIcon(member.role)}
                    <span className="ml-1">{member.role}</span>
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(member)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            
            {filteredStaff.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No se encontró personal</p>
                {searchTerm && (
                  <p className="text-sm text-gray-400 mt-1">
                    Intenta con un término de búsqueda diferente
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Personal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">Nombre</Label>
                <Input
                  id="edit-firstName"
                  value={staffForm.firstName}
                  onChange={(e) => setStaffForm({...staffForm, firstName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Apellido</Label>
                <Input
                  id="edit-lastName"
                  value={staffForm.lastName}
                  onChange={(e) => setStaffForm({...staffForm, lastName: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
                placeholder="+57 300 123 4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol</Label>
              <Select
                value={staffForm.role}
                onValueChange={updatePermissions}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Dentista">Dentista</SelectItem>
                  <SelectItem value="Recepcionista">Recepcionista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {staffForm.role === 'Dentista' && (
              <div className="space-y-2">
                <Label htmlFor="edit-especialidad">Especialización</Label>
                <Input
                  id="edit-especialidad"
                  value={staffForm.especialidad}
                  onChange={(e) => setStaffForm({...staffForm, especialidad: e.target.value})}
                  placeholder="Ej: Ortodoncia, Endodoncia, Cirugía Oral"
                />
              </div>
            )}
            
            <div className="space-y-3">
              <Label>Permisos del Rol</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg">
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-${key}`}
                      checked={staffForm.permissions.includes(key)}
                      onChange={() => togglePermission(key)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`edit-${key}`} className="text-sm">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={staffForm.active}
                onCheckedChange={(checked) => setStaffForm({...staffForm, active: checked})}
              />
              <Label>Activo</Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Actualizar Personal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
