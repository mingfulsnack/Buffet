import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  showLoadingToast,
  showValidationError,
} from '../utils/toast';
import './InvoicesPage.scss';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});

  // Modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    giamgia: '',
    phiphuthu: '',
    trangthai_thanhtoan: 'Chua thanh toan',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchInvoiceStats();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/invoices', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      if (data.success) {
        setInvoices(data.data);
      } else {
        setError(data.message || 'Lỗi khi lấy danh sách hóa đơn');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Lỗi khi lấy danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/invoices/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice stats');
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // const handleUpdatePaymentStatus = async (invoiceId, newStatus) => {
  //   if (
  //     !window.confirm(
  //       `Bạn có chắc chắn muốn đổi trạng thái thanh toán thành "${getStatusText(
  //         newStatus
  //       )}"?`
  //     )
  //   ) {
  //     return;
  //   }

  //   const updateOperation = async () => {
  //     const token = localStorage.getItem('token');
  //     const response = await fetch(
  //       `http://localhost:3000/api/invoices/${invoiceId}/payment-status`,
  //       {
  //         method: 'PATCH',
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({ trangthai_thanhtoan: newStatus }),
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error('Failed to update payment status');
  //     }

  //     const data = await response.json();
  //     if (data.success) {
  //       fetchInvoices();
  //       fetchInvoiceStats();
  //     } else {
  //       throw new Error(data.message || 'Lỗi khi cập nhật trạng thái');
  //     }
  //   };

  //   try {
  //     await showLoadingToast(updateOperation(), {
  //       pending: 'Đang cập nhật trạng thái thanh toán...',
  //       success: 'Cập nhật trạng thái thanh toán thành công!',
  //       error: 'Lỗi khi cập nhật trạng thái thanh toán',
  //     });
  //   } catch (error) {
  //     console.error('Error:', error);
  //     showValidationError(error);
  //   }
  // };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      giamgia: invoice.giamgia || '',
      phiphuthu: invoice.phiphuthu || '',
      trangthai_thanhtoan: invoice.trangthai_thanhtoan || 'Chua thanh toan',
    });
    setShowUpdateModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setInvoiceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitUpdate = async () => {
    setSubmitting(true);

    const updateOperation = async () => {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:3000/api/invoices/${editingInvoice.mahd}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            giamgia: invoiceForm.giamgia
              ? parseFloat(invoiceForm.giamgia)
              : null,
            phiphuthu: invoiceForm.phiphuthu
              ? parseFloat(invoiceForm.phiphuthu)
              : null,
            trangthai_thanhtoan: invoiceForm.trangthai_thanhtoan,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update invoice');
      }

      const data = await response.json();
      if (data.success) {
        setShowUpdateModal(false);
        fetchInvoices();
        fetchInvoiceStats();
      } else {
        throw new Error(data.message || 'Lỗi khi cập nhật hóa đơn');
      }
    };

    try {
      await showLoadingToast(updateOperation(), {
        pending: 'Đang cập nhật hóa đơn...',
        success: 'Cập nhật hóa đơn thành công!',
        error: 'Lỗi khi cập nhật hóa đơn',
      });
    } catch (error) {
      console.error('Error:', error);
      showValidationError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Da thanh toan':
        return 'Đã thanh toán';
      case 'Chua thanh toan':
        return 'Chưa thanh toán';
      case 'Da huy':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusClassName = (status) => {
    switch (status) {
      case 'Da thanh toan':
        return 'status-paid';
      case 'Chua thanh toan':
        return 'status-unpaid';
      case 'Da huy':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const calculateFinalAmount = (invoice) => {
    let finalAmount = invoice.tongtien || 0;
    if (invoice.giamgia) finalAmount -= invoice.giamgia;
    if (invoice.phiphuthu) finalAmount += invoice.phiphuthu;
    return Math.max(0, finalAmount);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="invoices-page">
      <div className="page-header">
        <h1>Quản lý hóa đơn</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Tổng hóa đơn</h3>
            <p className="stat-number">{stats.total_invoices || 0}</p>
          </div>
          <div className="stat-card paid">
            <h3>Đã thanh toán</h3>
            <p className="stat-number">{stats.paid_count || 0}</p>
          </div>
          <div className="stat-card unpaid">
            <h3>Chưa thanh toán</h3>
            <p className="stat-number">{stats.unpaid_count || 0}</p>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="invoices-table-container">
        <table className="invoices-table">
          <thead>
            <tr>
              <th>Mã hóa đơn</th>
              <th>Mã đơn hàng</th>
              <th>Tổng tiền gốc</th>
              <th>Giảm giá</th>
              <th>Phí phụ thu</th>
              <th>Thành tiền</th>
              <th>Trạng thái thanh toán</th>
              <th>Ngày lập</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center">
                  Chưa có hóa đơn nào
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.mahd}>
                  <td className="invoice-id">{invoice.mahd}</td>
                  <td>{invoice.madon || '-'}</td>
                  <td>{formatCurrency(invoice.tongtien)}</td>
                  <td>
                    {invoice.giamgia ? formatCurrency(invoice.giamgia) : '-'}
                  </td>
                  <td>
                    {invoice.phiphuthu
                      ? formatCurrency(invoice.phiphuthu)
                      : '-'}
                  </td>
                  <td className="final-amount">
                    {formatCurrency(calculateFinalAmount(invoice))}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${getStatusClassName(
                        invoice.trangthai_thanhtoan
                      )}`}
                    >
                      {getStatusText(invoice.trangthai_thanhtoan)}
                    </span>
                  </td>
                  <td>{formatDate(invoice.ngaylap)}</td>
                  <td>
                    <div className="action-buttons">
                      <Button
                        variant="edit"
                        onClick={() => handleEditInvoice(invoice)}
                        title="Chỉnh sửa"
                      >
                        Sửa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Update Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Chỉnh sửa hóa đơn"
        size="medium"
      >
        <div className="invoice-form">
          <div className="form-group">
            <label htmlFor="giamgia">Giảm giá (VNĐ)</label>
            <input
              type="number"
              id="giamgia"
              name="giamgia"
              value={invoiceForm.giamgia}
              onChange={handleFormChange}
              placeholder="Nhập số tiền giảm giá"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phiphuthu">Phí phụ thu (VNĐ)</label>
            <input
              type="number"
              id="phiphuthu"
              name="phiphuthu"
              value={invoiceForm.phiphuthu}
              onChange={handleFormChange}
              placeholder="Nhập phí phụ thu"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="trangthai_thanhtoan">Trạng thái thanh toán</label>
            <select
              id="trangthai_thanhtoan"
              name="trangthai_thanhtoan"
              value={invoiceForm.trangthai_thanhtoan}
              onChange={handleFormChange}
            >
              <option value="Chua thanh toan">Chưa thanh toán</option>
              <option value="Da thanh toan">Đã thanh toán</option>
              <option value="Da huy">Đã hủy</option>
            </select>
          </div>

          {editingInvoice && (
            <div className="amount-preview">
              <p>
                <strong>Tổng tiền gốc:</strong>{' '}
                {formatCurrency(editingInvoice.tongtien)}
              </p>
              <p>
                <strong>Giảm giá:</strong> -
                {formatCurrency(invoiceForm.giamgia || 0)}
              </p>
              <p>
                <strong>Phí phụ thu:</strong> +
                {formatCurrency(invoiceForm.phiphuthu || 0)}
              </p>
              <hr />
              <p className="final-total">
                <strong>Thành tiền:</strong>{' '}
                {formatCurrency(
                  Math.max(
                    0,
                    (editingInvoice.tongtien || 0) -
                      (parseFloat(invoiceForm.giamgia) || 0) +
                      (parseFloat(invoiceForm.phiphuthu) || 0)
                  )
                )}
              </p>
            </div>
          )}

          <div className="modal-actions">
            <Button
              variant="cancel"
              onClick={() => setShowUpdateModal(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              variant="save"
              onClick={handleSubmitUpdate}
              disabled={submitting}
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InvoicesPage;
