import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const UserForm = ({ user, onSubmit, onClose, showRoleSelect = false }) => {
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'EMPLOYEE',
        department: user?.department || '',
        phone: user?.phone || '',
        joiningDate: user?.joiningDate || '',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{user ? 'Edit User' : 'Add New User'}</h2>
                    <button className="modal-close" onClick={onClose}><FaTimes /></button>
                </div>
                <form onSubmit={handleSubmit} className="user-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter full name"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Enter email address"
                            required
                        />
                    </div>
                    {showRoleSelect && (
                        <div className="form-group">
                            <label>Role</label>
                            <select name="role" value={form.role} onChange={handleChange}>
                                <option value="EMPLOYEE">Employee</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                    )}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Department</label>
                            <input
                                type="text"
                                name="department"
                                value={form.department}
                                onChange={handleChange}
                                placeholder="e.g. Engineering"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="e.g. +91 9876543210"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Joining Date</label>
                        <input
                            type="date"
                            name="joiningDate"
                            value={form.joiningDate}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{user ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;
