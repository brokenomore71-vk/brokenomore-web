"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { IconSettings, IconDeviceFloppy, IconGift, IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";

interface Settings {
  maintenanceMode: boolean;
  allowSignups: boolean;
}

interface CreditPackage {
  id: string;
  name: string;
  description: string;
  credits: number;
  bonus_credits: number;
  price_paise: number;
  currency: string;
  is_active: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    maintenanceMode: false,
    allowSignups: true,
  });
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    credits: '',
    bonus_credits: '0',
    price_paise: '',
    currency: 'INR',
    is_active: true,
  });

  useEffect(() => {
    loadSettings();
    loadPackages();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/packages', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePackageSubmit = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const packageData = {
        name: packageForm.name,
        description: packageForm.description,
        credits: parseInt(packageForm.credits),
        bonus_credits: parseInt(packageForm.bonus_credits || '0'),
        price_paise: parseInt(packageForm.price_paise) * 100, // Convert rupees to paise
        currency: packageForm.currency,
        is_active: packageForm.is_active,
      };

      let response;
      if (editingPackage) {
        // Update existing package
        response = await fetch(`/api/admin/packages/${editingPackage.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(packageData),
        });
      } else {
        // Create new package
        response = await fetch('/api/admin/packages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(packageData),
        });
      }

      if (response.ok) {
        setShowPackageModal(false);
        setEditingPackage(null);
        setPackageForm({
          name: '',
          description: '',
          credits: '',
          bonus_credits: '0',
          price_paise: '',
          currency: 'INR',
          is_active: true,
        });
        loadPackages();
        alert(editingPackage ? 'Package updated successfully!' : 'Package created successfully!');
      } else {
        alert('Failed to save package');
      }
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Error saving package');
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/packages/${packageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        loadPackages();
        alert('Package deleted successfully!');
      } else {
        alert('Failed to delete package');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Error deleting package');
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Configure your platform settings and preferences
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <IconSettings className="h-5 w-5 sm:h-6 sm:w-6 text-[#6B46C1]" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">General Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Allow New Signups
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enable or disable new user registrations
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowSignups}
                  onChange={(e) => setSettings({ ...settings, allowSignups: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#6B46C1]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Maintenance Mode
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Put the platform in maintenance mode
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#6B46C1]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Package Management */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <div className="flex items-center gap-3">
              <IconGift className="h-5 w-5 sm:h-6 sm:w-6 text-[#6B46C1]" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Package Management</h2>
            </div>
            <button
              onClick={() => {
                setEditingPackage(null);
                setPackageForm({
                  name: '',
                  description: '',
                  credits: '',
                  bonus_credits: '0',
                  price_paise: '',
                  currency: 'INR',
                  is_active: true,
                });
                setShowPackageModal(true);
              }}
              className="flex items-center gap-2 bg-[#6B46C1] text-white px-4 py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-[#553C9A] transition w-full sm:w-auto justify-center"
            >
              <IconPlus className="h-4 w-4 sm:h-5 sm:w-5" />
              Add Package
            </button>
          </div>
          
          {packages.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No packages found</p>
              <p className="text-sm mt-2">Click "Add Package" to create a new credit package</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-neutral-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Credits</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Bonus</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">{pkg.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{pkg.description}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{pkg.credits.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{pkg.bonus_credits.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        ₹{(pkg.price_paise / 100).toFixed(2)} {pkg.currency}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          pkg.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {pkg.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingPackage(pkg);
                              setPackageForm({
                                name: pkg.name,
                                description: pkg.description,
                                credits: pkg.credits.toString(),
                                bonus_credits: pkg.bonus_credits.toString(),
                                price_paise: (pkg.price_paise / 100).toString(), // Convert paise to rupees
                                currency: pkg.currency,
                                is_active: pkg.is_active,
                              });
                              setShowPackageModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                            title="Edit package"
                          >
                            <IconEdit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            title="Delete package"
                          >
                            <IconTrash className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-[#6B46C1] text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-lg font-semibold hover:bg-[#553C9A] transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
          >
            <IconDeviceFloppy className="h-4 w-4 sm:h-5 sm:w-5" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Package Modal */}
      {showPackageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowPackageModal(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              {editingPackage ? 'Edit Package' : 'Create New Package'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Package Name
                </label>
                <input
                  type="text"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                  placeholder="e.g., Pro Plan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                  placeholder="Package description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    value={packageForm.credits}
                    onChange={(e) => setPackageForm({ ...packageForm, credits: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                    placeholder="1500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bonus Credits
                  </label>
                  <input
                    type="number"
                    value={packageForm.bonus_credits}
                    onChange={(e) => setPackageForm({ ...packageForm, bonus_credits: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={packageForm.price_paise}
                  onChange={(e) => setPackageForm({ ...packageForm, price_paise: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
                  placeholder="299"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={packageForm.is_active}
                    onChange={(e) => setPackageForm({ ...packageForm, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#6B46C1]"></div>
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setShowPackageModal(false);
                  setEditingPackage(null);
                }}
                className="flex-1 bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePackageSubmit}
                className="flex-1 bg-[#6B46C1] text-white py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-[#553C9A] transition"
              >
                {editingPackage ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
