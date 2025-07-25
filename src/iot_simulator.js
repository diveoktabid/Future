/**
 * IoT SIMULATOR UNTUK 6 RUMAH SAKIT
 * 
 * Sesuai permintaan dosen:
 * - 6 rumah sakit mengirim data secara bergantian
 * - Data masuk lewat API real-time (bukan migrate)
 * - Real-time update di web
 * - Hanya 1 data terbaru per hospital
 * 
 * Cara run: node iot_simulator.js
 */

const axios = require('axios');
const readline = require('readline');

// ===========================================
// CONFIGURATION
// ===========================================

const CONFIG = {
  API_BASE_URL: process.env.API_URL || 'http://localhost:5000/api',
  MONITORING_ENDPOINT: '/monitoring/submit',
  INTERVAL_SECONDS: 10,  // Interval antar pengiriman (detik)
  AUTO_MODE: true,       // Mode otomatis atau manual
  TOTAL_HOSPITALS: 6     // Jumlah rumah sakit
};

// Data 6 rumah sakit sesuai database existing
const HOSPITALS = [
  { id: 1, name: 'RS Siloam Kebon Jeruk', location: 'Jakarta Barat', tempRange: [22, 26] },
  { id: 2, name: 'RS Fatmawati', location: 'Jakarta Selatan', tempRange: [23, 27] },
  { id: 3, name: 'RS Pondok Indah', location: 'Jakarta Selatan', tempRange: [21, 25] },
  { id: 4, name: 'RSUD Tangerang', location: 'Tangerang', tempRange: [24, 28] },
  { id: 5, name: 'RS Premier Jatinegara', location: 'Jakarta Timur', tempRange: [22, 26] },
  { id: 6, name: 'RS Hermina Kemayoran', location: 'Jakarta Pusat', tempRange: [23, 27] }
];

// ===========================================
// LOGGER UTILITY
// ===========================================

