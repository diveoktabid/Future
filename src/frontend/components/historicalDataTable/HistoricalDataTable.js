import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { formatTableDateTime } from '../header/Header';
import exportService from '../../../services/exportService';
import './HistoricalDataTable.css';

const HistoricalDataTable = ({ 
  historicalData, 
  loadingHistorical, 
  selectedHospital,
  currentPage,
  totalPages,
  recordsPerPage,
  onPageChange 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Get gas status badge class
  const getGasStatusClass = (status) => {
    if (!status || status === "N/A") return "unknown";
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === "low") return "low";
    if (normalizedStatus === "medium") return "medium";
    if (normalizedStatus === "high") return "high";
    return "unknown";
  };

  // Get status badge class
  const getStatusClass = (status) => {
    if (!status || status === "N/A") return "off";
    const normalizedStatus = status.toString().toLowerCase();
    return (normalizedStatus === "on" || normalizedStatus === "nyala") ? "on" : "off";
  };

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return historicalData.slice(startIndex, endIndex);
  };

  // Handle export to PDF
  const handleExportToPDF = async (dateRange = null) => {
    if (!selectedHospital?.hospital_id) {
      toast.error('Hospital ID tidak ditemukan', {
        style: {
          borderRadius: '10px',
          background: '#f87171',
          color: '#fff',
        },
      });
      return;
    }

    setIsExporting(true);
    setShowExportOptions(false);

    try {
      if (dateRange) {
        await exportService.exportWithDateRange(
          selectedHospital.hospital_id,
          dateRange.startDate,
          dateRange.endDate
        );
      } else {
        await exportService.exportAllData(selectedHospital.hospital_id);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle quick export (all data)
  const handleQuickExport = () => {
    handleExportToPDF();
  };

  // Toggle export options
  const toggleExportOptions = () => {
    setShowExportOptions(!showExportOptions);
  };

  if (loadingHistorical) {
    return (
      <div className="historical-data-section">
        <h3>Riwayat Data</h3>
        <div className="loading-table">
          <p>Memuat data riwayat...</p>
        </div>
      </div>
    );
  }

  if (historicalData.length === 0) {
    return (
      <div className="historical-data-section">
        <h3>Riwayat Data</h3>
        <div className="no-data-table">
          <p>Tidak ada data riwayat tersedia</p>
        </div>
      </div>
    );
  }

  const paginatedData = getPaginatedData();

  return (
    <div className="historical-data-section">
      <div className="historical-data-header">
        <h3>Riwayat Data - {selectedHospital.hospital_name}</h3>
        
        <div className="export-controls">
          <button
            className={`export-btn quick-export ${isExporting ? 'exporting' : ''}`}
            onClick={handleQuickExport}
            disabled={isExporting}
            title="Export semua data ke PDF">
            {isExporting ? (
              <>
                <span className="export-spinner"></span>
                Mengexport...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor"/>
                  <path d="M12 11L8 15H10V18H14V15H16L12 11Z" fill="currentColor"/>
                </svg>
                Export PDF
              </>
            )}
          </button>
          
          <div className="export-options-container">
            <button
              className="export-options-btn"
              onClick={toggleExportOptions}
              disabled={isExporting}
              title="Opsi export lainnya">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z" fill="currentColor"/>
              </svg>
            </button>
            
            {showExportOptions && (
              <div className="export-dropdown">
                <button
                  className="export-dropdown-item"
                  onClick={handleQuickExport}
                  disabled={isExporting}>
                  Export Semua Data
                </button>
                <button
                  className="export-dropdown-item"
                  onClick={() => {
                    // For now, export last 7 days
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(endDate.getDate() - 7);
                    handleExportToPDF({
                      startDate: startDate.toISOString(),
                      endDate: endDate.toISOString()
                    });
                  }}
                  disabled={isExporting}>
                  Export 7 Hari Terakhir
                </button>
                <button
                  className="export-dropdown-item"
                  onClick={() => {
                    // Export last 30 days
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(endDate.getDate() - 30);
                    handleExportToPDF({
                      startDate: startDate.toISOString(),
                      endDate: endDate.toISOString()
                    });
                  }}
                  disabled={isExporting}>
                  Export 30 Hari Terakhir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="historical-table">
          <thead>
            <tr>
              <th>Waktu</th>
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
          <tbody>
            {paginatedData.map((data, index) => (
              <tr key={index}>
                <td>
                  {formatTableDateTime(
                    data.updated_at || data.created_at || data.timestamp
                  )}
                </td>
                <td>{data.temperature || "N/A"}</td>
                <td>{data.humidity || "N/A"}</td>
                <td>
                  <span
                    className={`gas-status-badge ${getGasStatusClass(data.gas_status)}`}>
                    {data.gas_status || "N/A"}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-badge-small ${getStatusClass(data.status_lampu1)}`}>
                    {data.status_lampu1 || "N/A"}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-badge-small ${getStatusClass(data.status_lampu2)}`}>
                    {data.status_lampu2 || "N/A"}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-badge-small ${getStatusClass(data.status_lampu_op)}`}>
                    {data.status_lampu_op || "N/A"}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-badge-small ${getStatusClass(data.status_writing_table)}`}>
                    {data.status_writing_table || "N/A"}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-badge-small ${getStatusClass(data.status_viewer)}`}>
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
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}>
            ‹ Sebelumnya
          </button>

          <div className="pagination-info">
            <span>
              Halaman {currentPage} dari {totalPages}
            </span>
          </div>

          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}>
            Selanjutnya ›
          </button>
        </div>
      )}

      <div className="table-info">
        <p>
          Menampilkan {paginatedData.length} dari {historicalData.length} data
        </p>
      </div>
    </div>
  );
};

export default HistoricalDataTable;
