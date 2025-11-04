import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import api from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import './ReportsPage.scss';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ReportsPage = () => {
  const [reportType, setReportType] = useState('daily');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0], // 7 ngày trước
    endDate: new Date().toISOString().split('T')[0],
  });
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearRange, setYearRange] = useState({
    startYear: new Date().getFullYear() - 9, // 10 năm trước
    endYear: new Date().getFullYear(),
  });

  const [loading, setLoading] = useState(false);
  const [revenueData, setRevenueData] = useState([]);
  const [overallStats, setOverallStats] = useState(null);
  const [topRevenueDays, setTopRevenueDays] = useState([]);
  const [paymentStats, setPaymentStats] = useState([]);

  // Report generation modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportType: 'table-performance',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let revenueResponse;

        switch (reportType) {
          case 'daily':
            revenueResponse = await api.get('/reports/revenue/daily', {
              params: dateRange,
            });
            break;
          case 'monthly':
            revenueResponse = await api.get('/reports/revenue/monthly', {
              params: { year },
            });
            break;
          case 'yearly':
            revenueResponse = await api.get('/reports/revenue/yearly', {
              params: yearRange,
            });
            break;
          default:
            break;
        }

        if (revenueResponse?.data?.success) {
          setRevenueData(revenueResponse.data.data);
        }

        // Load overall stats
        const statsResponse = await api.get('/reports/stats/overall', {
          params: dateRange,
        });
        if (statsResponse?.data?.success) {
          setOverallStats(statsResponse.data.data);
        }

        // Load top revenue days
        const topDaysResponse = await api.get(
          '/reports/stats/top-revenue-days',
          {
            params: { ...dateRange, limit: 5 },
          }
        );
        if (topDaysResponse?.data?.success) {
          setTopRevenueDays(topDaysResponse.data.data);
        }

        // Load payment status stats
        const paymentResponse = await api.get('/reports/stats/payment-status', {
          params: dateRange,
        });
        if (paymentResponse?.data?.success) {
          setPaymentStats(paymentResponse.data.data);
        }
      } catch (error) {
        console.error('Error loading report data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [reportType, dateRange, year, yearRange]);

  const getChartData = () => {
    if (!revenueData) return null;

    let labels, dataValues;

    switch (reportType) {
      case 'daily': {
        // Tạo đầy đủ tất cả ngày trong khoảng thời gian
        labels = [];
        dataValues = [];
        const dailyDataMap = {};

        // Map dữ liệu thực tế
        // Some responses (when quickly switching report types) may contain
        // items without a `date` field (e.g. monthly/yearly payloads). Skip
        // any item that doesn't have a usable date to avoid runtime errors.
        revenueData.forEach((item) => {
          if (!item) return;

          // Accept a few possible date-like fields and normalize to yyyy-mm-dd
          const rawDate = item.date ?? item.day ?? item.date_key ?? null;
          if (!rawDate || typeof rawDate !== 'string') return;

          const dateKey = rawDate.split('T')[0]; // Lấy phần ngày yyyy-mm-dd

          // Accumulate in case there are multiple records for the same day
          const value = parseFloat(item.total_revenue) || 0;
          dailyDataMap[dateKey] = (dailyDataMap[dateKey] || 0) + value;
        });

        // Tạo tất cả ngày từ startDate đến endDate
        const startDate = new Date(dateRange.startDate + 'T00:00:00');
        const endDate = new Date(dateRange.endDate + 'T00:00:00');
        const daysDiff =
          Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateKey = currentDate.toISOString().split('T')[0];
          let displayDate;

          // Nếu khoảng thời gian <= 7 ngày, hiển thị dd/mm
          // Nếu > 7 ngày và <= 31 ngày, hiển thị dd/mm
          // Nếu > 31 ngày, hiển thị dd/mm/yy
          if (daysDiff <= 31) {
            displayDate = `${currentDate
              .getDate()
              .toString()
              .padStart(2, '0')}/${(currentDate.getMonth() + 1)
              .toString()
              .padStart(2, '0')}`;
          } else {
            displayDate = `${currentDate
              .getDate()
              .toString()
              .padStart(2, '0')}/${(currentDate.getMonth() + 1)
              .toString()
              .padStart(2, '0')}/${currentDate
              .getFullYear()
              .toString()
              .slice(-2)}`;
          }

          labels.push(displayDate);
          dataValues.push(dailyDataMap[dateKey] || 0);

          // Chuyển sang ngày tiếp theo
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;
      }
      case 'monthly': {
        // Tạo đầy đủ 12 tháng
        labels = [];
        dataValues = [];
        const monthlyDataMap = {};

        // Map dữ liệu thực tế
        revenueData.forEach((item) => {
          monthlyDataMap[item.month] = parseFloat(item.total_revenue) || 0;
        });

        // Tạo đầy đủ 12 tháng
        for (let month = 1; month <= 12; month++) {
          labels.push(`Tháng ${month}`);
          dataValues.push(monthlyDataMap[month] || 0);
        }
        break;
      }
      case 'yearly': {
        // Tạo 10 năm, lấy từ startYear đến endYear
        labels = [];
        dataValues = [];
        const yearlyDataMap = {};

        // Map dữ liệu thực tế
        revenueData.forEach((item) => {
          yearlyDataMap[item.year] = parseFloat(item.total_revenue) || 0;
        });

        // Tạo dải năm từ startYear đến endYear
        const startYear = yearRange.startYear;
        const endYear = yearRange.endYear;
        for (let year = startYear; year <= endYear; year++) {
          labels.push(`Năm ${year}`);
          dataValues.push(yearlyDataMap[year] || 0);
        }
        break;
      }
      default:
        return null;
    }

    return {
      labels,
      datasets: [
        {
          label: 'Doanh thu (VNĐ)',
          data: dataValues,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
        },
      ],
    };
  };

  const getPaymentChartData = () => {
    if (!paymentStats || paymentStats.length === 0) return null;

    return {
      labels: paymentStats.map((item) =>
        item.payment_status === 'paid'
          ? 'Đã thanh toán'
          : item.payment_status === 'pending'
          ? 'Chờ thanh toán'
          : 'Hủy'
      ),
      datasets: [
        {
          data: paymentStats.map((item) => parseInt(item.count)),
          backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
        },
      ],
    };
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Tạo date với timezone local để tránh offset
    const dateParts = dateString.split('T')[0].split('-');
    const date = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2])
    );

    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Thống kê doanh thu',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return formatCurrency(value);
            },
          },
        },
        x: {
          ticks: {
            maxTicksLimit: reportType === 'daily' ? 15 : undefined, // Giới hạn số labels hiển thị cho daily
            maxRotation: reportType === 'daily' ? 45 : 0, // Xoay labels nếu là daily
          },
        },
      },
    };

    return baseOptions;
  };

  const handleReportFormChange = (e) => {
    const { name, value } = e.target;
    setReportForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);

    try {
      const token = localStorage.getItem('token');

      let url = '';
      let filename = '';

      switch (reportForm.reportType) {
        case 'table-performance':
          url = `http://localhost:3000/api/pdf/table-performance?startDate=${reportForm.startDate}&endDate=${reportForm.endDate}`;
          filename = `Table_Performance_Report_${reportForm.startDate}_${reportForm.endDate}.pdf`;
          break;
        // Add more report types here in the future
        default:
          throw new Error('Loại báo cáo không được hỗ trợ');
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tạo báo cáo PDF');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      setShowReportModal(false);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Không thể tạo báo cáo: ' + error.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const chartOptions = getChartOptions();

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Thống kê trạng thái thanh toán',
      },
    },
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h2>Báo cáo thống kê doanh thu</h2>

        <div className="header-actions">
          <Button
            variant="primary"
            onClick={() => setShowReportModal(true)}
            style={{ marginLeft: 'auto' }}
          >
            Tạo báo cáo
          </Button>
        </div>

        <div className="report-filters">
          <div className="filter-group">
            <label>Loại báo cáo:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="daily">Theo ngày</option>
              <option value="monthly">Theo tháng</option>
              <option value="yearly">Theo năm</option>
            </select>
          </div>

          {reportType === 'daily' && (
            <>
              <div className="filter-group">
                <label>Từ ngày:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      startDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="filter-group">
                <label>Đến ngày:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>
            </>
          )}

          {reportType === 'monthly' && (
            <div className="filter-group">
              <label>Năm:</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min="2015"
                max="2035"
              />
            </div>
          )}

          {reportType === 'yearly' && (
            <>
              <div className="filter-group">
                <label>Từ năm:</label>
                <input
                  type="number"
                  value={yearRange.startYear}
                  onChange={(e) =>
                    setYearRange({
                      ...yearRange,
                      startYear: parseInt(e.target.value),
                    })
                  }
                  min="2015"
                  max="2035"
                />
              </div>
              <div className="filter-group">
                <label>Đến năm:</label>
                <input
                  type="number"
                  value={yearRange.endYear}
                  onChange={(e) =>
                    setYearRange({
                      ...yearRange,
                      endYear: parseInt(e.target.value),
                    })
                  }
                  min="2015"
                  max="2035"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">Đang tải dữ liệu...</div>
      ) : (
        <div className="reports-content">
          {/* Thống kê tổng quan */}
          {overallStats && (
            <div className="stats-cards">
              <div className="stat-card">
                <h4>Tổng doanh thu</h4>
                <p className="stat-value revenue">
                  {formatCurrency(parseFloat(overallStats.total_revenue) || 0)}
                </p>
              </div>
              <div className="stat-card">
                <h4>Số hóa đơn</h4>
                <p className="stat-value count">
                  {overallStats.total_invoices || 0}
                </p>
              </div>
              {/* <div className="stat-card">
                <h4>Doanh thu trung bình</h4>
                <p className="stat-value average">
                  {formatCurrency(
                    parseFloat(overallStats.average_revenue) || 0
                  )}
                </p>
              </div> */}
            </div>
          )}

          {/* Biểu đồ doanh thu */}
          <div className="chart-container">
            {getChartData() &&
              (reportType === 'daily' ? (
                <Line data={getChartData()} options={chartOptions} />
              ) : (
                <Bar data={getChartData()} options={chartOptions} />
              ))}
          </div>

          <div className="secondary-charts">
            {/* Top ngày có doanh thu cao */}
            {topRevenueDays && topRevenueDays.length > 0 && (
              <div className="top-revenue-days">
                <h3>Top 5 ngày doanh thu cao nhất</h3>
                <div className="revenue-list">
                  {topRevenueDays.map((day, index) => (
                    <div key={index} className="revenue-item">
                      <span className="date">{formatDate(day.date)}</span>
                      <span className="revenue">
                        {formatCurrency(parseFloat(day.total_revenue) || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Biểu đồ trạng thái thanh toán */}
            {getPaymentChartData() && (
              <div className="payment-chart">
                <Pie data={getPaymentChartData()} options={pieChartOptions} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Generation Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Tạo báo cáo"
        size="medium"
      >
        <div className="report-form">
          <div className="form-group">
            <label htmlFor="reportType">Loại báo cáo:</label>
            <select
              id="reportType"
              name="reportType"
              value={reportForm.reportType}
              onChange={handleReportFormChange}
            >
              <option value="table-performance">Báo cáo hiệu suất bàn</option>
              {/* Add more report types here in the future */}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="startDate">Từ ngày:</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={reportForm.startDate}
              onChange={handleReportFormChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">Đến ngày:</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={reportForm.endDate}
              onChange={handleReportFormChange}
            />
          </div>

          <div className="modal-actions">
            <Button
              variant="cancel"
              onClick={() => setShowReportModal(false)}
              disabled={generatingReport}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerateReport}
              disabled={generatingReport}
            >
              {generatingReport ? 'Đang tạo...' : 'Tạo báo cáo'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReportsPage;
