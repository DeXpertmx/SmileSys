
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock,
  TrendingUp,
  AlertTriangle,
  Activity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardMetrics } from "@/lib/types";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: string;
  color: string;
  index: number;
}

function MetricCard({ title, value, description, icon: Icon, trend, color, index }: MetricCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const numValue = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, '')) || 0 : value;
    const timer = setTimeout(() => {
      let start = 0;
      const duration = 1000;
      const increment = numValue / (duration / 16);
      
      const animate = () => {
        start += increment;
        if (start < numValue) {
          setAnimatedValue(Math.floor(start));
          requestAnimationFrame(animate);
        } else {
          setAnimatedValue(numValue);
        }
      };
      animate();
    }, index * 200);

    return () => clearTimeout(timer);
  }, [value, index]);

  const formatValue = (val: number) => {
    if (typeof value === 'string' && value.includes('$')) {
      return `$${val.toLocaleString()}`;
    }
    return val.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="dental-card hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold dental-text-primary animate-count-up">
            {formatValue(animatedValue)}
          </div>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
          {trend && (
            <div className="flex items-center mt-2 text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              {trend}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardContent() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todayAppointments: 0,
    thisMonthRevenue: 0,
    newPatientsThisMonth: 0,
    completedTreatments: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de métricas - más tarde se conectará con la API real
    const fetchMetrics = async () => {
      // Simulando delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics({
        todayAppointments: 12,
        thisMonthRevenue: 45250,
        newPatientsThisMonth: 28,
        completedTreatments: 156,
        pendingPayments: 8,
      });
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  const metricCards = [
    {
      title: "Citas de Hoy",
      value: metrics.todayAppointments,
      description: "Citas programadas para hoy",
      icon: Calendar,
      trend: "+12% vs ayer",
      color: "bg-blue-500",
    },
    {
      title: "Ingresos del Mes",
      value: `$${metrics.thisMonthRevenue.toLocaleString()}`,
      description: "Facturación de este mes",
      icon: DollarSign,
      trend: "+8.2% vs mes anterior",
      color: "bg-green-500",
    },
    {
      title: "Pacientes Nuevos",
      value: metrics.newPatientsThisMonth,
      description: "Nuevos pacientes este mes",
      icon: Users,
      trend: "+15% vs mes anterior",
      color: "bg-purple-500",
    },
    {
      title: "Tratamientos Completados",
      value: metrics.completedTreatments,
      description: "Tratamientos finalizados",
      icon: CheckCircle,
      color: "bg-cyan-500",
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold dental-text-primary">Dashboard</h1>
        <p className="text-gray-600">Resumen general de tu clínica dental</p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric, index) => (
          <MetricCard
            key={metric.title}
            {...metric}
            index={index}
          />
        ))}
      </div>

      {/* Alert Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="dental-card border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex-1">
                <CardTitle className="text-lg text-orange-900">
                  Pagos Pendientes
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Facturas que requieren seguimiento
                </CardDescription>
              </div>
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 mb-2">
                {metrics.pendingPayments}
              </div>
              <p className="text-sm text-orange-700">
                Facturas vencidas o por cobrar
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="dental-card border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex-1">
                <CardTitle className="text-lg dental-text-primary">
                  Actividad Reciente
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Últimas acciones en el sistema
                </CardDescription>
              </div>
              <Activity className="w-6 h-6 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-gray-600">Nueva cita programada - hace 5 min</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-gray-600">Paciente registrado - hace 15 min</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-gray-600">Tratamiento completado - hace 1h</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Card className="dental-card">
          <CardHeader>
            <CardTitle className="dental-text-primary">Acciones Rápidas</CardTitle>
            <CardDescription>
              Acceso directo a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <motion.a
                href="/agenda"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group"
              >
                <Calendar className="w-6 h-6 text-blue-600 mr-3 group-hover:text-blue-700" />
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-900">
                    Nueva Cita
                  </h3>
                  <p className="text-sm text-gray-500">Programar cita para paciente</p>
                </div>
              </motion.a>

              <motion.a
                href="/pacientes"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group"
              >
                <Users className="w-6 h-6 text-blue-600 mr-3 group-hover:text-blue-700" />
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-900">
                    Nuevo Paciente
                  </h3>
                  <p className="text-sm text-gray-500">Registrar paciente nuevo</p>
                </div>
              </motion.a>

              <motion.a
                href="/facturacion"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group"
              >
                <DollarSign className="w-6 h-6 text-blue-600 mr-3 group-hover:text-blue-700" />
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-900">
                    Nueva Factura
                  </h3>
                  <p className="text-sm text-gray-500">Crear factura para paciente</p>
                </div>
              </motion.a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
