import { useState, useEffect } from 'react';
import {
    FaPlus, FaEdit, FaTrash, FaSearch, FaUsers, FaCalendarCheck,
    FaKey, FaQrcode, FaUmbrellaBeach, FaUserCircle,
    FaCheck, FaTimes, FaEnvelope, FaPhone, FaBuilding, FaCalendar
} from 'react-icons/fa';
import {
    getEmployees, createEmployee, updateEmployee, deleteEmployee,
    getManagerProfile, getManagerLeaves, updateLeaveStatus
} from '../services/api';
import UserForm from './UserForm';
import AttendanceOtp from './AttendanceOtp';

const leaveStatusColors = {
    PENDING: 'leave-pending',
    APPROVED: 'leave-approved',
    DENIED: 'leave-denied',
};

const ManagerDashboard = () => {
    const [employees, setEmployees] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [profile, setProfile] = useState(null);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [leavesLoading, setLeavesLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('employees');

    useEffect(() => {
        fetchEmployees();
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'leaves') fetchLeaves();
    }, [activeTab]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await getEmployees();
            setEmployees(res.data);
        } catch (err) {
            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await getManagerProfile();
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to load profile');
        }
    };

    const fetchLeaves = async () => {
        try {
            setLeavesLoading(true);
            const res = await getManagerLeaves();
            setLeaves(res.data);
        } catch (err) {
            setError('Failed to load leaves');
        } finally {
            setLeavesLoading(false);
        }
    };

    const filteredEmployees = employees.filter(e => {
        const q = search.toLowerCase();
        return e.name?.toLowerCase().includes(q) ||
            e.email?.toLowerCase().includes(q) ||
            e.department?.toLowerCase().includes(q);
    });

    const handleCreate = async (data) => {
        try {
            await createEmployee(data);
            setShowForm(false);
            fetchEmployees();
        } catch (err) {
            setError('Failed to create employee');
        }
    };

    const handleUpdate = async (data) => {
        try {
            await updateEmployee(editUser.id, data);
            setEditUser(null);
            setShowForm(false);
            fetchEmployees();
        } catch (err) {
            setError('Failed to update employee');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await deleteEmployee(id);
                fetchEmployees();
            } catch (err) {
                setError('Failed to delete employee');
            }
        }
    };

    const handleLeaveAction = async (leaveId, status) => {
        const comment = status === 'DENIED'
            ? window.prompt('(Optional) Enter a reason for denial:') || ''
            : '';
        try {
            await updateLeaveStatus(leaveId, status, comment);
            fetchLeaves();
        } catch (err) {
            setError('Failed to update leave status');
        }
    };

    const tabs = [
        { id: 'employees', label: 'Employees', icon: <FaUsers /> },
        { id: 'attendance', label: 'Attendance', icon: <FaCalendarCheck /> },
        { id: 'leaves', label: 'Leaves', icon: <FaUmbrellaBeach /> },
        { id: 'profile', label: 'Profile', icon: <FaUserCircle /> },
    ];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Manager Dashboard</h1>
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

            <div className="stats-grid">
                <div className="stat-card stat-total">
                    <FaUsers className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{employees.length}</span>
                        <span className="stat-label">Total Employees</span>
                    </div>
                </div>
                <div className="stat-card stat-manager">
                    <FaUmbrellaBeach className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{leaves.filter(l => l.status === 'PENDING').length}</span>
                        <span className="stat-label">Pending Leaves</span>
                    </div>
                </div>
                <div className="stat-card stat-employee">
                    <FaKey className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">OTP</span>
                        <span className="stat-label">Attendance Ready</span>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Employees Tab */}
            {activeTab === 'employees' && (
                <>
                    <div className="table-controls">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={() => { setEditUser(null); setShowForm(true); }}>
                            <FaPlus /> Add Employee
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-state"><div className="spinner"></div><p>Loading employees...</p></div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th><th>Email</th><th>Department</th>
                                        <th>Phone</th><th>Joining Date</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.length === 0 ? (
                                        <tr><td colSpan="6" className="empty-state">No employees found</td></tr>
                                    ) : (
                                        filteredEmployees.map(emp => (
                                            <tr key={emp.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        {emp.profilePicture && <img src={emp.profilePicture} alt="" className="cell-avatar" />}
                                                        <span>{emp.name}</span>
                                                    </div>
                                                </td>
                                                <td>{emp.email}</td>
                                                <td>{emp.department || '—'}</td>
                                                <td>{emp.phone || '—'}</td>
                                                <td>{emp.joiningDate || '—'}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button className="btn-icon btn-edit" onClick={() => { setEditUser(emp); setShowForm(true); }} title="Edit">
                                                            <FaEdit />
                                                        </button>
                                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(emp.id)} title="Delete">
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
                <AttendanceOtp />
            )}

            {/* Leaves Tab */}
            {activeTab === 'leaves' && (
                leavesLoading ? (
                    <div className="loading-state"><div className="spinner"></div><p>Loading leave requests...</p></div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employee Name</th><th>Start</th><th>End</th>
                                    <th>Reason</th><th>Status</th><th>Applied On</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.length === 0 ? (
                                    <tr><td colSpan="7" className="empty-state">No leave requests found</td></tr>
                                ) : (
                                    leaves.map(l => (
                                        <tr key={l.id}>
                                            <td>{l.employeeName || `Employee #${l.employeeId}`}</td>
                                            <td>{l.startDate}</td>
                                            <td>{l.endDate}</td>
                                            <td style={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>{l.reason}</td>
                                            <td>
                                                <span className={`status-badge ${leaveStatusColors[l.status]}`}>
                                                    {l.status}
                                                </span>
                                            </td>
                                            <td>{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '—'}</td>
                                            <td>
                                                {l.status === 'PENDING' && (
                                                    <div className="action-btns">
                                                        <button
                                                            className="btn-icon btn-edit"
                                                            title="Approve"
                                                            onClick={() => handleLeaveAction(l.id, 'APPROVED')}
                                                        >
                                                            <FaCheck />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-delete"
                                                            title="Deny"
                                                            onClick={() => handleLeaveAction(l.id, 'DENIED')}
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </div>
                                                )}
                                                {l.status !== 'PENDING' && (
                                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                                        {l.managerComment || 'No comment'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="profile-section">
                    <div className="profile-card-large">
                        <div className="profile-header-section">
                            {profile?.profilePicture ? (
                                <img src={profile.profilePicture} alt="Profile" className="profile-avatar-lg" />
                            ) : (
                                <div className="profile-avatar-placeholder"><FaUserCircle /></div>
                            )}
                            <div className="profile-name-section">
                                <h2>{profile?.name}</h2>
                                <span className="role-pill role-manager">{profile?.role}</span>
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
                </div>
            )}

            {showForm && (
                <UserForm
                    user={editUser}
                    onSubmit={editUser ? handleUpdate : handleCreate}
                    onClose={() => { setShowForm(false); setEditUser(null); }}
                    showRoleSelect={false}
                />
            )}
        </div>
    );
};

export default ManagerDashboard;
