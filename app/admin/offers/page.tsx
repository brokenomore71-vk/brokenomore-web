"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { 
  IconGift, 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconSearch, 
  IconRefresh,
  IconUpload,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconDownload
} from "@tabler/icons-react";

interface Offer {
  id: string;
  external_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  site_url: string;
  status: 'active' | 'inactive';
  is_enabled: boolean;
  category: string | null;
  region: string[] | null;
  date_start: string | null;
  date_end: string | null;
  action_ranges: any;
  reward_info: string | null;
  priority: number | null;
  display_order: number | null;
  rating: number | null;
  performance_metrics: any;
  source: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [enabledFilter, setEnabledFilter] = useState<string>("all");
  const [dateStatusFilter, setDateStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [regionFilter, setRegionFilter] = useState<string>("");
  
  // Sorting
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Bulk Upload
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    created: number;
    skipped: number;
    errors: Array<{ row: number; external_id?: string; errors: string[] }>;
  } | null>(null);

  // Create Offer
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    site_url: '',
    external_id: '',
    description: '',
    image_url: '',
    status: 'active' as 'active' | 'inactive',
    is_enabled: true,
    category: '',
    region: '',
    date_start: '',
    date_end: '',
    reward_info: '',
    priority: '0',
    display_order: '',
    rating: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Edit Offer
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [updating, setUpdating] = useState(false);
  const [loadingOffer, setLoadingOffer] = useState(false);

