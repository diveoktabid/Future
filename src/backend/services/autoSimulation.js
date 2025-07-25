// Auto-simulation for real-time testing
let simulationIntervals = new Map();

// Function to start auto-simulation for a hospital
function startAutoSimulation(hospital_id, intervalMs = 10000) {
  // Stop existing simulation if running
  stopAutoSimulation(hospital_id);
  
  console.log(`🔄 Starting auto-simulation for hospital ${hospital_id} (every ${intervalMs}ms)`);
  
  const simulateData = async () => {
    try {
      const fetch = require('node-fetch');
      const response = await fetch('http://localhost:5000/api/monitoring/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id })
      });
      
      if (response.ok) {
        console.log(`✅ Auto-simulated data for hospital ${hospital_id}`);
      }
    } catch (error) {
      console.error(`❌ Auto-simulation failed for hospital ${hospital_id}:`, error.message);
    }
  };
  
  // Start simulation immediately
  simulateData();
  
  // Set up interval
  const intervalId = setInterval(simulateData, intervalMs);
  simulationIntervals.set(hospital_id, intervalId);
  
  return intervalId;
}

// Function to stop auto-simulation for a hospital
function stopAutoSimulation(hospital_id) {
  const intervalId = simulationIntervals.get(hospital_id);
  if (intervalId) {
    clearInterval(intervalId);
    simulationIntervals.delete(hospital_id);
    console.log(`🛑 Stopped auto-simulation for hospital ${hospital_id}`);
    return true;
  }
  return false;
}

// Function to stop all simulations
function stopAllSimulations() {
  simulationIntervals.forEach((intervalId, hospital_id) => {
    clearInterval(intervalId);
    console.log(`🛑 Stopped auto-simulation for hospital ${hospital_id}`);
  });
  simulationIntervals.clear();
}

module.exports = {
  startAutoSimulation,
  stopAutoSimulation,
  stopAllSimulations,
  getActiveSimulations: () => Array.from(simulationIntervals.keys())
};
