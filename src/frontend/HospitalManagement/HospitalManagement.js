import React from 'react';
import { useHospitalManagement } from '../../hooks/useHospitalManagement';
import './HospitalManagement.css';

const HospitalManagement = () => {
  const {
    // State
    hospitals,
    loading,
    editLoading,
    selectedHospital,
    formData,
    modals,
    
    // Actions
    handleInputChange,
    openModal,
    closeModals,
    handleAddHospital,
    handleEditHospital,
    confirmEditHospital,
    handleDeleteHospital
  } = useHospitalManagement();

  return (
    <div className="hospital-management">
      <div className="hospital-management-header">
        <h1>Manajemen Rumah Sakit</h1>
        <button 
          className="add-hospital-btn"
          onClick={() => openModal('showAdd')}
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
                      <span className={`status-badge ${hospital.iot_status === 'Nyala' ? 'active' : 'inactive'}`}>
                        {hospital.iot_status === 'Nyala' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="hospital-actions">
                      <button
                        className="edit-btn"
                        onClick={() => openModal('showEdit', hospital)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => openModal('showDelete', hospital)}
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
      {modals.showAdd && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content modal-entering" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Rumah Sakit Baru</h2>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleAddHospital} className="hospital-form">
              <div className="form-group">
                <label htmlFor="name" className="form-field-required">Nama Rumah Sakit</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Masukkan nama rumah sakit"
                />
              </div>
              <div className="form-group">
                <label htmlFor="address" className="form-field-required">Alamat</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Masukkan alamat lengkap"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone" className="form-field-required">Telepon</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
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
      {modals.showEdit && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content modal-entering" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Rumah Sakit</h2>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleEditHospital} className="hospital-form">
              <div className="form-group">
                <label htmlFor="edit-name" className="form-field-required">Nama Rumah Sakit</label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Masukkan nama rumah sakit"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-address" className="form-field-required">Alamat</label>
                <textarea
                  id="edit-address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Masukkan alamat lengkap"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-phone" className="form-field-required">Telepon</label>
                  <input
                    type="tel"
                    id="edit-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
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
      {modals.showDelete && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content delete-modal modal-entering" onClick={(e) => e.stopPropagation()}>
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

      {/* Edit Confirmation Modal */}
      {modals.showEditConfirm && (
        <div className="modal-overlay" onClick={() => closeModals()}>
          <div className="modal-content modal-entering" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Konfirmasi Perubahan</h2>
              <button className="close-btn" onClick={() => closeModals()}>×</button>
            </div>
            <div className="delete-content">
              <div className="warning-icon">💾</div>
              <p>
                Apakah Anda yakin ingin menyimpan perubahan untuk rumah sakit{' '}
                <strong>{selectedHospital?.name}</strong>?
              </p>
              <p className="warning-text">
                Data yang telah diubah akan tersimpan secara permanen.
              </p>
            </div>
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => closeModals()}
                disabled={editLoading}
              >
                Batal
              </button>
              <button 
                type="button" 
                className="submit-btn" 
                onClick={confirmEditHospital}
                disabled={editLoading}
              >
                {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagement;
