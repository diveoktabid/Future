import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import hospitalManagementService from '../services/hospitalManagementService';

// Custom hook for Hospital Management logic
export const useHospitalManagement = () => {
  // State management
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: ''
  });

  // Modal states
  const [modals, setModals] = useState({
    showAdd: false,
    showEdit: false,
    showDelete: false,
    showEditConfirm: false
  });

  // Fetch hospitals data
  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const hospitalsData = await hospitalManagementService.getHospitals();
      setHospitals(hospitalsData);
    } catch (error) {
      toast.error(error.message);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  // Load hospitals on mount
  useEffect(() => {
    fetchHospitals();
  }, []);

  // Form utilities
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      description: ''
    });
  };

  // Modal utilities
  const openModal = (modalName, hospital = null) => {
    if (hospital) {
      setSelectedHospital(hospital);
      if (modalName === 'showEdit') {
        setFormData({
          name: hospital.name || '',
          address: hospital.address || '',
          phone: hospital.phone || '',
          email: hospital.email || '',
          description: hospital.description || ''
        });
      }
    }
    
    setModals(prev => ({
      ...prev,
      [modalName]: true
    }));
  };

  const closeModals = () => {
    setModals({
      showAdd: false,
      showEdit: false,
      showDelete: false,
      showEditConfirm: false
    });
    setEditLoading(false);
    setSelectedHospital(null);
    resetForm();
  };

  // Hospital operations
  const handleAddHospital = async (e) => {
    e.preventDefault();
    try {
      const result = await hospitalManagementService.createHospital(formData);
      toast.success(result.message);
      closeModals();
      fetchHospitals();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditHospital = (e) => {
    e.preventDefault();
    setModals(prev => ({ ...prev, showEditConfirm: true }));
  };

  const confirmEditHospital = async () => {
    try {
      setEditLoading(true);
      const result = await hospitalManagementService.updateHospital(selectedHospital.id, formData);
      toast.success(result.message);
      closeModals();
      fetchHospitals();
    } catch (error) {
      toast.error(error.message);
      setModals(prev => ({ ...prev, showEditConfirm: false }));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteHospital = async () => {
    try {
      const result = await hospitalManagementService.deleteHospital(selectedHospital.id);
      toast.success(result.message);
      closeModals();
      fetchHospitals();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return {
    // State
    hospitals,
    loading,
    editLoading,
    selectedHospital,
    formData,
    modals,
    
    // Actions
    handleInputChange,
    resetForm,
    openModal,
    closeModals,
    handleAddHospital,
    handleEditHospital,
    confirmEditHospital,
    handleDeleteHospital,
    fetchHospitals
  };
};