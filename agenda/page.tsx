
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AgendaCalendar } from '@/components/agenda/AgendaCalendar';
import { AppointmentForm } from '@/components/agenda/AppointmentForm';
import { AgendaStats } from '@/components/agenda/AgendaStats';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  reason?: string;
  duration: number;
  patient: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  doctor: {
    name: string;
  };
}

export default function AgendaPage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  // Cargar citas
  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments');
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        console.error('Error al cargar citas:', response.statusText);
        toast.error('Error al cargar las citas');
      }
    } catch (error) {
      console.error('Error al cargar citas:', error);
      toast.error('Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleAppointmentCreated = () => {
    setIsFormOpen(false);
    loadAppointments();
    toast.success('Cita creada exitosamente');
  };

  const handleAppointmentUpdated = () => {
    loadAppointments();
    toast.success('Cita actualizada exitosamente');
  };

  const handleAppointmentDeleted = () => {
    loadAppointments();
    toast.success('Cita eliminada exitosamente');
  };

  // Estadísticas rápidas
  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0];
    return apt.date === today;
  });

  const completedToday = todayAppointments.filter(apt => apt.status === 'Completada');
  const pendingToday = todayAppointments.filter(apt => apt.status === 'Programada');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando agenda...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="w-7 h-7 mr-3 text-blue-600" />
              Agenda Médica
            </h1>
            <p className="mt-1 text-gray-600">
              Gestiona las citas y horarios de la clínica
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Cita
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nueva Cita</DialogTitle>
                </DialogHeader>
                <AppointmentForm
                  onSuccess={handleAppointmentCreated}
                  onCancel={() => setIsFormOpen(false)}
                  selectedDate={selectedDate}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500">Citas Hoy</dt>
                <dd className="text-2xl font-bold text-gray-900">{todayAppointments.length}</dd>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500">Completadas</dt>
                <dd className="text-2xl font-bold text-gray-900">{completedToday.length}</dd>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500">Pendientes</dt>
                <dd className="text-2xl font-bold text-gray-900">{pendingToday.length}</dd>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500">Total Citas</dt>
                <dd className="text-2xl font-bold text-gray-900">{appointments.length}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de vista */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex space-x-2">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="capitalize"
              >
                {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
              </Button>
            ))}
          </div>
          <div className="mt-4 sm:mt-0">
            <p className="text-sm text-gray-600">
              Mostrando: {new Date(selectedDate).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-lg shadow-sm border">
          <AgendaCalendar
            appointments={appointments}
            viewMode={viewMode}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onAppointmentUpdate={handleAppointmentUpdated}
            onAppointmentDelete={handleAppointmentDeleted}
            onAppointmentCreate={(date) => {
              setSelectedDate(date);
              setIsFormOpen(true);
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
