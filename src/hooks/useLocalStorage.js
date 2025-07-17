import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

// Custom hook untuk real-time hospital data dengan localStorage backup
export const useHospitalData = () => {
  const [hospitals, setHospitals] = useLocalStorage('hospitals', []);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simulate real-time updates (nanti akan diganti dengan MQTT)
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Simulate random status changes
      if (Math.random() < 0.3) { // 30% chance of update
        setHospitals(prev => 
          prev.map(hospital => ({
            ...hospital,
            lastUpdate: new Date().toISOString(),
            // Random status change dengan probabilitas rendah
            status: Math.random() < 0.1 ? getRandomStatus() : hospital.status
          }))
        );
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [setHospitals]);

  const updateHospitalStatus = (hospitalId, newStatus) => {
    setHospitals(prev => 
      prev.map(hospital => 
        hospital.id === hospitalId 
          ? { ...hospital, status: newStatus, lastUpdate: new Date().toISOString() }
          : hospital
      )
    );
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real app, this would be an API call
      // const response = await api.getHospitals();
      // setHospitals(response.data);
      
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hospitals,
    setHospitals,
    lastUpdate,
    isLoading,
    error,
    updateHospitalStatus,
    refreshData
  };
};

// Import helper function
const getRandomStatus = () => {
  const statuses = ['Nyala', 'Mati', 'Maintenance'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};