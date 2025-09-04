import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import './HospitalManagement.css';

const HospitalManagement = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    capacity: '',
    description: ''
  });

  // Fetch hospitals data
  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/hospitals?limit=100&page=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data && result.data.hospitals) {
          // Transform data to match component expectations
          const transformedHospitals = result.data.hospitals.map(hospital => ({
            id: hospital.hospital_id,
            name: hospital.hospital_name,
            address: hospital.address || '',
            phone: hospital.phone || '',
            email: hospital.email || '',
            capacity: hospital.capacity || '',
            description: hospital.description || '',
            iot_status: hospital.iot_status,
            is_active: hospital.is_active,
            created_at: hospital.created_at,
            updated_at: hospital.updated_at
          }));
          setHospitals(transformedHospitals);
        } else {
          setHospitals([]);
        }
      } else {
        throw new Error('Gagal memuat data rumah sakit');
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Gagal memuat data rumah sakit');
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      capacity: '',
      description: ''
    });
  };

  // Handle add hospital
  const handleAddHospital = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/hospitals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Rumah sakit berhasil ditambahkan');
        setShowAddModal(false);
        resetForm();
        fetchHospitals();
      } else {
        throw new Error(result.error || 'Gagal menambahkan rumah sakit');
      }
    } catch (error) {
      console.error('Error adding hospital:', error);
      toast.error(error.message || 'Gagal menambahkan rumah sakit');
    }
  };

  // Handle edit hospital
  const handleEditHospital = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/hospitals/${selectedHospital.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Rumah sakit berhasil diperbarui');
        setShowEditModal(false);
        setSelectedHospital(null);
        resetForm();
        fetchHospitals();
      } else {
        throw new Error(result.error || 'Gagal memperbarui rumah sakit');
      }
    } catch (error) {
      console.error('Error updating hospital:', error);
      toast.error(error.message || 'Gagal memperbarui rumah sakit');
    }
  };

  // Handle delete hospital
  const handleDeleteHospital = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/hospitals/${selectedHospital.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Rumah sakit berhasil dihapus');
        setShowDeleteModal(false);
        setSelectedHospital(null);
        fetchHospitals();
      } else {
        throw new Error(result.error || 'Gagal menghapus rumah sakit');
      }
    } catch (error) {
      console.error('Error deleting hospital:', error);
      toast.error(error.message || 'Gagal menghapus rumah sakit');
    }
  };

  // Open edit modal
  const openEditModal = (hospital) => {
    setSelectedHospital(hospital);
    setFormData({
      name: hospital.name || '',
      address: hospital.address || '',
      phone: hospital.phone || '',
      email: hospital.email || '',
      capacity: hospital.capacity || '',
      description: hospital.description || ''
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (hospital) => {
    setSelectedHospital(hospital);
    setShowDeleteModal(true);
  };

  // Close modals
  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedHospital(null);
    resetForm();
  };

  return (
    <div className="hospital-management">
      <div className="hospital-management-header">
        <h1>Manajemen Rumah Sakit</h1>
        <button 
          className="add-hospital-btn"
          onClick={() => setShowAddModal(true)}
        >
          <span className="add-icon">+</span>
          Tambah Rumah Sakit
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Memuat data rumah sakit...</p>
        </div>
      ) : (
        <div className="hospitals-table-container">
          <table className="hospitals-table">
            <thead>
              <tr>
                <th>Nama Rumah Sakit</th>
                <th>Alamat</th>
                <th>Telepon</th>
                <th>Email</th>
                <th>Status IoT</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    Tidak ada data rumah sakit
                  </td>
                </tr>
              ) : (
                hospitals.map((hospital) => (
                  <tr key={hospital.id}>
                    <td className="hospital-name">{hospital.name}</td>
                    <td className="hospital-address">{hospital.address || '-'}</td>
                    <td className="hospital-phone">{hospital.phone || '-'}</td>
                    <td className="hospital-email">{hospital.email || '-'}</td>
                    <td className="hospital-status">
                      <span className={`status-badge ${hospital.iot_status}`}>
                        {hospital.iot_status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="hospital-actions">
                      <button
                        className="edit-btn"
                        onClick={() => openEditModal(hospital)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => openDeleteModal(hospital)}
                        title="Hapus"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Hospital Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Rumah Sakit Baru</h2>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleAddHospital} className="hospital-form">
              <div className="form-group">
                <label htmlFor="name">Nama Rumah Sakit *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Masukkan nama rumah sakit"
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Alamat *</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="Masukkan alamat lengkap"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Telepon *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="Contoh: 021-123456"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@rumahsakit.com"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="capacity">Kapasitas Tempat Tidur</label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="Jumlah tempat tidur"
                  min="1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Deskripsi</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Deskripsi singkat tentang rumah sakit"
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeModals}>
                  Batal
                </button>
                <button type="submit" className="submit-btn">
                  Tambah Rumah Sakit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hospital Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Rumah Sakit</h2>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleEditHospital} className="hospital-form">
              <div className="form-group">
                <label htmlFor="edit-name">Nama Rumah Sakit *</label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Masukkan nama rumah sakit"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-address">Alamat *</label>
                <textarea
                  id="edit-address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="Masukkan alamat lengkap"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-phone">Telepon *</label>
                  <input
                    type="tel"
                    id="edit-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="Contoh: 021-123456"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-email">Email</label>
                  <input
                    type="email"
                    id="edit-email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@rumahsakit.com"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="edit-capacity">Kapasitas Tempat Tidur</label>
                <input
                  type="number"
                  id="edit-capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="Jumlah tempat tidur"
                  min="1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-description">Deskripsi</label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Deskripsi singkat tentang rumah sakit"
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeModals}>
                  Batal
                </button>
                <button type="submit" className="submit-btn">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Hospital Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Konfirmasi Hapus</h2>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <div className="delete-content">
              <div className="warning-icon">⚠️</div>
              <p>
                Apakah Anda yakin ingin menghapus rumah sakit{' '}
                <strong>{selectedHospital?.name}</strong>?
              </p>
              <p className="warning-text">
                Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.
              </p>
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={closeModals}>
                Batal
              </button>
              <button 
                type="button" 
                className="delete-confirm-btn" 
                onClick={handleDeleteHospital}
              >
                Hapus Rumah Sakit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagement;
