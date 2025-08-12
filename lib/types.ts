
export interface User {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  phone?: string;
  especialidad?: string;
}

export interface Patient {
  id: string;
  numeroExpediente: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  birthDate?: Date;
  gender?: string;
  occupation?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
  insuranceInfo?: string;
  notes?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: string;
  reason?: string;
  status: string;
  notes?: string;
  duration: number;
  patient?: Patient;
  doctor?: User;
}

export interface Treatment {
  id: string;
  patientId: string;
  appointmentId?: string;
  doctorId: string;
  name: string;
  category: string;
  description?: string;
  diagnosis?: string;
  procedure?: string;
  medications?: string;
  instructions?: string;
  cost: number;
  status: string;
  startDate: Date;
  completedDate?: Date;
  notes?: string;
  patient?: Patient;
  doctor?: User;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  userId: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  issueDate: Date;
  dueDate?: Date;
  paidDate?: Date;
  notes?: string;
  patient?: Patient;
  user?: User;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  treatmentId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  treatment?: Treatment;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  paymentDate: Date;
}

export interface DashboardMetrics {
  todayAppointments: number;
  thisMonthRevenue: number;
  newPatientsThisMonth: number;
  completedTreatments: number;
  pendingPayments: number;
}