class Logger {
  static getTimestamp() {
    return new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  static log(level, message, data = null) {
    const timestamp = this.getTimestamp();
    const colors = {
      debug: '\x1b[36m',   // Cyan
      info: '\x1b[32m',    // Green
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      success: '\x1b[92m', // Bright Green
      reset: '\x1b[0m'     // Reset
    };

    console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  static debug(message, data) { this.log('debug', `🔍 ${message}`, data); }
  static info(message, data) { this.log('info', `ℹ️  ${message}`, data); }
  static warn(message, data) { this.log('warn', `⚠️  ${message}`, data); }
  static error(message, data) { this.log('error', `❌ ${message}`, data); }
  static success(message, data) { this.log('success', `✅ ${message}`, data); }
}

// ===========================================
// DATA GENERATOR
// ===========================================

class DataGenerator {
  static generateTemperature(hospitalId) {
    const hospital = HOSPITALS.find(h => h.id === hospitalId);
    const [min, max] = hospital.tempRange;
    return parseFloat((Math.random() * (max - min) + min).toFixed(1));
  }

  static generateHumidity() {
    // Kelembaban ruangan normal: 45-75%
    return parseFloat((Math.random() * 30 + 45).toFixed(1));
  }

  static generateGasStatus() {
    // Distribusi realistis: 75% Low, 20% Medium, 5% High
    const rand = Math.random();
    if (rand < 0.75) return 'Low';
    if (rand < 0.95) return 'Medium';
    return 'High';
  }

  static generateDeviceStatus() {
    // 85% peluang ON untuk simulasi rumah sakit aktif
    return Math.random() > 0.15 ? 'ON' : 'OFF';
  }

  static generateRealisticData(hospitalId) {
    const hospital = HOSPITALS.find(h => h.id === hospitalId);
    
    return {
      hospital_id: hospitalId,
      temperature: this.generateTemperature(hospitalId),
      humidity: this.generateHumidity(),
      gas_status: this.generateGasStatus(),
      status_lampu1: this.generateDeviceStatus(),
      status_viewer: this.generateDeviceStatus(),
      status_writing_table: this.generateDeviceStatus(),
      status_lampu2: this.generateDeviceStatus(),
      status_lampu_op: this.generateDeviceStatus(),
      _metadata: {
        hospital_name: hospital.name,
        location: hospital.location,
        simulation_time: new Date().toISOString()
      }
    };
  }
}

// ===========================================
// API CLIENT
// ===========================================

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.axios = axios.create({
      baseURL: baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Bartech-IoT-Simulator/1.0'
      }
    });

    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        Logger.debug(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        Logger.error('Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor  
    this.axios.interceptors.response.use(
      (response) => {
        Logger.debug(`✅ API Response: ${response.status} - ${response.statusText}`);
        return response;
      },
      (error) => {
        Logger.error(`❌ API Error: ${error.response?.status || 'Network Error'}`, {
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  async testConnection() {
    try {
      const response = await this.axios.get('/monitoring/test');
      Logger.success('API Connection Test Successful', {
        status: response.data.status,
        message: response.data.data?.message
      });
      return true;
    } catch (error) {
      Logger.error('API Connection Test Failed', error.message);
      return false;
    }
  }

  async submitMonitoringData(data) {
    try {
      const response = await this.axios.post(CONFIG.MONITORING_ENDPOINT, data);
      
      if (response.data.status === 'success') {
        Logger.success(`Data submitted for ${data._metadata.hospital_name}`, {
          hospital_id: data.hospital_id,
          temperature: `${data.temperature}°C`,
          humidity: `${data.humidity}%`,
          gas_status: data.gas_status,
          devices_on: [
            data.status_lampu1 === 'ON' ? 'Lampu1' : null,
            data.status_viewer === 'ON' ? 'Viewer' : null,
            data.status_writing_table === 'ON' ? 'Table' : null,
            data.status_lampu2 === 'ON' ? 'Lampu2' : null,
            data.status_lampu_op === 'ON' ? 'LampuOP' : null
          ].filter(Boolean).join(', ') || 'None'
        });
        return response.data;
      } else {
        throw new Error(response.data.message || 'Submission failed');
      }
    } catch (error) {
      Logger.error(`Failed to submit data for Hospital ID ${data.hospital_id}`, error.message);
      throw error;
    }
  }

  async getHospitalStatus() {
    try {
      const response = await this.axios.get('/monitoring/hospitals/status');
      return response.data;
    } catch (error) {
      Logger.error('Failed to get hospital status', error.message);
      throw error;
    }
  }

  async getLatestData() {
    try {
      const response = await this.axios.get('/monitoring/latest');
      return response.data;
    } catch (error) {
      Logger.error('Failed to get latest data', error.message);
      throw error;
    }
  }
}

// ===========================================
// IOT SIMULATOR MAIN CLASS
// ===========================================

class IoTSimulator {
  constructor(config) {
    this.config = config;
    this.apiClient = new APIClient(config.API_BASE_URL);
    this.currentHospitalIndex = 0;
    this.isRunning = false;
    this.intervalId = null;
    this.statistics = {
      totalSubmissions: 0,
      successfulSubmissions: 0,
      failedSubmissions: 0,
      startTime: null,
      lastSubmissionTime: null,
      hospitalStats: {}
    };

    // Initialize hospital stats
    HOSPITALS.forEach(hospital => {
      this.statistics.hospitalStats[hospital.id] = {
        name: hospital.name,
        submissions: 0,
        lastUpdate: null
      };
    });
  }

  async initialize() {
    console.log('\n' + '='.repeat(60));
    console.log('🏥 BARTECH IoT SIMULATOR UNTUK 6 RUMAH SAKIT');
    console.log('='.repeat(60));
    Logger.info('Initializing IoT Simulator...');
    
    Logger.info('Configuration:', {
      API_URL: this.config.API_BASE_URL,
      INTERVAL: `${this.config.INTERVAL_SECONDS} seconds`,
      HOSPITALS: this.config.TOTAL_HOSPITALS,
      ENDPOINT: this.config.MONITORING_ENDPOINT
    });

    // Test API connection
    const connectionOK = await this.apiClient.testConnection();
    if (!connectionOK) {
      throw new Error('❌ API connection failed. Please ensure backend server is running on port 5000.');
    }

    // Get current hospital status
    try {
      const statusResponse = await this.apiClient.getHospitalStatus();
      Logger.info('Current Hospital Status:');
      statusResponse.data.forEach(hospital => {
        const status = hospital.connection_status || 'Unknown';
        const lastData = hospital.last_data_received 
          ? new Date(hospital.last_data_received).toLocaleString('id-ID')
          : 'Never';
        
        console.log(`   • ${hospital.hospital_name}: ${status} (Last: ${lastData})`);
      });
    } catch (error) {
      Logger.warn('Could not retrieve hospital status - will continue anyway');
    }

    Logger.success('IoT Simulator initialized successfully!');
    console.log('='.repeat(60) + '\n');
  }

  async sendDataForHospital(hospitalId) {
    try {
      this.statistics.totalSubmissions++;
      
      const data = DataGenerator.generateRealisticData(hospitalId);
      const hospital = HOSPITALS.find(h => h.id === hospitalId);
      
      Logger.info(`📤 [${this.statistics.totalSubmissions}] Sending data for ${hospital.name}...`);
      
      const response = await this.apiClient.submitMonitoringData(data);
      
      // Update statistics
      this.statistics.successfulSubmissions++;
      this.statistics.lastSubmissionTime = new Date();
      this.statistics.hospitalStats[hospitalId].submissions++;
      this.statistics.hospitalStats[hospitalId].lastUpdate = new Date();
      
      Logger.success(`Data sent successfully for ${hospital.name}`);
      
      return response;
    } catch (error) {
      this.statistics.failedSubmissions++;
      Logger.error(`Failed to send data for Hospital ID ${hospitalId}`, error.message);
      throw error;
    }
  }

  async sendNextHospitalData() {
    const hospitalId = this.currentHospitalIndex + 1; // Hospital ID mulai dari 1
    
    try {
      await this.sendDataForHospital(hospitalId);
    } catch (error) {
      // Continue with next hospital even if current fails
    }
    
    // Move to next hospital (circular - sesuai permintaan dosen)
    this.currentHospitalIndex = (this.currentHospitalIndex + 1) % this.config.TOTAL_HOSPITALS;
    
    // Show progress setelah satu putaran lengkap
    if (this.currentHospitalIndex === 0) {
      this.showStatistics();
      Logger.info('🔄 One complete round finished, starting next round...\n');
    }
  }

  start() {
    if (this.isRunning) {
      Logger.warn('Simulator is already running');
      return;
    }

    this.isRunning = true;
    this.statistics.startTime = new Date();
    
    console.log('\n' + '='.repeat(60));
    Logger.success('🎯 STARTING IoT DATA SIMULATION');
    console.log('='.repeat(60));
    Logger.info(`⏰ Sending data every ${this.config.INTERVAL_SECONDS} seconds per hospital`);
    Logger.info(`🏥 Hospital rotation order:`);
    HOSPITALS.forEach((hospital, index) => {
      console.log(`   ${index + 1}. ${hospital.name} (${hospital.location})`);
    });
    console.log('\n⚡ Real-time updates will be sent to web dashboard');
    console.log('📊 Press Ctrl+C to stop simulation\n');

    // Send first data immediately
    this.sendNextHospitalData();

    // Schedule subsequent transmissions (SESUAI PERMINTAAN DOSEN)
    this.intervalId = setInterval(() => {
      this.sendNextHospitalData();
    }, this.config.INTERVAL_SECONDS * 1000);
  }

  stop() {
    if (!this.isRunning) {
      Logger.warn('Simulator is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    Logger.info('🛑 IoT Simulator stopped');
    this.showFinalStatistics();
  }

  showStatistics() {
    const runtime = this.statistics.startTime 
      ? Math.floor((new Date() - this.statistics.startTime) / 1000)
      : 0;
    
    const successRate = this.statistics.totalSubmissions > 0 
      ? ((this.statistics.successfulSubmissions / this.statistics.totalSubmissions) * 100).toFixed(1)
      : 0;

    console.log('\n📊 CURRENT STATISTICS:');
    console.log(`   • Total Submissions: ${this.statistics.totalSubmissions}`);
    console.log(`   • Successful: ${this.statistics.successfulSubmissions}`);
    console.log(`   • Failed: ${this.statistics.failedSubmissions}`);
    console.log(`   • Success Rate: ${successRate}%`);
    console.log(`   • Runtime: ${runtime} seconds`);
    console.log(`   • Last Submission: ${this.statistics.lastSubmissionTime 
      ? this.statistics.lastSubmissionTime.toLocaleTimeString('id-ID')
      : 'None'}`);
  }

  showFinalStatistics() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 FINAL SIMULATION REPORT');
    console.log('='.repeat(60));
    
    this.showStatistics();
    
    console.log('\n🏥 Per Hospital Statistics:');
    Object.values(this.statistics.hospitalStats).forEach(stat => {
      console.log(`   • ${stat.name}: ${stat.submissions} submissions`);
    });
    
    if (this.statistics.successfulSubmissions > 0) {
      Logger.success('\n✅ Simulation completed successfully!');
      Logger.info('Data should be visible in real-time on your web dashboard');
    } else {
      Logger.error('\n❌ No successful data submissions during simulation');
    }
    console.log('='.repeat(60));
  }

  // Manual mode methods
  async sendManualData(hospitalId) {
    if (!hospitalId || hospitalId < 1 || hospitalId > this.config.TOTAL_HOSPITALS) {
      throw new Error(`Invalid hospital ID. Must be between 1 and ${this.config.TOTAL_HOSPITALS}`);
    }

    return await this.sendDataForHospital(hospitalId);
  }

  async sendRoundRobin() {
    Logger.info('🔄 Sending data for all hospitals in sequence...');
    
    for (let i = 1; i <= this.config.TOTAL_HOSPITALS; i++) {
      try {
        await this.sendDataForHospital(i);
        // Small delay between hospitals
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        // Continue with next hospital
      }
    }
    
    Logger.success('Round robin complete');
    this.showStatistics();
  }
}

// ===========================================
// CLI INTERFACE
// ===========================================

class CLIInterface {
  constructor(simulator) {
    this.simulator = simulator;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  showMenu() {
    console.log('\n' + '='.repeat(50));
    console.log('🏥 BARTECH IoT SIMULATOR MENU');
    console.log('='.repeat(50));
    console.log('1. 🚀 Start Auto Mode (continuous - SESUAI PERMINTAAN DOSEN)');
    console.log('2. 🔄 Send Round Robin (all hospitals once)');
    console.log('3. 📤 Send Manual Data (specific hospital)');
    console.log('4. 📊 Show Statistics');
    console.log('5. 🔍 Test API Connection');
    console.log('6. 🏥 Show Hospital List');
    console.log('7. 📈 Show Current Status');
    console.log('8. 🚪 Exit');
    console.log('='.repeat(50));
  }

  async promptMenu() {
    return new Promise((resolve) => {
      this.rl.question('Choose option (1-8): ', resolve);
    });
  }

  async promptHospitalId() {
    return new Promise((resolve) => {
      this.rl.question(`Enter Hospital ID (1-${CONFIG.TOTAL_HOSPITALS}): `, resolve);
    });
  }

  showHospitalList() {
    console.log('\n🏥 Available Hospitals:');
    HOSPITALS.forEach(hospital => {
      console.log(`   ${hospital.id}. ${hospital.name} (${hospital.location})`);
    });
  }

  async showCurrentStatus() {
    try {
      Logger.info('Fetching current hospital status...');
      const status = await this.simulator.apiClient.getHospitalStatus();
      
      console.log('\n📊 CURRENT HOSPITAL STATUS:');
      status.data.forEach(hospital => {
        const statusIcon = hospital.connection_status === 'Connected' ? '🟢' : 
                          hospital.connection_status === 'Disconnected' ? '🔴' : '🟡';
        console.log(`   ${statusIcon} ${hospital.hospital_name}: ${hospital.connection_status}`);
        if (hospital.last_data_received) {
          console.log(`      Last data: ${new Date(hospital.last_data_received).toLocaleString('id-ID')}`);
        }
      });
    } catch (error) {
      Logger.error('Failed to fetch hospital status', error.message);
    }
  }

  async run() {
    console.log('🚀 Bartech IoT Simulator CLI Interface');
    
    try {
      await this.simulator.initialize();
    } catch (error) {
      Logger.error('Failed to initialize simulator:', error.message);
      process.exit(1);
    }

    while (true) {
      this.showMenu();
      const choice = await this.promptMenu();

      try {
        switch (choice) {
          case '1':
            this.simulator.start();
            console.log('\n⏸️  Press Enter to stop simulation...');
            await this.promptMenu();
            this.simulator.stop();
            break;

          case '2':
            await this.simulator.sendRoundRobin();
            break;

          case '3':
            this.showHospitalList();
            const hospitalId = await this.promptHospitalId();
            await this.simulator.sendManualData(parseInt(hospitalId));
            break;

          case '4':
            this.simulator.showStatistics();
            break;

          case '5':
            await this.simulator.apiClient.testConnection();
            break;

          case '6':
            this.showHospitalList();
            break;

          case '7':
            await this.showCurrentStatus();
            break;

          case '8':
            Logger.info('👋 Goodbye!');
            process.exit(0);
            break;

          default:
            Logger.warn('Invalid option. Please choose 1-8.');
        }
      } catch (error) {
        Logger.error('Operation failed:', error.message);
      }

      console.log('\n⏳ Press Enter to continue...');
      await this.promptMenu();
    }
  }

  close() {
    this.rl.close();
  }
}

// ===========================================
// MAIN EXECUTION
// ===========================================

async function main() {
  // Handle process termination gracefully
  process.on('SIGINT', () => {
    Logger.info('\n🛑 Received interrupt signal, shutting down...');
    if (global.simulator) {
      global.simulator.stop();
    }
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    Logger.info('\n🛑 Received termination signal, shutting down...');
    if (global.simulator) {
      global.simulator.stop();
    }
    process.exit(0);
  });

  // Create simulator instance
  const simulator = new IoTSimulator(CONFIG);
  global.simulator = simulator; // Make available for signal handlers

  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--auto') || args.includes('-a')) {
    // Auto mode - start simulation immediately (SESUAI PERMINTAAN DOSEN)
    try {
      await simulator.initialize();
      simulator.start();
      
      Logger.info('🎯 AUTO MODE - Simulation running continuously');
      Logger.info('📱 Check your web dashboard for real-time updates');
      Logger.info('⏸️  Press Ctrl+C to stop');
      
      // Keep running until interrupted
      await new Promise(() => {}); // Infinite wait
    } catch (error) {
      Logger.error('Simulation failed:', error.message);
      process.exit(1);
    }
  } else {
    // Interactive CLI mode
    const cli = new CLIInterface(simulator);
    
    try {
      await cli.run();
    } catch (error) {
      Logger.error('CLI error:', error.message);
    } finally {
      cli.close();
    }
  }
}

// Export for testing
module.exports = {
  IoTSimulator,
  DataGenerator,
  APIClient,
  Logger,
  HOSPITALS,
  CONFIG
};

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    Logger.error('Fatal error:', error.message);
    process.exit(1);
  });
}