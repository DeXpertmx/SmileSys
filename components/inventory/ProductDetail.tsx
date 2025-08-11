

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Edit, 
  ArrowLeft, 
  Package, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MapPin,
  Calendar,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProductDetailProps {
  product: any;
  onEdit: () => void;
  onBack: () => void;
}

export function ProductDetail({ product, onEdit, onBack }: ProductDetailProps) {
  const getStockStatus = (product: any) => {
    if (product.currentStock === 0) return { status: 'agotado', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (product.currentStock <= product.minStock) return { status: 'bajo', color: 'bg-orange-100 text-orange-800', icon: TrendingDown };
    if (product.currentStock >= product.maxStock) return { status: 'exceso', color: 'bg-purple-100 text-purple-800', icon: TrendingUp };
    return { status: 'normal', color: 'bg-green-100 text-green-800', icon: Package };
  };

  const stockStatus = getStockStatus(product);
  const StockIcon = stockStatus.icon;
  
  const stockValue = product.currentStock * product.purchasePrice;
  const potentialRevenue = product.currentStock * product.salePrice;
  const margin = product.salePrice - product.purchasePrice;
  const marginPercentage = product.purchasePrice > 0 ? ((margin / product.purchasePrice) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button
            variant="outline"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <Badge variant="outline">{product.code}</Badge>
            <Badge className={stockStatus.color}>
              <StockIcon className="h-3 w-3 mr-1" />
              {stockStatus.status === 'agotado' && 'Agotado'}
              {stockStatus.status === 'bajo' && 'Stock bajo'}
              {stockStatus.status === 'exceso' && 'Exceso'}
              {stockStatus.status === 'normal' && 'Normal'}
            </Badge>
            {!product.isActive && (
              <Badge variant="secondary">Inactivo</Badge>
            )}
          </div>
          
          {product.description && (
            <p className="text-gray-600 mb-4">{product.description}</p>
          )}
        </div>
        
        <Button
          onClick={onEdit}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar producto
        </Button>
      </div>

      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Información del Producto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Categoría:</span>
                <div className="font-medium">{product.category}</div>
              </div>
              {product.subcategory && (
                <div>
                  <span className="text-gray-500">Subcategoría:</span>
                  <div className="font-medium">{product.subcategory}</div>
                </div>
              )}
              {product.brand && (
                <div>
                  <span className="text-gray-500">Marca:</span>
                  <div className="font-medium">{product.brand}</div>
                </div>
              )}
              <div>
                <span className="text-gray-500">Unidad:</span>
                <div className="font-medium">{product.unit}</div>
              </div>
            </div>

            {product.location && (
              <>
                <Separator />
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Ubicación: {product.location}</span>
                </div>
              </>
            )}

            {product.expirationDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Vence: {format(new Date(product.expirationDate), "PPP", { locale: es })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Información Comercial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Precio compra:</span>
                <div className="font-medium text-lg">€{product.purchasePrice.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-500">Precio venta:</span>
                <div className="font-medium text-lg">€{product.salePrice.toFixed(2)}</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Margen unitario:</span>
                <span className={`font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{margin.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Margen %:</span>
                <span className={`font-medium ${marginPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {marginPercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {(product.supplier || product.supplierCode) && (
              <>
                <Separator />
                <div className="space-y-1">
                  {product.supplier && (
                    <div className="text-sm">
                      <span className="text-gray-500">Proveedor:</span>
                      <div className="font-medium">{product.supplier}</div>
                    </div>
                  )}
                  {product.supplierCode && (
                    <div className="text-sm">
                      <span className="text-gray-500">Código proveedor:</span>
                      <div className="font-medium">{product.supplierCode}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas de stock */}
      <Card>
        <CardHeader>
          <CardTitle>Control de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{product.currentStock}</div>
              <div className="text-sm text-gray-600">Stock Actual</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{product.minStock}</div>
              <div className="text-sm text-gray-600">Stock Mínimo</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{product.maxStock}</div>
              <div className="text-sm text-gray-600">Stock Máximo</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{product.reorderPoint}</div>
              <div className="text-sm text-gray-600">Punto Reorden</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {product.currentStock > 0 ? Math.floor(product.currentStock / (product.reorderPoint || 1)) : 0}
              </div>
              <div className="text-sm text-gray-600">Rotaciones Est.</div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-teal-600">€{stockValue.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Valor en Stock</div>
              <div className="text-xs text-gray-500">(a precio compra)</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-green-600">€{potentialRevenue.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Ingresos Potenciales</div>
              <div className="text-xs text-gray-500">(a precio venta)</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className={`text-xl font-bold ${(potentialRevenue - stockValue) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{(potentialRevenue - stockValue).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Margen Total</div>
              <div className="text-xs text-gray-500">(si se vende todo)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración y fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Estado:</span>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Manejo de lotes:</span>
              <Badge variant={product.requiresLot ? "default" : "outline"}>
                {product.requiresLot ? "Sí" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fechas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500">Creado:</span>
              <div className="font-medium">
                {format(new Date(product.createdAt), "PPP 'a las' p", { locale: es })}
              </div>
            </div>

            <div>
              <span className="text-gray-500">Última actualización:</span>
              <div className="font-medium">
                {format(new Date(product.updatedAt), "PPP 'a las' p", { locale: es })}
              </div>
            </div>

            {product.expirationDate && (
              <div>
                <span className="text-gray-500">Vencimiento:</span>
                <div className="font-medium">
                  {format(new Date(product.expirationDate), "PPP", { locale: es })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

