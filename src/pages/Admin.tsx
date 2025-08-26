import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Package, FileText } from 'lucide-react';
import { http } from '../lib/http';
import { QuoteTemplate, Product } from '../types';
import { formatCurrency } from '../lib/utils';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
// Convex imports
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'products'>('templates');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  // 🚀 Use Convex queries instead of TanStack Query
  const convexQuoteTemplates = useConvexQuery(api.quoteTemplates.list);
  const convexProducts = useConvexQuery(api.products.listActive);

  // Transform Convex data to match existing types
  const quoteTemplates = convexQuoteTemplates?.map((template: any) => ({
    id: template._id,
    title: template.title,
    body: template.body,
    defaultPriceCents: template.defaultPriceCents,
    active: template.active,
  })) || [];

  const products = convexProducts?.map((product: any) => ({
    id: product._id,
    name: product.name,
    sku: product.sku,
    priceCents: product.priceCents,
    active: product.active,
  })) || [];

  const templatesLoading = convexQuoteTemplates === undefined;
  const productsLoading = convexProducts === undefined;

  // 🚀 Convex mutations for quote templates
  const convexCreateTemplate = useConvexMutation(api.quoteTemplates.create);
  const convexUpdateTemplate = useConvexMutation(api.quoteTemplates.update);
  const convexDeleteTemplate = useConvexMutation(api.quoteTemplates.remove);

  // 🚀 Convex mutations for products
  const convexCreateProduct = useConvexMutation(api.products.create);
  const convexUpdateProduct = useConvexMutation(api.products.update);
  const convexDeleteProduct = useConvexMutation(api.products.remove);

  const createTemplateMutation = useMutation({
    mutationFn: async (template: Omit<QuoteTemplate, 'id'>) => {
      return await convexCreateTemplate({
        title: template.title,
        body: template.body,
        defaultPriceCents: template.defaultPriceCents,
      });
    },
    onSuccess: () => {
      // No need to invalidate queries - Convex updates automatically!
      setShowTemplateModal(false);
      setEditingTemplate(null);
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (template: QuoteTemplate) => {
      return await convexUpdateTemplate({
        id: template.id as Id<"quoteTemplates">,
        title: template.title,
        body: template.body,
        defaultPriceCents: template.defaultPriceCents,
      });
    },
    onSuccess: () => {
      // No need to invalidate queries - Convex updates automatically!
      setShowTemplateModal(false);
      setEditingTemplate(null);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await convexDeleteTemplate({ id: id as Id<"quoteTemplates"> });
    },
    onSuccess: () => {
      // No need to invalidate queries - Convex updates automatically!
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (product: Omit<Product, 'id'>) => {
      return await convexCreateProduct({
        name: product.name,
        sku: product.sku,
        priceCents: product.priceCents,
        active: product.active,
      });
    },
    onSuccess: () => {
      // No need to invalidate queries - Convex updates automatically!
      setShowProductModal(false);
      setEditingProduct(null);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (product: Product) => {
      return await convexUpdateProduct({
        id: product.id as Id<"products">,
        name: product.name,
        sku: product.sku,
        priceCents: product.priceCents,
        active: product.active,
      });
    },
    onSuccess: () => {
      // No need to invalidate queries - Convex updates automatically!
      setShowProductModal(false);
      setEditingProduct(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await convexDeleteProduct({ id: id as Id<"products"> });
    },
    onSuccess: () => {
      // No need to invalidate queries - Convex updates automatically!
    },
  });

  const openTemplateModal = (template?: QuoteTemplate) => {
    setEditingTemplate(template || null);
    setShowTemplateModal(true);
  };

  const openProductModal = (product?: Product) => {
    setEditingProduct(product || null);
    setShowProductModal(true);
  };

  const tabs = [
    { id: 'templates' as const, name: 'Quote Templates', icon: FileText },
    { id: 'products' as const, name: 'Products', icon: Package },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#0E2A47] mb-4 sm:mb-6">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6">
          <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#F3C0CF] text-[#0E2A47]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quote Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <h2 className="text-lg sm:text-xl font-semibold text-[#0E2A47]">Quote Templates</h2>
              <Button onClick={() => openTemplateModal()} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Template
              </Button>
            </div>

            {templatesLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0E2A47]"></div>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quoteTemplates?.map((template) => (
                  <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-[#0E2A47] mb-2">{template.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.body}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-[#0E2A47]">
                        {formatCurrency(template.defaultPriceCents)}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openTemplateModal(template)}
                          className="text-gray-400 hover:text-[#0E2A47] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <h2 className="text-lg sm:text-xl font-semibold text-[#0E2A47]">Products</h2>
              <Button onClick={() => openProductModal()} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            {productsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0E2A47]"></div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="divide-y divide-gray-200">
                  {products?.map((product) => (
                    <div key={product.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-[#0E2A47]">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-lg font-bold text-[#0E2A47]">
                            {formatCurrency(product.priceCents)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            product.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.active ? 'Active' : 'Inactive'}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openProductModal(product)}
                              className="text-gray-400 hover:text-[#0E2A47] transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteProductMutation.mutate(product.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Template Modal */}
        <Modal
          isOpen={showTemplateModal}
          onClose={() => {
            setShowTemplateModal(false);
            setEditingTemplate(null);
          }}
          title={editingTemplate ? 'Edit Template' : 'Add Template'}
          size="lg"
        >
          <QuoteTemplateForm
            template={editingTemplate}
            onSubmit={(data) => {
              if (editingTemplate) {
                updateTemplateMutation.mutate({ ...editingTemplate, ...data });
              } else {
                createTemplateMutation.mutate(data);
              }
            }}
            isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending}
          />
        </Modal>

        {/* Product Modal */}
        <Modal
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          size="md"
        >
          <ProductForm
            product={editingProduct}
            onSubmit={(data) => {
              if (editingProduct) {
                updateProductMutation.mutate({ ...editingProduct, ...data });
              } else {
                createProductMutation.mutate(data);
              }
            }}
            isLoading={createProductMutation.isPending || updateProductMutation.isPending}
          />
        </Modal>
      </div>
    </Layout>
  );
};

const QuoteTemplateForm: React.FC<{
  template: QuoteTemplate | null;
  onSubmit: (data: Omit<QuoteTemplate, 'id'>) => void;
  isLoading: boolean;
}> = ({ template, onSubmit, isLoading }) => {
  const [title, setTitle] = useState(template?.title || '');
  const [body, setBody] = useState(template?.body || '');
  const [price, setPrice] = useState(
    template ? (template.defaultPriceCents / 100).toString() : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      body,
      defaultPriceCents: Math.round(parseFloat(price) * 100),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Template Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Template Body
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0E2A47] focus:border-[#0E2A47] sm:text-sm"
          required
        />
      </div>
      <Input
        type="number"
        label="Default Price (USD)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        step="0.01"
        min="0"
        required
      />
      <div className="flex space-x-3">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </form>
  );
};

const ProductForm: React.FC<{
  product: Product | null;
  onSubmit: (data: Omit<Product, 'id'>) => void;
  isLoading: boolean;
}> = ({ product, onSubmit, isLoading }) => {
  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [price, setPrice] = useState(
    product ? (product.priceCents / 100).toString() : ''
  );
  const [active, setActive] = useState(product?.active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      sku,
      priceCents: Math.round(parseFloat(price) * 100),
      active,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="SKU"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        required
      />
      <Input
        type="number"
        label="Price (USD)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        step="0.01"
        min="0"
        required
      />
      <div className="flex items-center">
        <input
          type="checkbox"
          id="active"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4 text-[#0E2A47] focus:ring-[#0E2A47] border-gray-300 rounded"
        />
        <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
          Active
        </label>
      </div>
      <div className="flex space-x-3">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : 'Save Product'}
        </Button>
      </div>
    </form>
  );
};