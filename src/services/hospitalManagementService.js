// Hospital Management API Service
const API_BASE_URL = 'http://localhost:5000/api/hospital-management';

class HospitalManagementService {
  constructor() {
    this.apiCall = this.apiCall.bind(this);
  }

  // Generic API call utility
  async apiCall(url, options = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Terjadi kesalahan');
    }
    
    return result;
  }

  // Get all hospitals with transformation
  async getHospitals() {
    const result = await this.apiCall(`${API_BASE_URL}/hospitals?limit=100&page=1`);
    
    if (result.status === 'success') {
      return result.data.hospitals.map(hospital => ({
        id: hospital.hospital_id,
        name: hospital.hospital_name,
        address: hospital.address || '',
        phone: hospital.phone || '',
        email: hospital.email || '',
        capacity: hospital.capacity || '',
        description: hospital.description || '',
        installation_date: hospital.installation_date || '',
        installation_time: hospital.installation_time || '',
        iot_status: hospital.iot_status,
        is_active: hospital.is_active,
        created_at: hospital.created_at,
        updated_at: hospital.updated_at
      }));
    }
    
    return [];
  }

  // Create new hospital
  async createHospital(hospitalData) {
    console.log('Service - Creating hospital with data:', hospitalData);
    return await this.apiCall(`${API_BASE_URL}/hospitals`, {
      method: 'POST',
      body: JSON.stringify(hospitalData)
    });
  }

  // Update hospital
  async updateHospital(id, hospitalData) {
    console.log('=== SERVICE LAYER UPDATE ===');
    console.log('Hospital ID:', id);
    console.log('Data received:', hospitalData);
    console.log('Data stringified:', JSON.stringify(hospitalData));
    console.log('installation_date:', hospitalData.installation_date);
    console.log('installation_time:', hospitalData.installation_time);
    console.log('==========================');
    
    return await this.apiCall(`${API_BASE_URL}/hospitals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(hospitalData)
    });
  }

  // Delete hospital
  async deleteHospital(id) {
    return await this.apiCall(`${API_BASE_URL}/hospitals/${id}`, {
      method: 'DELETE'
    });
  }

  // Get hospital by ID
  async getHospitalById(id) {
    return await this.apiCall(`${API_BASE_URL}/hospitals/${id}`);
  }

  // Get hospital statistics
  async getHospitalStats() {
    return await this.apiCall(`${API_BASE_URL}/hospitals/stats`);
  }
}

// Export singleton instance
const hospitalManagementService = new HospitalManagementService();
export default hospitalManagementService;