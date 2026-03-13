import { useState, useEffect } from 'react';
import {
    FaUserCircle, FaCalendarCheck, FaEnvelope, FaPhone,
    FaBuilding, FaCalendar, FaUmbrellaBeach, FaPlus, FaClock, FaCheck
} from 'react-icons/fa';
import { getProfile, getMyAttendance, getMyLeaves, markMyAttendance } from '../services/api';
import LeaveForm from './LeaveForm';

const statusColors = {
    PRESENT: 'status-present',
    ABSENT: 'status-absent',
    LATE: 'status-late',
};

const leaveStatusColors = {
    PENDING: 'leave-pending',
    APPROVED: 'leave-approved',
    DENIED: 'leave-denied',
};

const EmployeeDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('profile');
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    
    // New state for self-marking attendance
    const [otpInput, setOtpInput] = useState('');
    const [markingAttendance, setMarkingAttendance] = useState(false);
    const [attendanceMsg, setAttendanceMsg] = useState(null);

    useEffect(() => {

        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profileRes, attendanceRes, leavesRes] = await Promise.all([
                getProfile(),
                getMyAttendance(),
                getMyLeaves(),
            ]);
            setProfile(profileRes.data);
            setAttendance(attendanceRes.data);
            setLeaves(leavesRes.data);
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async () => {
        if (!otpInput) return;
        setMarkingAttendance(true);
        setAttendanceMsg({ type: 'info', text: 'Acquiring location...' });

        if (!navigator.geolocation) {
            setAttendanceMsg({ type: 'error', text: 'Geolocation is not supported by your browser' });
            setMarkingAttendance(false);
            return;
        }

      navigator.geolocation.getCurrentPosition(
    async (position) => {
        try {

            const { latitude, longitude, accuracy } = position.coords;

            console.log("Employee location:", latitude, longitude, "Accuracy:", accuracy);

            if (accuracy > 100) {
                setAttendanceMsg({
                    type: 'error',
                    text: 'Location accuracy too low. Please enable GPS.'
                });
                setMarkingAttendance(false);
                return;
            }

            await markMyAttendance({
                otp: otpInput,
                status: 'PRESENT',
                latitude,
                longitude
            });

            setAttendanceMsg({
                type: 'success',
                text: 'Attendance marked successfully!'
            });

            setOtpInput('');
            fetchData();

        } catch (err) {
            setAttendanceMsg({
                type: 'error',
                text: err.response?.data?.error || 'Failed to mark attendance'
            });
        } finally {
            setMarkingAttendance(false);
        }
    },
    (error) => {
        setAttendanceMsg({
            type: 'error',
            text: 'Please allow location access to mark attendance'
        });
        setMarkingAttendance(false);
    },
    {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    }
);
    };

    const presentDays = attendance.filter(a => a.status === 'PRESENT').length;
    const absentDays = attendance.filter(a => a.status === 'ABSENT').length;
    const attendanceRate = attendance.length > 0
        ? Math.round((presentDays / attendance.length) * 100)
        : 0;

    const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;

    if (loading) {
        return (
            <div className="dashboard">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your profile...</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <FaUserCircle /> },
        { id: 'attendance', label: 'Attendance', icon: <FaCalendarCheck /> },
        { id: 'leave', label: 'Leave', icon: <FaUmbrellaBeach /> },
    ];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>My Dashboard</h1>
                <div className="header-actions">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {activeTab === 'profile' && (
                <div className="profile-section">
                    <div className="profile-card-large">
                        <div className="profile-header-section">
                            {profile?.profilePicture ? (
                                <img src={profile.profilePicture} alt="Profile" className="profile-avatar-lg" />
                            ) : (
                                <div className="profile-avatar-placeholder">
                                    <FaUserCircle />
                                </div>
                            )}
                            <div className="profile-name-section">
                                <h2>{profile?.name}</h2>
                                <span className="role-pill role-employee">{profile?.role}</span>
                            </div>
                        </div>

                        <div className="profile-details-grid">
                            <div className="detail-item">
                                <FaEnvelope className="detail-icon" />
                                <div>
                                    <span className="detail-label">Email</span>
                                    <span className="detail-value">{profile?.email}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <FaBuilding className="detail-icon" />
                                <div>
                                    <span className="detail-label">Department</span>
                                    <span className="detail-value">{profile?.department || 'Not assigned'}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <FaPhone className="detail-icon" />
                                <div>
                                    <span className="detail-label">Phone</span>
                                    <span className="detail-value">{profile?.phone || 'Not provided'}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <FaCalendar className="detail-icon" />
                                <div>
                                    <span className="detail-label">Joining Date</span>
                                    <span className="detail-value">{profile?.joiningDate || 'Not set'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card stat-total">
                            <FaCalendarCheck className="stat-icon" />
                            <div className="stat-info">
                                <span className="stat-number">{attendance.length}</span>
                                <span className="stat-label">Total Records</span>
                            </div>
                        </div>
                        <div className="stat-card stat-employee">
                            <FaCalendarCheck className="stat-icon" />
                            <div className="stat-info">
                                <span className="stat-number">{presentDays}</span>
                                <span className="stat-label">Days Present</span>
                            </div>
                        </div>
                        <div className="stat-card stat-admin">
                            <FaCalendarCheck className="stat-icon" />
                            <div className="stat-info">
                                <span className="stat-number">{absentDays}</span>
                                <span className="stat-label">Days Absent</span>
                            </div>
                        </div>
                        <div className="stat-card stat-manager">
                            <FaCalendarCheck className="stat-icon" />
                            <div className="stat-info">
                                <span className="stat-number">{attendanceRate}%</span>
                                <span className="stat-label">Attendance Rate</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'attendance' && (
                <>
                    <div className="attendance-card mark-card" style={{ marginBottom: 24, padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <FaCheck className="card-icon" style={{ fontSize: 22, color: 'var(--accent)' }} />
                            <h3 style={{ fontSize: 18, fontWeight: 600 }}>Mark My Attendance</h3>
                        </div>
                        <p className="card-desc" style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
                            Enter the OTP provided by your manager to mark your attendance for today.
                        </p>

                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    value={otpInput}
                                    onChange={(e) => setOtpInput(e.target.value)}
                                    className="otp-input"
                                    style={{ textAlign: 'center', fontSize: 20, letterSpacing: 4, fontWeight: 600, padding: '12px', width: '100%', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={handleMarkAttendance}
                                disabled={markingAttendance || !otpInput || otpInput.length < 6}
                                style={{ padding: '12px 24px', height: '100%' }}
                            >
                                {markingAttendance ? 'Marking...' : 'Submit OTP'}
                            </button>
                        </div>
                        {attendanceMsg && (
                            <div className={`alert alert-${attendanceMsg.type}`} style={{ marginTop: 16, marginBottom: 0 }}>
                                {attendanceMsg.text}
                            </div>
                        )}
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Verified</th>
                                    <th>Marked At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.length === 0 ? (
                                    <tr><td colSpan="4" className="empty-state">No attendance records yet</td></tr>
                                ) : (
                                    attendance.map(a => (
                                        <tr key={a.id}>
                                            <td>{a.date}</td>
                                            <td>
                                                <span className={`status-badge ${statusColors[a.status] || 'status-absent'}`}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td>{a.otpVerified ? '✅ Verified' : '❌ Not Verified'}</td>
                                            <td>{a.markedAt ? new Date(a.markedAt).toLocaleString() : '—'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'leave' && (
                <>
                    <div className="table-controls" style={{ marginBottom: 16 }}>
                        <div className="stats-grid" style={{ marginBottom: 0 }}>
                            <div className="stat-card stat-total">
                                <FaUmbrellaBeach className="stat-icon" />
                                <div className="stat-info">
                                    <span className="stat-number">{leaves.length}</span>
                                    <span className="stat-label">Total Requests</span>
                                </div>
                            </div>
                            <div className="stat-card stat-manager">
                                <FaClock className="stat-icon" />
                                <div className="stat-info">
                                    <span className="stat-number">{pendingLeaves}</span>
                                    <span className="stat-label">Pending</span>
                                </div>
                            </div>
                            <div className="stat-card stat-employee">
                                <FaCalendarCheck className="stat-icon" />
                                <div className="stat-info">
                                    <span className="stat-number">{leaves.filter(l => l.status === 'APPROVED').length}</span>
                                    <span className="stat-label">Approved</span>
                                </div>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowLeaveForm(true)}
                            style={{ marginTop: 16 }}
                        >
                            <FaPlus /> Apply for Leave
                        </button>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Manager Comment</th>
                                    <th>Applied On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.length === 0 ? (
                                    <tr><td colSpan="6" className="empty-state">No leave requests yet. Click "Apply for Leave" to submit one.</td></tr>
                                ) : (
                                    leaves.map(l => (
                                        <tr key={l.id}>
                                            <td>{l.startDate}</td>
                                            <td>{l.endDate}</td>
                                            <td>{l.reason}</td>
                                            <td>
                                                <span className={`status-badge ${leaveStatusColors[l.status]}`}>
                                                    {l.status}
                                                </span>
                                            </td>
                                            <td>{l.managerComment || '—'}</td>
                                            <td>{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '—'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {showLeaveForm && (
                <LeaveForm
                    onClose={() => setShowLeaveForm(false)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
};

export default EmployeeDashboard;
