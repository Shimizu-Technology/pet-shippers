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
  const [activeTab, setActiveTab] = useState<'templates' | 'products' | 'documents'>('templates');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingDocumentTemplate, setEditingDocumentTemplate] = useState<any | null>(null);
  const queryClient = useQueryClient();

  // 🚀 Use Convex queries instead of TanStack Query
  const convexQuoteTemplates = useConvexQuery(api.quoteTemplates.list);
  const convexProducts = useConvexQuery(api.products.listActive);
  const convexDocumentTemplates = useConvexQuery(api.documentTemplates.list);
  


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

  const documentTemplates = convexDocumentTemplates?.map((template: any) => ({
    id: template._id,
    title: template.title,
    description: template.description,
    category: template.category,
    requirements: template.requirements,
    active: template.active,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  })) || [];



  const templatesLoading = convexQuoteTemplates === undefined;
  const productsLoading = convexProducts === undefined;
  const documentTemplatesLoading = convexDocumentTemplates === undefined;

  // 🚀 Convex mutations for quote templates
  const convexCreateTemplate = useConvexMutation(api.quoteTemplates.create);
  const convexUpdateTemplate = useConvexMutation(api.quoteTemplates.update);
  const convexDeleteTemplate = useConvexMutation(api.quoteTemplates.remove);

  // 🚀 Convex mutations for products
  const convexCreateProduct = useConvexMutation(api.products.create);
  const convexUpdateProduct = useConvexMutation(api.products.update);
  const convexDeleteProduct = useConvexMutation(api.products.remove);

  // 🚀 Convex mutations for document templates
  const convexCreateDocumentTemplate = useConvexMutation(api.documentTemplates.create);
  const convexUpdateDocumentTemplate = useConvexMutation(api.documentTemplates.update);
  const convexDeleteDocumentTemplate = useConvexMutation(api.documentTemplates.remove);

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

  // Document Template Mutations
  const createDocumentTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      return await convexCreateDocumentTemplate({
        title: template.title,
        description: template.description,
        category: template.category,
        requirements: template.requirements,
      });
    },
    onSuccess: () => {
      setShowDocumentModal(false);
      setEditingDocumentTemplate(null);
    },
  });

  const updateDocumentTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      return await convexUpdateDocumentTemplate({
        id: template.id as Id<"documentTemplates">,
        title: template.title,
        description: template.description,
        category: template.category,
        requirements: template.requirements,
      });
    },
    onSuccess: () => {
      setShowDocumentModal(false);
      setEditingDocumentTemplate(null);
    },
  });

  const deleteDocumentTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await convexDeleteDocumentTemplate({ id: id as Id<"documentTemplates"> });
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

  const openDocumentModal = (template?: any) => {
    setEditingDocumentTemplate(template || null);
    setShowDocumentModal(true);
  };

  const tabs = [
    { id: 'templates' as const, name: 'Quote Templates', icon: FileText },
    { id: 'products' as const, name: 'Products', icon: Package },
    { id: 'documents' as const, name: 'Document Templates', icon: FileText },
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

        {/* Document Templates Tab */}
        {activeTab === 'documents' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <h2 className="text-lg sm:text-xl font-semibold text-[#0E2A47]">Document Templates</h2>
              <Button onClick={() => openDocumentModal()} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Template
              </Button>
            </div>

            {documentTemplatesLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0E2A47]"></div>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documentTemplates?.map((template) => (
                  <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-[#0E2A47] mb-1">{template.title}</h3>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                        {template.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {template.requirements.length} requirement{template.requirements.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDocumentModal(template)}
                          className="text-gray-400 hover:text-[#0E2A47] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteDocumentTemplateMutation.mutate(template.id)}
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

        {/* Document Template Modal */}
        <Modal
          isOpen={showDocumentModal}
          onClose={() => {
            setShowDocumentModal(false);
            setEditingDocumentTemplate(null);
          }}
          title={editingDocumentTemplate ? 'Edit Document Template' : 'Add Document Template'}
          size="lg"
        >
          <DocumentTemplateForm
            template={editingDocumentTemplate}
            onSubmit={(data) => {
              if (editingDocumentTemplate) {
                updateDocumentTemplateMutation.mutate({ ...data, id: editingDocumentTemplate.id });
              } else {
                createDocumentTemplateMutation.mutate(data);
              }
            }}
            isLoading={createDocumentTemplateMutation.isPending || updateDocumentTemplateMutation.isPending}
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

const DocumentTemplateForm: React.FC<{
  template: any | null;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}> = ({ template, onSubmit, isLoading }) => {
  const [title, setTitle] = useState(template?.title || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState(template?.category || 'domestic');
  const [requirements, setRequirements] = useState(template?.requirements || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      category,
      requirements,
    });
  };

  const addRequirement = () => {
    setRequirements([...requirements, {
      name: '',
      description: '',
      required: true,
      category: 'health_certificate',
      notes: '',
    }]);
  };

  const updateRequirement = (index: number, field: string, value: any) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], [field]: value };
    setRequirements(updated);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_: any, i: number) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Template Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0E2A47] focus:border-[#0E2A47] sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0E2A47] focus:border-[#0E2A47] sm:text-sm"
        >
          <option value="domestic">Domestic</option>
          <option value="international">International</option>
          <option value="special_needs">Special Needs</option>
          <option value="general">General</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Requirements ({requirements.length})
          </label>
          <Button type="button" onClick={addRequirement} className="text-sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Requirement
          </Button>
        </div>
        
        <div className="space-y-4">
          {requirements.map((req: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Requirement {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Name"
                  value={req.name}
                  onChange={(e) => updateRequirement(index, 'name', e.target.value)}
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <select
                    value={req.category}
                    onChange={(e) => updateRequirement(index, 'category', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0E2A47] focus:border-[#0E2A47] sm:text-sm"
                  >
                    <option value="health_certificate">Health Certificate</option>
                    <option value="vaccination_record">Vaccination Record</option>
                    <option value="import_permit">Import Permit</option>
                    <option value="export_permit">Export Permit</option>
                    <option value="photo">Photo</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={req.description}
                  onChange={(e) => updateRequirement(index, 'description', e.target.value)}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0E2A47] focus:border-[#0E2A47] sm:text-sm"
                  required
                />
              </div>
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={req.notes || ''}
                  onChange={(e) => updateRequirement(index, 'notes', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0E2A47] focus:border-[#0E2A47] sm:text-sm"
                  placeholder="Additional instructions or notes"
                />
              </div>
              
              <div className="mt-3 flex items-center">
                <input
                  type="checkbox"
                  id={`required-${index}`}
                  checked={req.required}
                  onChange={(e) => updateRequirement(index, 'required', e.target.checked)}
                  className="h-4 w-4 text-[#0E2A47] focus:ring-[#0E2A47] border-gray-300 rounded"
                />
                <label htmlFor={`required-${index}`} className="ml-2 block text-sm text-gray-900">
                  Required Document
                </label>
              </div>
            </div>
          ))}
        </div>
        
        {requirements.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">No requirements added yet</p>
            <p className="text-xs">Click "Add Requirement" to get started</p>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <Button type="submit" disabled={isLoading || requirements.length === 0} className="flex-1">
          {isLoading ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </form>
  );
};