  // Delete Offer
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingOffer, setDeletingOffer] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadOffers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (enabledFilter !== 'all') {
        params.append('enabled', enabledFilter === 'enabled' ? 'true' : 'false');
      }
      if (dateStatusFilter !== 'all') {
        params.append('dateStatus', dateStatusFilter);
      }
      if (categoryFilter) {
        params.append('category', categoryFilter);
      }
      if (regionFilter) {
        params.append('region', regionFilter);
      }

      const response = await fetch(`/api/admin/offers?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || []);
        setPagination(data.pagination || pagination);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load offers:', response.status, errorData);
      }
    } catch (error) {
      console.error("Error loading offers:", error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, enabledFilter, dateStatusFilter, categoryFilter, regionFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setPage(1);
    switch (filterType) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'enabled':
        setEnabledFilter(value);
        break;
      case 'dateStatus':
        setDateStatusFilter(value);
        break;
      case 'category':
        setCategoryFilter(value);
        break;
      case 'region':
        setRegionFilter(value);
        break;
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start && !end) return 'No dates';
    if (!start) return `Until ${formatDate(end)}`;
    if (!end) return `From ${formatDate(start)}`;
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const getDateStatus = (start: string | null, end: string | null) => {
    const now = new Date();
    if (!start && !end) return 'active';
    if (start) {
      const startDate = new Date(start);
      if (startDate > now) return 'upcoming';
    }
    if (end) {
      const endDate = new Date(end);
      if (endDate < now) return 'expired';
    }
    return 'active';
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file to upload');
      return;
    }

    // Validate file type
    const fileName = uploadFile.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      alert('Please upload a .xlsx or .xls file');
      return;
    }

    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to upload offers');
        return;
      }

      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch('/api/admin/offers/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadResults(data);
        // Refresh offers list
        await loadOffers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Upload failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadResults(null);
    }
  };

  const closeBulkUploadModal = () => {
    setShowBulkUploadModal(false);
    setUploadFile(null);
    setUploadResults(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to download template');
        return;
      }

      const response = await fetch('/api/admin/offers/bulk-upload/template', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to download template: ${errorData.error || 'Unknown error'}`);
        return;
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `offer-upload-template-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Error downloading template. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.site_url.trim()) {
      errors.site_url = 'Site URL is required';
    } else {
      try {
        new URL(formData.site_url);
      } catch {
        errors.site_url = 'Site URL must be a valid URL';
      }
    }

    if (formData.image_url && formData.image_url.trim()) {
      try {
        new URL(formData.image_url);
      } catch {
        errors.image_url = 'Image URL must be a valid URL';
      }
    }

    if (formData.rating && formData.rating.trim()) {
      const rating = parseFloat(formData.rating);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        errors.rating = 'Rating must be between 0 and 5';
      }
    }

    if (formData.date_start && formData.date_end) {
      const startDate = new Date(formData.date_start);
      const endDate = new Date(formData.date_end);
      if (endDate < startDate) {
        errors.date_end = 'End date must be after start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateOffer = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to create offers');
        return;
      }

      // Prepare request body
      const requestBody: any = {
        name: formData.name.trim(),
        site_url: formData.site_url.trim(),
        status: formData.status,
        is_enabled: formData.is_enabled,
      };

      if (formData.external_id.trim()) {
        requestBody.external_id = formData.external_id.trim();
      }
      if (formData.description.trim()) {
        requestBody.description = formData.description.trim();
      }
      if (formData.image_url.trim()) {
        requestBody.image_url = formData.image_url.trim();
      }
      if (formData.category.trim()) {
        requestBody.category = formData.category.trim();
      }
      if (formData.region.trim()) {
        requestBody.region = formData.region.split(',').map(r => r.trim()).filter(r => r.length > 0);
      }
      if (formData.date_start) {
        requestBody.date_start = new Date(formData.date_start).toISOString();
      }
      if (formData.date_end) {
        requestBody.date_end = new Date(formData.date_end).toISOString();
      }
      if (formData.reward_info.trim()) {
        requestBody.reward_info = formData.reward_info.trim();
      }
      if (formData.priority) {
        requestBody.priority = parseInt(formData.priority, 10);
      }
      if (formData.display_order.trim()) {
        requestBody.display_order = parseInt(formData.display_order, 10);
      }
      if (formData.rating.trim()) {
        requestBody.rating = parseFloat(formData.rating);
      }

      const response = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        // Reset form and close modal
        setFormData({
          name: '',
          site_url: '',
          external_id: '',
          description: '',
          image_url: '',
          status: 'active',
          is_enabled: true,
          category: '',
          region: '',
          date_start: '',
          date_end: '',
          reward_info: '',
          priority: '0',
          display_order: '',
          rating: '',
        });
        setFormErrors({});
        setShowCreateModal(false);
        // Refresh offers list
        await loadOffers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to create offer: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      alert('Error creating offer. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormErrors({});
  };

  const handleEditOffer = async (offer: Offer) => {
    setEditingOffer(offer);
    setShowEditModal(true);
    setLoadingOffer(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to edit offers');
        return;
      }

      // Fetch full offer details
      const response = await fetch(`/api/admin/offers/${offer.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const fullOffer = await response.json();
        setEditingOffer(fullOffer);
        
        // Populate form with offer data
        setFormData({
          name: fullOffer.name || '',
          site_url: fullOffer.site_url || '',
          external_id: fullOffer.external_id || '',
          description: fullOffer.description || '',
          image_url: fullOffer.image_url || '',
          status: fullOffer.status || 'active',
          is_enabled: fullOffer.is_enabled ?? true,
          category: fullOffer.category || '',
          region: fullOffer.region ? fullOffer.region.join(', ') : '',
          date_start: fullOffer.date_start ? new Date(fullOffer.date_start).toISOString().slice(0, 16) : '',
          date_end: fullOffer.date_end ? new Date(fullOffer.date_end).toISOString().slice(0, 16) : '',
          reward_info: fullOffer.reward_info || '',
          priority: fullOffer.priority?.toString() || '0',
          display_order: fullOffer.display_order?.toString() || '',
          rating: fullOffer.rating?.toString() || '',
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to load offer: ${errorData.error || 'Unknown error'}`);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error loading offer:', error);
      alert('Error loading offer. Please try again.');
      setShowEditModal(false);
    } finally {
      setLoadingOffer(false);
    }
  };

  const handleUpdateOffer = async () => {
    if (!editingOffer) return;
    
    if (!validateForm()) {
      return;
    }

    try {
      setUpdating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to update offers');
        return;
      }

      // Prepare request body (only changed fields)
      // Editable fields: name, site_url, description, image_url, status, is_enabled, 
      // category, region, date_start, date_end, reward_info, priority, display_order, rating
      // Immutable fields (NOT included): external_id, performance_metrics, created_by, source, created_at, updated_at, id
      const requestBody: any = {};

      if (formData.name.trim() !== editingOffer.name) {
        requestBody.name = formData.name.trim();
      }
      if (formData.site_url.trim() !== editingOffer.site_url) {
        requestBody.site_url = formData.site_url.trim();
      }
      if (formData.description.trim() !== (editingOffer.description || '')) {
        requestBody.description = formData.description.trim() || null;
      }
      if (formData.image_url.trim() !== (editingOffer.image_url || '')) {
        requestBody.image_url = formData.image_url.trim() || null;
      }
      if (formData.status !== editingOffer.status) {
        requestBody.status = formData.status;
      }
      if (formData.is_enabled !== editingOffer.is_enabled) {
        requestBody.is_enabled = formData.is_enabled;
      }
      if (formData.category.trim() !== (editingOffer.category || '')) {
        requestBody.category = formData.category.trim() || null;
      }
      
      const currentRegion = editingOffer.region ? editingOffer.region.join(', ') : '';
      if (formData.region.trim() !== currentRegion) {
        requestBody.region = formData.region.trim() 
          ? formData.region.split(',').map(r => r.trim()).filter(r => r.length > 0)
          : null;
      }

      const currentDateStart = editingOffer.date_start ? new Date(editingOffer.date_start).toISOString().slice(0, 16) : '';
      if (formData.date_start !== currentDateStart) {
        requestBody.date_start = formData.date_start ? new Date(formData.date_start).toISOString() : null;
      }

      const currentDateEnd = editingOffer.date_end ? new Date(editingOffer.date_end).toISOString().slice(0, 16) : '';
      if (formData.date_end !== currentDateEnd) {
        requestBody.date_end = formData.date_end ? new Date(formData.date_end).toISOString() : null;
      }

      if (formData.reward_info.trim() !== (editingOffer.reward_info || '')) {
        requestBody.reward_info = formData.reward_info.trim() || null;
      }

      const currentPriority = editingOffer.priority?.toString() || '0';
      if (formData.priority !== currentPriority) {
        requestBody.priority = formData.priority ? parseInt(formData.priority, 10) : null;
      }

      const currentDisplayOrder = editingOffer.display_order?.toString() || '';
      if (formData.display_order !== currentDisplayOrder) {
        requestBody.display_order = formData.display_order ? parseInt(formData.display_order, 10) : null;
      }

      const currentRating = editingOffer.rating?.toString() || '';
      if (formData.rating !== currentRating) {
        requestBody.rating = formData.rating ? parseFloat(formData.rating) : null;
      }

      const response = await fetch(`/api/admin/offers/${editingOffer.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingOffer(null);
        setFormErrors({});
        // Refresh offers list
        await loadOffers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to update offer: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating offer:', error);
      alert('Error updating offer. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingOffer(null);
    setFormErrors({});
  };

  const handleDeleteOffer = (offer: Offer) => {
    setDeletingOffer(offer);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingOffer) return;

    try {
      setDeleting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to delete offers');
        return;
      }

      const response = await fetch(`/api/admin/offers/${deletingOffer.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setDeletingOffer(null);
        // Refresh offers list
        await loadOffers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to delete offer: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Error deleting offer. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingOffer(null);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Offers
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Create and manage special offers and promotions
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="flex items-center gap-2 bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-neutral-700 transition w-full sm:w-auto justify-center"
          >
            <IconUpload className="h-4 w-4 sm:h-5 sm:w-5" />
            Bulk Upload
          </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#6B46C1] text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-lg font-semibold hover:bg-[#553C9A] transition w-full sm:w-auto justify-center"
        >
          <IconPlus className="h-4 w-4 sm:h-5 sm:w-5" />
          Create Offer
        </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search offers by name, description, or external_id..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  loadOffers();
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={enabledFilter}
              onChange={(e) => handleFilterChange('enabled', e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
            >
              <option value="all">All Enabled</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
            <select
              value={dateStatusFilter}
              onChange={(e) => handleFilterChange('dateStatus', e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
            >
              <option value="all">All Dates</option>
              <option value="active">Active Now</option>
              <option value="upcoming">Upcoming</option>
              <option value="expired">Expired</option>
            </select>
            <input
              type="text"
              placeholder="Category..."
              value={categoryFilter}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
            />
            <input
              type="text"
              placeholder="Region..."
              value={regionFilter}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => loadOffers()}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
            >
              <IconRefresh className="h-5 w-5" />
              Refresh
            </button>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing {offers.length} of {pagination.total} offers
            </div>
          </div>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B46C1] mx-auto"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading offers...</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
          <IconGift className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mb-2">No offers found</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mb-6">
              {searchTerm || statusFilter !== 'all' || enabledFilter !== 'all' || dateStatusFilter !== 'all' || categoryFilter || regionFilter
                ? "Try adjusting your filters"
                : "Create your first offer to start promoting special deals"}
          </p>
            {!searchTerm && statusFilter === 'all' && enabledFilter === 'all' && dateStatusFilter === 'all' && !categoryFilter && !regionFilter && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#6B46C1] text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-lg font-semibold hover:bg-[#553C9A] transition"
          >
            Create Your First Offer
          </button>
            )}
        </div>
      ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-neutral-800">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700"
                      onClick={() => handleSort('created_at')}
                    >
                      Name {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Enabled
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date Range
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700"
                      onClick={() => handleSort('priority')}
                    >
                      Priority {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-800">
                  {offers.map((offer) => {
                    const dateStatus = getDateStatus(offer.date_start, offer.date_end);
                    return (
                      <tr key={offer.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {offer.name}
                  </div>
                          {offer.external_id && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {offer.external_id}
                  </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {offer.category || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            offer.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {offer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            offer.is_enabled
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {offer.is_enabled ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {offer.region && offer.region.length > 0 
                              ? offer.region.join(', ')
                              : 'N/A'}
                </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDateRange(offer.date_start, offer.date_end)}
                          </div>
                          <div className={`text-xs mt-1 ${
                            dateStatus === 'active' ? 'text-green-600' :
                            dateStatus === 'upcoming' ? 'text-blue-600' :
                            'text-red-600'
                          }`}>
                            {dateStatus === 'active' ? 'Active' :
                             dateStatus === 'upcoming' ? 'Upcoming' :
                             'Expired'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {offer.priority ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(offer.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex gap-2">
                            <button
                              onClick={() => handleEditOffer(offer)}
                              className="text-[#6B46C1] hover:text-[#553C9A]"
                            >
                              <IconEdit className="h-5 w-5" />
                  </button>
                            <button
                              onClick={() => handleDeleteOffer(offer)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <IconTrash className="h-5 w-5" />
                  </button>
                </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-neutral-800">
              {offers.map((offer) => {
                const dateStatus = getDateStatus(offer.date_start, offer.date_end);
                return (
                  <div key={offer.id} className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-800">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {offer.name}
                </div>
                        {offer.external_id && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {offer.external_id}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => handleEditOffer(offer)}
                          className="text-[#6B46C1] hover:text-[#553C9A]"
                        >
                          <IconEdit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <IconTrash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3 text-xs sm:text-sm">
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Category</div>
                        <div className="text-gray-900 dark:text-white mt-1">{offer.category || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Status</div>
                        <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          offer.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {offer.status}
                  </span>
                </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Enabled</div>
                        <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          offer.is_enabled
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {offer.is_enabled ? 'Yes' : 'No'}
                  </span>
                </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Priority</div>
                        <div className="text-gray-900 dark:text-white mt-1">{offer.priority ?? 0}</div>
              </div>
            </div>
                    {offer.region && offer.region.length > 0 && (
                      <div className="text-xs sm:text-sm mb-3">
                        <div className="text-gray-500 dark:text-gray-400">Region</div>
                        <div className="text-gray-900 dark:text-white mt-1">{offer.region.join(', ')}</div>
                      </div>
                    )}
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Created: {formatDate(offer.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && offers.length > 0 && pagination.totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  const newPage = page - 1;
                  setPage(newPage);
                }}
                disabled={page === 1}
                className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 dark:border-neutral-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                }}
                disabled={page >= pagination.totalPages}
                className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 dark:border-neutral-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeBulkUploadModal}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Bulk Upload Offers
              </h2>
              <button
                onClick={closeBulkUploadModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {!uploadResults ? (
                <>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload an Excel file (.xlsx or .xls) with offer data. Required columns: <strong>name</strong>, <strong>site_url</strong>.
                        Optional columns: external_id, description, image_url, status, is_enabled, category, region, date_start, date_end, reward_info, priority, display_order, rating.
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="w-full mb-4 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition flex items-center justify-center gap-2 border border-gray-300 dark:border-neutral-700"
                    >
                      <IconDownload className="h-4 w-4" />
                      Download Excel Template
                    </button>
                    <div className="border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <IconUpload className="h-12 w-12 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {uploadFile ? uploadFile.name : 'Click to select Excel file'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          .xlsx or .xls files only
                        </span>
                      </label>
                    </div>
                    {uploadFile && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Selected: <strong>{uploadFile.name}</strong> ({(uploadFile.size / 1024).toFixed(2)} KB)
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      onClick={closeBulkUploadModal}
                      className="flex-1 bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkUpload}
                      disabled={!uploadFile || uploading}
                      className="flex-1 bg-[#6B46C1] text-white py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-[#553C9A] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <IconUpload className="h-4 w-4" />
                          Upload
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <IconCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-semibold text-green-800 dark:text-green-200">
                          Upload Complete!
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {uploadResults.created} offers created successfully
                        </p>
                      </div>
                    </div>

                    {uploadResults.skipped > 0 && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <IconAlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                            {uploadResults.skipped} rows skipped
                          </p>
                        </div>
                        {uploadResults.errors.length > 0 && (
                          <div className="mt-3 max-h-60 overflow-y-auto">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                              Errors:
                            </p>
                            <div className="space-y-2">
                              {uploadResults.errors.map((error, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 bg-white dark:bg-neutral-800 rounded text-xs"
                                >
                                  <p className="font-medium">
                                    Row {error.row}
                                    {error.external_id && ` (${error.external_id})`}:
                                  </p>
                                  <ul className="list-disc list-inside mt-1 text-gray-600 dark:text-gray-400">
                                    {error.errors.map((err, errIdx) => (
                                      <li key={errIdx}>{err}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                    <button
                      onClick={closeBulkUploadModal}
                      className="flex-1 bg-[#6B46C1] text-white py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-[#553C9A] transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setUploadFile(null);
                        setUploadResults(null);
                      }}
                      className="flex-1 bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
                    >
                      Upload Another File
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Offer Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeCreateModal}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Create New Offer
              </h2>
              <button
                onClick={closeCreateModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Required Fields */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'
                    }`}
                    placeholder="Enter offer name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Site URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.site_url}
                    onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 ${
                      formErrors.site_url ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'
                    }`}
                    placeholder="https://example.com"
                  />
                  {formErrors.site_url && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.site_url}</p>
                  )}
                </div>

                {/* Optional Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    External ID
                  </label>
                  <input
                    type="text"
                    value={formData.external_id}
                    onChange={(e) => setFormData({ ...formData, external_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                    placeholder="OFFER-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                    placeholder="Retail, Food, etc."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                    placeholder="Offer description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 ${
                      formErrors.image_url ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'
                    }`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formErrors.image_url && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.image_url}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Region (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                    placeholder="IN, US, UK"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enabled
                  </label>
                  <select
                    value={formData.is_enabled ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date Start
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.date_start}
                    onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date End
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.date_end}
                    onChange={(e) => setFormData({ ...formData, date_end: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 ${
                      formErrors.date_end ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'
                    }`}
                  />
                  {formErrors.date_end && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.date_end}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rating (0-5)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 ${
                      formErrors.rating ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'
                    }`}
                    placeholder="4.5"
                  />
                  {formErrors.rating && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.rating}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reward Info
                  </label>
                  <input
                    type="text"
                    value={formData.reward_info}
                    onChange={(e) => setFormData({ ...formData, reward_info: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                    placeholder="Reward information..."
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                <button
                  onClick={closeCreateModal}
                  className="flex-1 bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOffer}
                  disabled={creating}
                  className="flex-1 bg-[#6B46C1] text-white py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-[#553C9A] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <IconPlus className="h-4 w-4" />
                      Create Offer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Offer Modal */}
      {showEditModal && editingOffer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeEditModal}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Edit Offer
              </h2>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {loadingOffer ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B46C1] mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading offer details...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Required Fields */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 ${
                          formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'
                        }`}
                        placeholder="Enter offer name"
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Site URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={formData.site_url}
                        onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 ${
                          formErrors.site_url ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'
                        }`}
                        placeholder="https://example.com"
                      />
                      {formErrors.site_url && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.site_url}</p>
                      )}
                    </div>

                    {/* External ID - Read Only */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        External ID (Immutable)
                      </label>
                      <input
                        type="text"
                        value={formData.external_id}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
                        placeholder="Cannot be changed after creation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                        placeholder="Retail, Food, etc."
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                        placeholder="Offer description..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 ${
                          formErrors.image_url ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'
                        }`}
                        placeholder="https://example.com/image.jpg"
                      />
                      {formErrors.image_url && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.image_url}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Region (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                        placeholder="IN, US, UK"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Enabled
                      </label>
                      <select
                        value={formData.is_enabled ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, is_enabled: e.target.value === 'true' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date Start
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.date_start}
                        onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date End
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.date_end}
                        onChange={(e) => setFormData({ ...formData, date_end: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 ${
                          formErrors.date_end ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'
                        }`}
                      />
                      {formErrors.date_end && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.date_end}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priority
                      </label>
                      <input
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rating (0-5)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 ${
                          formErrors.rating ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'
                        }`}
                        placeholder="4.5"
                      />
                      {formErrors.rating && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.rating}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reward Info
                      </label>
                      <input
                        type="text"
                        value={formData.reward_info}
                        onChange={(e) => setFormData({ ...formData, reward_info: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                        placeholder="Reward information..."
                      />
                    </div>

                    {/* Performance Metrics - Read Only */}
                    {editingOffer.performance_metrics && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Performance Metrics (Read-Only)
                        </label>
                        <div className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-gray-100 dark:bg-neutral-800 text-sm text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-xs">
                            {JSON.stringify(editingOffer.performance_metrics, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                    <button
                      onClick={closeEditModal}
                      className="flex-1 bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateOffer}
                      disabled={updating}
                      className="flex-1 bg-[#6B46C1] text-white py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-[#553C9A] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <IconCheck className="h-4 w-4" />
                          Update Offer
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingOffer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeDeleteModal}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <IconAlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Delete Offer
                </h2>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Are you sure you want to delete this offer?
              </p>
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 mb-4">
                <p className="font-semibold text-gray-900 dark:text-white">{deletingOffer.name}</p>
                {deletingOffer.external_id && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ID: {deletingOffer.external_id}
                  </p>
                )}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mb-4 font-medium">
                ⚠️ This action cannot be undone. The offer will be permanently deleted from the database.
              </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="flex-1 bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-neutral-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <IconTrash className="h-4 w-4" />
                      Delete Offer
                    </>
                  )}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
