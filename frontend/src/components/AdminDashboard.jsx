import { useState, useEffect } from 'react';
import {
    FaPlus, FaEdit, FaTrash, FaSearch, FaUserTie, FaUsers,
    FaUserShield, FaUmbrellaBeach, FaUserCircle,
    FaEnvelope, FaPhone, FaBuilding, FaCalendar
} from 'react-icons/fa';
import { getAllUsers, createUser, updateUser, deleteUser, getAdminProfile, getAllAdminLeaves } from '../services/api';
import UserForm from './UserForm';

const leaveStatusColors = {
    PENDING: 'leave-pending',
    APPROVED: 'leave-approved',
    DENIED: 'leave-denied',
};

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [profile, setProfile] = useState(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [showForm, setShowForm] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('users');

    useEffect(() => {
        fetchUsers();
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'leaves') fetchLeaves();
    }, [activeTab]);

    useEffect(() => {
        let result = users;
        if (roleFilter !== 'ALL') {
            result = result.filter(u => u.role === roleFilter);
        }
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(u =>
                u.name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.department?.toLowerCase().includes(q)
            );
        }
        setFilteredUsers(result);
    }, [users, search, roleFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await getAllUsers();
            setUsers(res.data);
        } catch (err) {
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await getAdminProfile();
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to load profile');
        }
    };

    const fetchLeaves = async () => {
        try {
            const res = await getAllAdminLeaves();
            setLeaves(res.data);
        } catch (err) {
            setError('Failed to load leaves');
        }
    };

    const handleCreate = async (data) => {
        try {
            await createUser(data);
            setShowForm(false);
            fetchUsers();
        } catch (err) {
            setError('Failed to create user');
        }
    };

    const handleUpdate = async (data) => {
        try {
            await updateUser(editUser.id, data);
            setEditUser(null);
            setShowForm(false);
            fetchUsers();
        } catch (err) {
            setError('Failed to update user');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteUser(id);
                fetchUsers();
            } catch (err) {
                setError('Failed to delete user');
            }
        }
    };

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'ADMIN').length,
        managers: users.filter(u => u.role === 'MANAGER').length,
        employees: users.filter(u => u.role === 'EMPLOYEE').length,
    };

    const tabs = [
        { id: 'users', label: 'Users', icon: <FaUsers /> },
        { id: 'leaves', label: 'All Leaves', icon: <FaUmbrellaBeach /> },
        { id: 'profile', label: 'Profile', icon: <FaUserCircle /> },
    ];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
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
                    {activeTab === 'users' && (
                        <button className="btn btn-primary" onClick={() => { setEditUser(null); setShowForm(true); }}>
                            <FaPlus /> Add User
                        </button>
                    )}
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card stat-total">
                    <FaUsers className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{stats.total}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                </div>
                <div className="stat-card stat-admin">
                    <FaUserShield className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{stats.admins}</span>
                        <span className="stat-label">Admins</span>
                    </div>
                </div>
                <div className="stat-card stat-manager">
                    <FaUserTie className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{stats.managers}</span>
                        <span className="stat-label">Managers</span>
                    </div>
                </div>
                <div className="stat-card stat-employee">
                    <FaUsers className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{stats.employees}</span>
                        <span className="stat-label">Employees</span>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <>
                    <div className="table-controls">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="filter-tabs">
                            {['ALL', 'ADMIN', 'MANAGER', 'EMPLOYEE'].map(role => (
                                <button
                                    key={role}
                                    className={`filter-tab ${roleFilter === role ? 'active' : ''}`}
                                    onClick={() => setRoleFilter(role)}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state"><div className="spinner"></div><p>Loading users...</p></div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th><th>Email</th><th>Role</th>
                                        <th>Department</th><th>Phone</th><th>Joining Date</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan="7" className="empty-state">No users found</td></tr>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        {user.profilePicture && <img src={user.profilePicture} alt="" className="cell-avatar" />}
                                                        <span>{user.name}</span>
                                                    </div>
                                                </td>
                                                <td>{user.email}</td>
                                                <td><span className={`role-pill role-${user.role?.toLowerCase()}`}>{user.role}</span></td>
                                                <td>{user.department || '—'}</td>
                                                <td>{user.phone || '—'}</td>
                                                <td>{user.joiningDate || '—'}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button className="btn-icon btn-edit" onClick={() => { setEditUser(user); setShowForm(true); }} title="Edit">
                                                            <FaEdit />
                                                        </button>
                                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(user.id)} title="Delete">
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

            {/* Leaves Tab (view-only) */}
            {activeTab === 'leaves' && (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Employee ID</th><th>Start</th><th>End</th>
                                <th>Reason</th><th>Status</th><th>Manager Comment</th><th>Applied On</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.length === 0 ? (
                                <tr><td colSpan="7" className="empty-state">No leave requests found</td></tr>
                            ) : (
                                leaves.map(l => (
                                    <tr key={l.id}>
                                        <td>#{l.employeeId}</td>
                                        <td>{l.startDate}</td>
                                        <td>{l.endDate}</td>
                                        <td style={{ maxWidth: 180, whiteSpace: 'normal', wordBreak: 'break-word' }}>{l.reason}</td>
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
                                <span className="role-pill role-admin">{profile?.role}</span>
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
                    showRoleSelect={true}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
