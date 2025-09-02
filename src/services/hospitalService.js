const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Get authentication token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Create headers with authorization
const createHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Handle API response
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
};

// Hospital service functions
export const hospitalService = {
  // Get all hospitals
  getAllHospitals: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/hospitals`, {
        method: "GET",
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      throw error;
    }
  },

  // Get specific hospital by ID
  getHospitalById: async (hospitalId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/hospitals/${hospitalId}`, {
        method: "GET",
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching hospital:", error);
      throw error;
    }
  },

  // Get monitoring data for a hospital
  getHospitalMonitoring: async (hospitalId, limit = 1) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/hospitals/${hospitalId}/monitoring?limit=${limit}`,
        {
          method: "GET",
          headers: createHeaders(),
        }
      );
      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching monitoring data:", error);
      throw error;
    }
  },

  // Add new monitoring data for a hospital
  addMonitoringData: async (hospitalId, monitoringData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/hospitals/${hospitalId}/monitoring`,
        {
          method: "POST",
          headers: createHeaders(),
          body: JSON.stringify(monitoringData),
        }
      );
      return await handleResponse(response);
    } catch (error) {
      console.error("Error adding monitoring data:", error);
      throw error;
    }
  },

  // Get real-time monitoring data (polling)
  startMonitoringPolling: (hospitalId, callback, interval = 5000) => {
    const pollData = async () => {
      try {
        const response = await hospitalService.getHospitalMonitoring(
          hospitalId,
          1
        );
        if (response.status === "success" && response.data.length > 0) {
          callback(response.data[0]);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Initial call
    pollData();

    // Set up interval
    const intervalId = setInterval(pollData, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  },
};

export default hospitalService;
