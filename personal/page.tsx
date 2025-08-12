

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Eye,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';

import { PersonalForm } from '@/components/personal/PersonalForm';
import { PersonalDetail } from '@/components/personal/PersonalDetail';
import { PermisosManager } from '@/components/personal/PermisosManager';
import { PersonalStats } from '@/components/personal/PersonalStats';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPCIONISTA' | 'AUXILIAR';
  especialidad?: string;
  licencia?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  fechaIngreso: string;
  permisos: string[];
  horarioTrabajo?: {
    lunes?: { inicio: string; fin: string };
    martes?: { inicio: string; fin: string };
    miercoles?: { inicio: string; fin: string };
    jueves?: { inicio: string; fin: string };
    viernes?: { inicio: string; fin: string };
    sabado?: { inicio: string; fin: string };
    domingo?: { inicio: string; fin: string };
  };
  createdAt: string;
  updatedAt: string;
}

export default function PersonalPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isPermisosDialogOpen, setIsPermisosDialogOpen] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState<StaffMember | null>(null);
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);

  // Fetch staff members
  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || []);
        setFilteredStaff(data.staff || []);
      } else {
        throw new Error('Error al cargar el personal');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Error al cargar el personal');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Filter staff based on search term, role, and status
  useEffect(() => {
    let filtered = staff;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.especialidad?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.estado === statusFilter);
    }

    setFilteredStaff(filtered);
  }, [staff, searchTerm, roleFilter, statusFilter]);

  const handleCreateStaff = () => {
    setEditingStaffMember(null);
    setIsFormDialogOpen(true);
  };

  const handleEditStaff = (member: StaffMember) => {
    setEditingStaffMember(member);
    setIsFormDialogOpen(true);
  };

  const handleViewStaff = (member: StaffMember) => {
    setSelectedStaffMember(member);
    setIsDetailDialogOpen(true);
  };

  const handleManagePermissions = (member: StaffMember) => {
    setSelectedStaffMember(member);
    setIsPermisosDialogOpen(true);
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este miembro del personal?')) {
      return;
    }

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Miembro del personal eliminado exitosamente');
        fetchStaff();
      } else {
        throw new Error('Error al eliminar el miembro del personal');
      }
    } catch (error) {
      console.error('Error deleting staff member:', error);
      toast.error('Error al eliminar el miembro del personal');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    
    try {
      const response = await fetch(`/api/staff/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: newStatus }),
      });

      if (response.ok) {
        toast.success(`Estado actualizado a ${newStatus}`);
        fetchStaff();
      } else {
        throw new Error('Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'DOCTOR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RECEPCIONISTA':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'AUXILIAR':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVO':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'SUSPENDIDO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'DOCTOR':
        return 'Doctor/a';
      case 'RECEPCIONISTA':
        return 'Recepcionista';
      case 'AUXILIAR':
        return 'Auxiliar';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando personal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Personal</h1>
          <p className="text-gray-600">
            Administra el personal de la clínica, sus roles y permisos
          </p>
        </div>
        <Button onClick={handleCreateStaff} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Personal
        </Button>
      </div>

      {/* Stats */}
      <PersonalStats staff={staff} />

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, email o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="DOCTOR">Doctor/a</SelectItem>
                <SelectItem value="RECEPCIONISTA">Recepcionista</SelectItem>
                <SelectItem value="AUXILIAR">Auxiliar</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ACTIVO">Activo</SelectItem>
                <SelectItem value="INACTIVO">Inactivo</SelectItem>
                <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <div className="grid gap-6">
        {filteredStaff.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontró personal
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'No hay personal que coincida con los filtros seleccionados.'
                  : 'Aún no has agregado ningún miembro del personal.'}
              </p>
              {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
                <Button onClick={handleCreateStaff}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primer Miembro
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredStaff.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {member.firstName[0]}{member.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {member.firstName} {member.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-600">{member.email}</p>
                          {member.phone && (
                            <p className="text-sm text-gray-600">{member.phone}</p>
                          )}
                          {member.especialidad && (
                            <p className="text-sm text-gray-600">• {member.especialidad}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getRoleBadgeColor(member.role)}>
                            {getRoleDisplayName(member.role)}
                          </Badge>
                          <Badge className={getStatusBadgeColor(member.estado)}>
                            {member.estado}
                          </Badge>
                          {member.permisos.length > 0 && (
                            <Badge variant="outline">
                              {member.permisos.length} permisos
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewStaff(member)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManagePermissions(member)}
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditStaff(member)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={member.estado === 'ACTIVO' ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleStatus(member.id, member.estado)}
                      >
                        {member.estado === 'ACTIVO' ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStaff(member.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStaffMember ? 'Editar Personal' : 'Agregar Personal'}
            </DialogTitle>
          </DialogHeader>
          <PersonalForm
            staffMember={editingStaffMember}
            onSave={() => {
              setIsFormDialogOpen(false);
              fetchStaff();
            }}
            onCancel={() => setIsFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Personal</DialogTitle>
          </DialogHeader>
          {selectedStaffMember && (
            <PersonalDetail
              staffMember={selectedStaffMember}
              onClose={() => setIsDetailDialogOpen(false)}
              onEdit={(member) => {
                setIsDetailDialogOpen(false);
                handleEditStaff(member);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPermisosDialogOpen} onOpenChange={setIsPermisosDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestión de Permisos</DialogTitle>
          </DialogHeader>
          {selectedStaffMember && (
            <PermisosManager
              staffMember={selectedStaffMember}
              onSave={() => {
                setIsPermisosDialogOpen(false);
                fetchStaff();
              }}
              onCancel={() => setIsPermisosDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
