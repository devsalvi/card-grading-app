import { useState, useEffect } from 'react';
import {
  listAdminServiceTiers,
  updateServiceTier,
  deleteServiceTier
} from '../services/adminServiceTiersService';
import './ServiceTierManager.css';

function ServiceTierManager({ adminCompany }) {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState({
    company: adminCompany || '',
    tierId: '',
    name: '',
    turnaround: '',
    price: '',
    description: '',
    order: 0
  });

  useEffect(() => {
    loadServiceTiers();
  }, [adminCompany]);

  const loadServiceTiers = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await listAdminServiceTiers(adminCompany);

      // Handle both single company array and grouped object
      if (Array.isArray(result.tiers)) {
        setTiers(result.tiers);
      } else if (adminCompany && result.tiers[adminCompany]) {
        setTiers(result.tiers[adminCompany]);
      } else {
        // Flatten all tiers if Super Admin
        const allTiers = Object.values(result.tiers || {}).flat();
        setTiers(allTiers);
      }

    } catch (err) {
      console.error('Error loading service tiers:', err);
      setError(err.message || 'Failed to load service tiers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order' ? parseInt(value) || 0 : value
    }));
  };

  const handleEdit = (tier) => {
    setEditingTier(tier);
    setFormData({
      company: tier.company,
      tierId: tier.tierId,
      name: tier.name,
      turnaround: tier.turnaround,
      price: tier.price,
      description: tier.description,
      order: tier.order || 0
    });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditingTier(null);
    setFormData({
      company: adminCompany || '',
      tierId: '',
      name: '',
      turnaround: '',
      price: '',
      description: '',
      order: 0
    });
    setError('');
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');

      // Validate
      if (!formData.company || !formData.tierId || !formData.name ||
          !formData.turnaround || !formData.price || !formData.description) {
        setError('All fields are required');
        return;
      }

      await updateServiceTier(formData);

      setSuccess(editingTier ? 'Service tier updated successfully!' : 'Service tier created successfully!');
      setEditingTier(null);
      setFormData({
        company: adminCompany || '',
        tierId: '',
        name: '',
        turnaround: '',
        price: '',
        description: '',
        order: 0
      });

      // Reload tiers
      await loadServiceTiers();

    } catch (err) {
      console.error('Error saving service tier:', err);
      setError(err.message || 'Failed to save service tier');
    }
  };

  const handleDelete = async (company, tierId) => {
    if (!confirm(`Are you sure you want to delete this service tier? This action cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await deleteServiceTier(company, tierId);

      setSuccess('Service tier deleted successfully!');

      // Reload tiers
      await loadServiceTiers();

    } catch (err) {
      console.error('Error deleting service tier:', err);
      setError(err.message || 'Failed to delete service tier');
    }
  };

  const handleNewTier = () => {
    setEditingTier({ isNew: true });
    setFormData({
      company: adminCompany || '',
      tierId: '',
      name: '',
      turnaround: '',
      price: '',
      description: '',
      order: (tiers.length + 1) * 10
    });
    setError('');
    setSuccess('');
  };

  if (loading) {
    return <div className="service-tier-manager loading">Loading service tiers...</div>;
  }

  return (
    <div className="service-tier-manager">
      <div className="manager-header">
        <h2>Service Tier Management</h2>
        <button className="btn-new" onClick={handleNewTier}>
          + Add New Tier
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      {editingTier && (
        <div className="tier-form">
          <h3>{editingTier.isNew ? 'Create New Service Tier' : 'Edit Service Tier'}</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Company *</label>
              <select
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                disabled={!editingTier.isNew || adminCompany}
              >
                <option value="">Select Company</option>
                <option value="psa">PSA</option>
                <option value="bgs">BGS</option>
                <option value="sgc">SGC</option>
                <option value="cgc">CGC</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tier ID *</label>
              <input
                type="text"
                name="tierId"
                value={formData.tierId}
                onChange={handleInputChange}
                disabled={!editingTier.isNew}
                placeholder="e.g., express, premium"
              />
              <small>Unique identifier (lowercase, no spaces)</small>
            </div>

            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Express"
              />
            </div>

            <div className="form-group">
              <label>Turnaround Time *</label>
              <input
                type="text"
                name="turnaround"
                value={formData.turnaround}
                onChange={handleInputChange}
                placeholder="e.g., 5 business days"
              />
            </div>

            <div className="form-group">
              <label>Price *</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g., $150/card"
              />
            </div>

            <div className="form-group">
              <label>Display Order</label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                placeholder="0"
              />
              <small>Lower numbers appear first</small>
            </div>

            <div className="form-group full-width">
              <label>Description *</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., Quick turnaround"
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-save" onClick={handleSave}>
              Save Tier
            </button>
            <button className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="tiers-list">
        {tiers.length === 0 ? (
          <p className="no-tiers">No service tiers found. Click "Add New Tier" to create one.</p>
        ) : (
          <table className="tiers-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Name</th>
                <th>Turnaround</th>
                <th>Price</th>
                <th>Description</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.sort((a, b) => (a.order || 0) - (b.order || 0)).map((tier) => (
                <tr key={`${tier.company}-${tier.tierId}`}>
                  <td><span className="company-badge">{tier.company.toUpperCase()}</span></td>
                  <td><strong>{tier.name}</strong></td>
                  <td>{tier.turnaround}</td>
                  <td className="price">{tier.price}</td>
                  <td className="description">{tier.description}</td>
                  <td>{tier.order || 0}</td>
                  <td className="actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(tier)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(tier.company, tier.tierId)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ServiceTierManager;
