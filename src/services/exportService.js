import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

class ExportService {
  /**
   * Format date for display in PDF
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Format status for display
   */
  formatStatus(status) {
    if (!status) return 'N/A';
    const normalizedStatus = status.toString().toLowerCase();
    if (normalizedStatus === 'on' || normalizedStatus === 'nyala') return 'NYALA';
    if (normalizedStatus === 'off' || normalizedStatus === 'mati') return 'MATI';
    return status.toUpperCase();
  }

  /**
   * Fetch monitoring data for export from backend
   */
  async fetchMonitoringDataForExport(hospitalId, startDate = null, endDate = null) {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      let url = `${API_BASE_URL}/monitoring/export/hospital/${hospitalId}`;
      const params = new URLSearchParams();
      
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('Fetching export data from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Export response status:', response.status);
      console.log('Export response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export response error text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error(`Expected JSON response but received: ${contentType}. Response: ${responseText.slice(0, 200)}`);
      }

      const data = await response.json();
      console.log('Export data received:', data);
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Failed to fetch data for export');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching monitoring data for export:', error);
      throw error;
    }
  }

  /**
   * Generate PDF from monitoring data
   */
  async exportMonitoringDataToPDF(hospitalId, startDate = null, endDate = null) {
    try {
      // Show loading indicator
      const loadingToast = toast.loading('Mengambil data untuk export...', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });

      // Fetch data from backend
      const exportData = await this.fetchMonitoringDataForExport(hospitalId, startDate, endDate);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      const { hospital, monitoring_data, total_records, export_date } = exportData;

      if (!monitoring_data || monitoring_data.length === 0) {
        toast.error('Tidak ada data untuk di-export', {
          style: {
            borderRadius: '10px',
            background: '#f87171',
            color: '#fff',
          },
        });
        return;
      }

      // Show generating PDF toast
      const generatingToast = toast.loading('Membuat file PDF...', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });

      // Dynamically import autoTable to ensure it's properly loaded
      const { default: autoTable } = await import('jspdf-autotable');

      // Create PDF document
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN DATA MONITORING IOT', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      
      // Add hospital info
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rumah Sakit: ${hospital.hospital_name}`, 20, 35);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tanggal Export: ${this.formatDate(export_date)}`, 20, 42);
      doc.text(`Total Record: ${total_records} data`, 20, 47);
      
      if (startDate || endDate) {
        let dateRange = 'Periode: ';
        if (startDate) dateRange += `${this.formatDate(startDate)}`;
        if (startDate && endDate) dateRange += ' - ';
        if (endDate) dateRange += `${this.formatDate(endDate)}`;
        doc.text(dateRange, 20, 52);
      }

      // Prepare table data
      const tableHeaders = [
        'No',
        'Waktu',
        'Suhu (°C)',
        'Kelembaban (%)',
        'Status Gas',
        'Lampu 1',
        'Lampu 2',
        'Lampu OP',
        'Writing Table',
        'Viewer'
      ];

      const tableData = monitoring_data.map((data, index) => [
        index + 1,
        this.formatDate(data.updated_at || data.created_at),
        data.temperature || 'N/A',
        data.humidity || 'N/A',
        data.gas_status || 'N/A',
        this.formatStatus(data.status_lampu1),
        this.formatStatus(data.status_lampu2),
        this.formatStatus(data.status_lampu_op),
        this.formatStatus(data.status_writing_table),
        this.formatStatus(data.status_viewer)
      ]);

      // Calculate table width and center position
      const tableWidth = 15 + 45 + 20 + 25 + 25 + 20 + 20 + 20 + 25 + 20; // 235mm total
      const pageWidth = doc.internal.pageSize.getWidth(); // ~297mm for A4 landscape
      const leftMargin = (pageWidth - tableWidth) / 2; // Center the table

      // Add table using the dynamically imported autoTable
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: startDate || endDate ? 60 : 55,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 }, // No
          1: { cellWidth: 45 }, // Waktu
          2: { halign: 'center', cellWidth: 20 }, // Suhu
          3: { halign: 'center', cellWidth: 25 }, // Kelembaban
          4: { halign: 'center', cellWidth: 25 }, // Status Gas
          5: { halign: 'center', cellWidth: 20 }, // Lampu 1
          6: { halign: 'center', cellWidth: 20 }, // Lampu 2
          7: { halign: 'center', cellWidth: 20 }, // Lampu OP
          8: { halign: 'center', cellWidth: 25 }, // Writing Table
          9: { halign: 'center', cellWidth: 20 }, // Viewer
        },
        margin: { top: 10, right: leftMargin, bottom: 10, left: leftMargin },
        didDrawPage: (data) => {
          // Add page number
          const pageCount = doc.internal.getNumberOfPages();
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          doc.setFontSize(8);
          doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`, 
            data.settings.margin.left, 
            pageHeight - 10
          );
          
          // Add timestamp on each page
          doc.text(`Digenerate pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 
            pageSize.width - 70, 
            pageHeight - 10
          );
        }
      });

      // Generate filename
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/[:.-]/g, '').replace('T', '_');
      const filename = `monitoring_data_${hospital.hospital_name.replace(/\s+/g, '_')}_${timestamp}.pdf`;

      // Dismiss generating toast
      toast.dismiss(generatingToast);

      // Save PDF
      doc.save(filename);

      // Show success message
      toast.success(`PDF berhasil didownload: ${filename}`, {
        duration: 4000,
        style: {
          borderRadius: '10px',
          background: '#10b981',
          color: '#fff',
        },
      });

      return filename;
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Show error message
      toast.error(`Gagal membuat PDF: ${error.message}`, {
        duration: 4000,
        style: {
          borderRadius: '10px',
          background: '#f87171',
          color: '#fff',
        },
      });
      
      throw error;
    }
  }

  /**
   * Export data with date range
   */
  async exportWithDateRange(hospitalId, startDate, endDate) {
    return this.exportMonitoringDataToPDF(hospitalId, startDate, endDate);
  }

  /**
   * Export all data (no date filter)
   */
  async exportAllData(hospitalId) {
    return this.exportMonitoringDataToPDF(hospitalId);
  }
}

// Create singleton instance
const exportService = new ExportService();

export default exportService;