
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Edit
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  brand?: string;
  supplier?: string;
  purchasePrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  location?: string;
  isActive: boolean;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryTransaction {
  id: string;
  productId: string;
  product: Product;
  type: string;
  quantity: number;
  unitPrice?: number;
  totalCost?: number;
  description?: string;
  stockBefore: number;
  stockAfter: number;
  createdAt: string;
}

export function InventoryModule() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    subcategory: '',
    brand: '',
    supplier: '',
    purchasePrice: 0,
    salePrice: 0,
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unit: 'unidad',
    location: ''
  });

  const [newTransaction, setNewTransaction] = useState({
    type: 'entrada',
    quantity: 0,
    unitPrice: 0,
    description: ''
  });

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      const [productsResponse, transactionsResponse] = await Promise.all([
        fetch('/api/inventory/products'),
        fetch('/api/inventory/transactions')
      ]);

      if (productsResponse.ok && transactionsResponse.ok) {
        const productsData = await productsResponse.json();
        const transactionsData = await transactionsResponse.json();
        setProducts(productsData);
        setTransactions(transactionsData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información del inventario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      if (response.ok) {
        const product = await response.json();
        setProducts([product, ...products]);
        setShowNewProductDialog(false);
        setNewProduct({
          code: '',
          name: '',
          description: '',
          category: '',
          subcategory: '',
          brand: '',
          supplier: '',
          purchasePrice: 0,
          salePrice: 0,
          currentStock: 0,
          minStock: 0,
          maxStock: 0,
          unit: 'unidad',
          location: ''
        });
        toast({
          title: "Producto creado",
          description: "El producto se ha agregado al inventario"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el producto",
        variant: "destructive"
      });
    }
  };

  const createTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const response = await fetch('/api/inventory/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTransaction,
          productId: selectedProduct.id
        })
      });

      if (response.ok) {
        const transaction = await response.json();
        setTransactions([transaction, ...transactions]);
        
        // Actualizar el stock del producto
        setProducts(products.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, currentStock: transaction.stockAfter }
            : p
        ));

        setShowTransactionDialog(false);
        setSelectedProduct(null);
        setNewTransaction({
          type: 'entrada',
          quantity: 0,
          unitPrice: 0,
          description: ''
        });

        toast({
          title: "Movimiento registrado",
          description: "El movimiento de inventario se ha registrado correctamente"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el movimiento",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter(p => p.currentStock <= p.minStock);
  const categories = [...new Set(products.map(p => p.category))];

  const inventoryMetrics = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0),
    lowStock: lowStockProducts.length,
    outOfStock: products.filter(p => p.currentStock === 0).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventario</h1>
          <p className="text-gray-500 mt-1">
            Control de productos y materiales dentales
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={showNewProductDialog} onOpenChange={setShowNewProductDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                <DialogDescription>
                  Ingresa la información del producto para agregarlo al inventario
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createProduct}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">Código *</Label>
                      <Input
                        id="code"
                        value={newProduct.code}
                        onChange={(e) => setNewProduct({...newProduct, code: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Nombre *</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Categoría *</Label>
                      <Input
                        id="category"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="subcategory">Subcategoría</Label>
                      <Input
                        id="subcategory"
                        value={newProduct.subcategory}
                        onChange={(e) => setNewProduct({...newProduct, subcategory: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand">Marca</Label>
                      <Input
                        id="brand"
                        value={newProduct.brand}
                        onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplier">Proveedor</Label>
                      <Input
                        id="supplier"
                        value={newProduct.supplier}
                        onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="purchasePrice">Precio Compra</Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        step="0.01"
                        value={newProduct.purchasePrice}
                        onChange={(e) => setNewProduct({...newProduct, purchasePrice: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="salePrice">Precio Venta</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        step="0.01"
                        value={newProduct.salePrice}
                        onChange={(e) => setNewProduct({...newProduct, salePrice: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unidad</Label>
                      <Input
                        id="unit"
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="currentStock">Stock Inicial</Label>
                      <Input
                        id="currentStock"
                        type="number"
                        value={newProduct.currentStock}
                        onChange={(e) => setNewProduct({...newProduct, currentStock: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minStock">Stock Mínimo</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={newProduct.minStock}
                        onChange={(e) => setNewProduct({...newProduct, minStock: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxStock">Stock Máximo</Label>
                      <Input
                        id="maxStock"
                        type="number"
                        value={newProduct.maxStock}
                        onChange={(e) => setNewProduct({...newProduct, maxStock: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowNewProductDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Crear Producto
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryMetrics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Productos en inventario
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(inventoryMetrics.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Valor del inventario
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{inventoryMetrics.lowStock}</div>
            <p className="text-xs text-muted-foreground">
              Productos con stock bajo
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inventoryMetrics.outOfStock}</div>
            <p className="text-xs text-muted-foreground">
              Productos agotados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Lista de Productos</CardTitle>
                  <CardDescription>
                    Gestión completa del inventario
                  </CardDescription>
                </div>
                <Button onClick={loadInventoryData} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Código</th>
                      <th className="text-left p-2">Producto</th>
                      <th className="text-left p-2">Categoría</th>
                      <th className="text-left p-2">Stock</th>
                      <th className="text-left p-2">Precio Compra</th>
                      <th className="text-left p-2">Precio Venta</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-left p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono text-sm">{product.code}</td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.brand}</div>
                          </div>
                        </td>
                        <td className="p-2">{product.category}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              product.currentStock <= product.minStock 
                                ? product.currentStock === 0 ? 'text-red-600' : 'text-amber-600'
                                : 'text-green-600'
                            }`}>
                              {product.currentStock}
                            </span>
                            <span className="text-sm text-gray-500">
                              {product.unit}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">{formatCurrency(product.purchasePrice)}</td>
                        <td className="p-2">{formatCurrency(product.salePrice)}</td>
                        <td className="p-2">
                          {product.currentStock === 0 && (
                            <Badge variant="destructive">Sin Stock</Badge>
                          )}
                          {product.currentStock > 0 && product.currentStock <= product.minStock && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                              Stock Bajo
                            </Badge>
                          )}
                          {product.currentStock > product.minStock && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Disponible
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowTransactionDialog(true);
                              }}
                            >
                              Movimiento
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Últimos Movimientos</CardTitle>
              <CardDescription>
                Historial de movimientos de inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No hay movimientos registrados</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Inventario</CardTitle>
              <CardDescription>
                Productos que requieren atención
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          Stock actual: {product.currentStock} {product.unit} 
                          (Mínimo: {product.minStock})
                        </div>
                      </div>
                    </div>
                    <Button size="sm">Reabastecer</Button>
                  </div>
                ))}
                {lowStockProducts.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No hay alertas de inventario</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para movimientos */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
            <DialogDescription>
              {selectedProduct && `Producto: ${selectedProduct.name} (Stock actual: ${selectedProduct.currentStock})`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createTransaction}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="type">Tipo de Movimiento</Label>
                <Select value={newTransaction.type} onValueChange={(value) => setNewTransaction({...newTransaction, type: value})}>
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
                  value={newTransaction.quantity}
                  onChange={(e) => setNewTransaction({...newTransaction, quantity: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              {newTransaction.type === 'entrada' && (
                <div>
                  <Label htmlFor="unitPrice">Precio Unitario</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={newTransaction.unitPrice}
                    onChange={(e) => setNewTransaction({...newTransaction, unitPrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTransactionDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Movimiento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
