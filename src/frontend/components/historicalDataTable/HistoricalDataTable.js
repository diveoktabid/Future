import React from 'react';
import { formatTableDateTime } from '../header/Header';
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
      <h3>Riwayat Data - {selectedHospital.hospital_name}</h3>

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
