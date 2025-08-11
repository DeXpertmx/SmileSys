

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Calendar, CheckCircle, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InventoryAlert {
  id: string;
  type: string;
  message: string;
  priority: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  product: {
    id: string;
    name: string;
    code: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
  };
}

export function InventoryAlerts() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'unresolved'>('unread');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/inventory/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const response = await fetch(`/api/inventory/alerts/${alertId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setAlerts(alerts.map(alert => 
          alert.id === alertId ? { ...alert, isRead: true } : alert
        ));
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const markAsResolved = async (alertId: string) => {
    try {
      const response = await fetch(`/api/inventory/alerts/${alertId}/resolve`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setAlerts(alerts.map(alert => 
          alert.id === alertId ? { ...alert, isResolved: true, isRead: true } : alert
        ));
        toast.success('Alerta resuelta');
      }
    } catch (error) {
      console.error('Error marking alert as resolved:', error);
      toast.error('Error al resolver la alerta');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'stock_bajo': return AlertTriangle;
      case 'agotado': return Package;
      case 'vencimiento_proximo': return Calendar;
      default: return AlertTriangle;
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'Normal': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Baja': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'unread': return !alert.isRead;
      case 'unresolved': return !alert.isResolved;
      case 'all': return true;
      default: return true;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Alertas de Inventario</h1>
          <p className="text-gray-600">Notificaciones sobre estado del stock</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            onClick={() => setFilter('unread')}
            size="sm"
          >
            No leídas ({alerts.filter(a => !a.isRead).length})
          </Button>
          <Button
            variant={filter === 'unresolved' ? 'default' : 'outline'}
            onClick={() => setFilter('unresolved')}
            size="sm"
          >
            Sin resolver ({alerts.filter(a => !a.isResolved).length})
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Todas
          </Button>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Críticas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.filter(a => a.priority === 'Alta' && !a.isResolved).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.filter(a => a.type === 'stock_bajo' && !a.isResolved).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Agotados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.filter(a => a.type === 'agotado' && !a.isResolved).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resueltas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.filter(a => a.isResolved).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de alertas */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const AlertIcon = getAlertIcon(alert.type);
            return (
              <Card 
                key={alert.id} 
                className={`transition-all ${
                  !alert.isRead ? 'border-l-4 border-l-teal-500 bg-teal-50/30' : ''
                } ${alert.isResolved ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${getAlertColor(alert.priority)}`}>
                        <AlertIcon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getAlertColor(alert.priority)}>
                            {alert.priority}
                          </Badge>
                          <Badge variant="outline">
                            {alert.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {!alert.isRead && (
                            <Badge variant="default" className="bg-teal-600">
                              Nueva
                            </Badge>
                          )}
                          {alert.isResolved && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resuelta
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-900 font-medium mb-2">{alert.message}</p>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <span className="font-medium">Producto:</span> {alert.product.name} ({alert.product.code})
                          </div>
                          <div className="flex items-center gap-4">
                            <span>
                              <span className="font-medium">Stock actual:</span> {alert.product.currentStock}
                            </span>
                            <span>
                              <span className="font-medium">Stock mínimo:</span> {alert.product.minStock}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-3">
                          {format(new Date(alert.createdAt), "PPP 'a las' p", { locale: es })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {!alert.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(alert.id)}
                        >
                          Marcar leída
                        </Button>
                      )}
                      
                      {!alert.isResolved && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => markAsResolved(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No hay alertas' : `No hay alertas ${filter === 'unread' ? 'sin leer' : 'sin resolver'}`}
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Tu inventario está en buen estado' 
                : `Todas las alertas han sido ${filter === 'unread' ? 'leídas' : 'resueltas'}`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

