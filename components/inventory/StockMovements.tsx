

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, RotateCcw, History } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface StockMovement {
  id: string;
  transactionNumber: string;
  type: string;
  subtype?: string;
  quantity: number;
  unitPrice?: number;
  totalCost?: number;
  reference?: string;
  description?: string;
  stockBefore: number;
  stockAfter: number;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
  product: {
    name: string;
    code: string;
  };
}

interface StockMovementsProps {
  productId?: string;
  onBack: () => void;
}

export function StockMovements({ productId, onBack }: StockMovementsProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewMovement, setShowNewMovement] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(productId || "");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const [newMovement, setNewMovement] = useState({
    type: "entrada",
    subtype: "",
    quantity: 1,
    unitPrice: 0,
    reference: "",
    description: "",
    notes: "",
  });

  useEffect(() => {
    if (selectedProductId) {
      fetchMovements();
    }
    fetchProducts();
  }, [selectedProductId]);

  const fetchMovements = async () => {
    if (!selectedProductId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/movements?productId=${selectedProductId}`);
      if (response.ok) {
        const data = await response.json();
        setMovements(data);
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory/products?active=true');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductId) {
      toast.error('Selecciona un producto');
      return;
    }

    try {
      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProductId,
          ...newMovement,
          totalCost: newMovement.quantity * newMovement.unitPrice,
        }),
      });

      if (response.ok) {
        fetchMovements();
        setShowNewMovement(false);
        setNewMovement({
          type: "entrada",
          subtype: "",
          quantity: 1,
          unitPrice: 0,
          reference: "",
          description: "",
          notes: "",
        });
        toast.success('Movimiento registrado correctamente');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al registrar el movimiento');
      }
    } catch (error) {
      console.error('Error creating movement:', error);
      toast.error('Error de conexión');
    }
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'entrada': return TrendingUp;
      case 'salida': return TrendingDown;
      case 'ajuste': return RotateCcw;
      default: return History;
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'bg-green-100 text-green-800';
      case 'salida': return 'bg-red-100 text-red-800';
      case 'ajuste': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMovements = movements.filter(movement => {
    return typeFilter === "all" || movement.type === typeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="outline"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <h1 className="text-2xl font-bold">Movimientos de Stock</h1>
          <p className="text-gray-600">Historial de entradas, salidas y ajustes de inventario</p>
        </div>
        
        <Dialog open={showNewMovement} onOpenChange={setShowNewMovement}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Movimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Movimiento de Stock</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateMovement} className="space-y-4">
              <div>
                <Label htmlFor="product">Producto</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                  disabled={!!productId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo de movimiento</Label>
                  <Select
                    value={newMovement.type}
                    onValueChange={(value) => setNewMovement({ ...newMovement, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="salida">Salida</SelectItem>
                      <SelectItem value="ajuste">Ajuste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newMovement.quantity}
                    onChange={(e) => setNewMovement({ 
                      ...newMovement, 
                      quantity: parseInt(e.target.value) || 0 
                    })}
                    required
                  />
                </div>
              </div>

              {newMovement.type === 'entrada' && (
                <div>
                  <Label htmlFor="unitPrice">Precio unitario (€)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={newMovement.unitPrice}
                    onChange={(e) => setNewMovement({ 
                      ...newMovement, 
                      unitPrice: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="reference">Referencia</Label>
                <Input
                  id="reference"
                  value={newMovement.reference}
                  onChange={(e) => setNewMovement({ ...newMovement, reference: e.target.value })}
                  placeholder="Ej: Factura #123, Orden compra #456"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newMovement.description}
                  onChange={(e) => setNewMovement({ ...newMovement, description: e.target.value })}
                  placeholder="Describe el motivo del movimiento"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewMovement(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                  Registrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="productSelect">Producto</Label>
              <Select
                value={selectedProductId}
                onValueChange={(value) => {
                  setSelectedProductId(value);
                  if (!value) setMovements([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto para ver movimientos" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Label htmlFor="typeFilter">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de movimiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="salida">Salidas</SelectItem>
                  <SelectItem value="ajuste">Ajustes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de movimientos */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
        </div>
      ) : filteredMovements.length > 0 ? (
        <div className="space-y-4">
          {filteredMovements.map((movement) => {
            const TypeIcon = getMovementTypeIcon(movement.type);
            return (
              <Card key={movement.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <TypeIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{movement.transactionNumber}</h3>
                          <Badge className={getMovementTypeColor(movement.type)}>
                            {movement.type.charAt(0).toUpperCase() + movement.type.slice(1)}
                          </Badge>
                          {movement.subtype && (
                            <Badge variant="outline">{movement.subtype}</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                          <div>
                            <span className="font-medium">Stock antes:</span> {movement.stockBefore}
                          </div>
                          <div>
                            <span className="font-medium">Cantidad:</span> 
                            <span className={movement.type === 'salida' ? 'text-red-600' : 'text-green-600'}>
                              {movement.type === 'salida' ? '-' : '+'}{movement.quantity}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Stock después:</span> {movement.stockAfter}
                          </div>
                        </div>

                        {movement.description && (
                          <p className="text-sm text-gray-600 mb-2">{movement.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {format(new Date(movement.createdAt), "PPP 'a las' p", { locale: es })}
                          </span>
                          <span>por {movement.user.firstName} {movement.user.lastName}</span>
                          {movement.reference && <span>Ref: {movement.reference}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {movement.unitPrice && (
                        <div className="text-sm text-gray-600">
                          €{movement.unitPrice.toFixed(2)} / unidad
                        </div>
                      )}
                      {movement.totalCost && (
                        <div className="font-medium">
                          €{movement.totalCost.toFixed(2)}
                        </div>
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
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedProductId ? "No hay movimientos registrados" : "Selecciona un producto"}
            </h3>
            <p className="text-gray-600">
              {selectedProductId 
                ? "Este producto aún no tiene movimientos de stock registrados"
                : "Selecciona un producto para ver su historial de movimientos"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

