import { useState } from 'react';
import { FaTimes, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import { applyLeave } from '../services/api';

const LeaveForm = ({ onClose, onSuccess }) => {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({
        startDate: today,
        endDate: today,
        reason: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.reason.trim()) {
            setError('Please provide a reason for your leave request.');
            return;
        }
        if (form.endDate < form.startDate) {
            setError('End date cannot be before start date.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await applyLeave(form);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to apply for leave. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Apply for Leave</h2>
                    <button className="modal-close" onClick={onClose}><FaTimes /></button>
                </div>
                <form onSubmit={handleSubmit} className="user-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label><FaCalendarAlt style={{ marginRight: 6 }} />Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={form.startDate}
                                onChange={handleChange}
                                min={today}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label><FaCalendarAlt style={{ marginRight: 6 }} />End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={form.endDate}
                                onChange={handleChange}
                                min={form.startDate}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label><FaFileAlt style={{ marginRight: 6 }} />Reason</label>
                        <textarea
                            name="reason"
                            value={form.reason}
                            onChange={handleChange}
                            placeholder="Explain the reason for your leave request..."
                            rows={4}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 8,
                                border: '1px solid var(--border-color, #e2e8f0)',
                                background: 'var(--input-bg, #f8fafc)',
                                color: 'inherit',
                                fontSize: '0.95rem',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>
                    {error && <div className="alert alert-error">{error}</div>}
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeaveForm;
