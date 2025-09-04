import React, { useEffect, useState } from 'react';
import { hospitalService } from '../../services/hospitalService';
import { formatTableDateTime } from '../components/header/Header';
import toast from 'react-hot-toast';
import './LogSistem.css';

const LogSistem = () => {
  const [monitoringData, setMonitoringData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const recordsPerPage = 10;

  // Fetch all monitoring data from monitoring_data table
  const fetchMonitoringData = async (page = 1) => {
    try {
      setLoading(true);
      
      // Get all monitoring data from monitoring_data table using the new endpoint
      const response = await hospitalService.getAllMonitoringHistory(page, recordsPerPage, "desc");
      
      if (response.status === "success") {
        const { history, pagination } = response.data;
        
        setMonitoringData(history || []);
        setTotalRecords(pagination?.totalRecords || 0);
        setTotalPages(pagination?.totalPages || 1);
        setCurrentPage(pagination?.currentPage || page);
        
      } else {
        toast.error("Gagal memuat data log sistem");
        setMonitoringData([]);
        setTotalRecords(0);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching monitoring data:", error);
      toast.error("Gagal memuat data log sistem");
      setMonitoringData([]);
      setTotalRecords(0);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchMonitoringData();
  }, []);

  // Handle page change with smooth transition
  const handlePageChange = async (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && !isTransitioning) {
      setIsTransitioning(true);
      
      // Add fade out effect
      const tableContainer = document.querySelector('.table-container');
      const tbody = document.querySelector('.log-table tbody');
      
      if (tableContainer && tbody) {
        tableContainer.classList.add('loading');
        tbody.classList.add('updating');
      }
      
      // Small delay for smooth visual transition
      await new Promise(resolve => setTimeout(resolve, 200));
      
      try {
        await fetchMonitoringData(newPage);
        
        // Add fade in effect after data loads
        setTimeout(() => {
          if (tableContainer && tbody) {
            tableContainer.classList.remove('loading');
            tableContainer.classList.add('fade-in');
            tbody.classList.remove('updating');
            
            // Remove fade-in class after animation
            setTimeout(() => {
              tableContainer.classList.remove('fade-in');
            }, 500);
          }
        }, 100);
        
      } catch (error) {
        console.error('Error changing page:', error);
      } finally {
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }
    }
  };

  // Get gas status badge class
  const getGasStatusClass = (status) => {
    if (!status) return "unknown";
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === "low") return "low";
    if (normalizedStatus === "medium") return "medium";
    if (normalizedStatus === "high") return "high";
    return "unknown";
  };

  // Get status badge class
  const getStatusClass = (status) => {
    if (!status) return "off";
    const normalizedStatus = status.toString().toLowerCase();
    return (normalizedStatus === "on" || normalizedStatus === "nyala") ? "on" : "off";
  };

  if (loading) {
    return (
      <div className="log-sistem-container">
        <h2>Log Sistem - Riwayat Data Monitoring Seluruh Rumah Sakit</h2>
        <div className="loading-container">
          <p>Memuat data log sistem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="log-sistem-container">
      <h2>Log Sistem - Riwayat Data Monitoring Seluruh Rumah Sakit</h2>

      {monitoringData.length === 0 ? (
        <div className="no-data-container">
          <p>Tidak ada data log sistem tersedia</p>
        </div>
      ) : (
        <>
          <div className={`table-container ${isTransitioning ? 'data-loading' : ''}`}>
            {isTransitioning && (
              <div className="page-transition-overlay">
                <div className="page-transition-spinner"></div>
              </div>
            )}
            <table className="log-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Rumah Sakit</th>
                  <th>Suhu (°C)</th>
                  <th>Kelembaban (%)</th>
                  <th>Status Gas</th>
                  <th>Lampu 1</th>
                  <th>Lampu 2</th>
                  <th>Lampu Operasi</th>
                  <th>Writing Table</th>
                  <th>Viewer</th>
                </tr>
              </thead>
              <tbody className={isTransitioning ? 'updating' : ''}>
                {monitoringData.map((data, index) => (
                  <tr key={`${data.monitoring_id || data.hospital_id}-${index}`}>
                    <td>
                      {formatTableDateTime(data.updated_at || data.created_at || data.timestamp)}
                    </td>
                    <td>{data.hospital_name || "N/A"}</td>
                    <td>{data.temperature || "N/A"}</td>
                    <td>{data.humidity || "N/A"}</td>
                    <td>
                      <span className={`gas-status-badge ${getGasStatusClass(data.gas_status)}`}>
                        {data.gas_status || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge-small ${getStatusClass(data.status_lampu1)}`}>
                        {data.status_lampu1 || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge-small ${getStatusClass(data.status_lampu2)}`}>
                        {data.status_lampu2 || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge-small ${getStatusClass(data.status_lampu_op)}`}>
                        {data.status_lampu_op || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge-small ${getStatusClass(data.status_writing_table)}`}>
                        {data.status_writing_table || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge-small ${getStatusClass(data.status_viewer)}`}>
                        {data.status_viewer || "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className={`pagination-btn ${isTransitioning ? 'pulse' : ''}`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isTransitioning}>
                ‹ Sebelumnya
              </button>

              <div className={`pagination-info ${isTransitioning ? 'pulse' : ''}`}>
                <span>
                  {isTransitioning ? 'Memuat...' : `Halaman ${currentPage} dari ${totalPages}`}
                </span>
              </div>

              <button
                className={`pagination-btn ${isTransitioning ? 'pulse' : ''}`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isTransitioning}>
                Selanjutnya ›
              </button>
            </div>
          )}

          <div className="table-info">
            <p>
              Menampilkan {monitoringData.length} dari {totalRecords} data dari seluruh rumah sakit
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default LogSistem;