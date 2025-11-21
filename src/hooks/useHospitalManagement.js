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
    description: '',
    installation_date: '',
    installation_time: ''
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

  // Debug: Monitor formData changes
  useEffect(() => {
    console.log('FormData changed:', formData);
  }, [formData]);

  // Form utilities
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed - ${name}:`, value);
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
      description: '',
      installation_date: '',
      installation_time: ''
    });
  };

  // Format date from MySQL to HTML date input format (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Format time from MySQL to HTML time input format (HH:MM)
  const formatTimeForInput = (timeString) => {
    if (!timeString) return '';
    try {
      // MySQL time format could be HH:MM:SS or already HH:MM
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
      }
      return '';
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Modal utilities
  const openModal = (modalName, hospital = null) => {
    if (hospital) {
      setSelectedHospital(hospital);
      if (modalName === 'showEdit') {
        console.log('Opening edit modal for hospital:', hospital);
        
        const formattedDate = formatDateForInput(hospital.installation_date);
        const formattedTime = formatTimeForInput(hospital.installation_time);
        
        console.log('Original installation_date:', hospital.installation_date);
        console.log('Formatted installation_date:', formattedDate);
        console.log('Original installation_time:', hospital.installation_time);
        console.log('Formatted installation_time:', formattedTime);
        
        setFormData({
          name: hospital.name || '',
          address: hospital.address || '',
          phone: hospital.phone || '',
          email: hospital.email || '',
          description: hospital.description || '',
          installation_date: formattedDate,
          installation_time: formattedTime
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
      // Prepare data to send
      const dataToSend = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        description: formData.description,
        installation_date: formData.installation_date,
        installation_time: formData.installation_time
      };
      
      console.log('Data hospital baru:', dataToSend); // Debug log
      
      const result = await hospitalManagementService.createHospital(dataToSend);
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
      
      console.log('=== CONFIRM EDIT HOSPITAL ===');
      console.log('Selected Hospital ID:', selectedHospital.id);
      console.log('Current formData state:', JSON.stringify(formData, null, 2));
      
      // Prepare data to send - explicitly send all fields including empty ones
      const dataToSend = {
        name: formData.name || '',
        address: formData.address || '',
        phone: formData.phone || '',
        email: formData.email || '',
        description: formData.description || '',
        installation_date: formData.installation_date || '',
        installation_time: formData.installation_time || ''
      };
      
      console.log('Data to send to API:', JSON.stringify(dataToSend, null, 2));
      console.log('installation_date value:', dataToSend.installation_date);
      console.log('installation_time value:', dataToSend.installation_time);
      console.log('============================');
      
      const result = await hospitalManagementService.updateHospital(selectedHospital.id, dataToSend);
      
      console.log('Update response:', result);
      
      toast.success(result.message);
      closeModals();
      await fetchHospitals(); // Wait for refresh
    } catch (error) {
      console.error('Update error:', error);
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