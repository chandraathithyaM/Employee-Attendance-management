import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaUsers, FaUserTie, FaSignOutAlt, FaCalendarCheck, FaUserCircle, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getNavLinks = () => {
        switch (user?.role) {
            case 'ADMIN':
                return [
                    { path: '/admin', label: 'Dashboard', icon: <FaHome /> },
                    { path: '/admin/employees', label: 'Employees', icon: <FaUsers /> },
                    { path: '/admin/managers', label: 'Managers', icon: <FaUserTie /> },
                ];
            case 'MANAGER':
                return [
                    { path: '/manager', label: 'Dashboard', icon: <FaHome /> },
                    { path: '/manager/employees', label: 'Employees', icon: <FaUsers /> },
                    { path: '/manager/attendance', label: 'Attendance', icon: <FaCalendarCheck /> },
                ];
            case 'EMPLOYEE':
                return [
                    { path: '/employee', label: 'My Profile', icon: <FaUserCircle /> },
                    { path: '/employee/attendance', label: 'Attendance', icon: <FaCalendarCheck /> },
                ];
            default:
                return [];
        }
    };

    const getRoleBadge = () => {
        const colors = {
            ADMIN: '#ef4444',
            MANAGER: '#f59e0b',
            EMPLOYEE: '#10b981',
        };
        return (
            <span className="role-badge" style={{ background: colors[user?.role] || '#6b7280' }}>
                {user?.role}
            </span>
        );
    };

    return (
        <nav className="navbar">
            <div className="nav-brand" onClick={() => navigate('/')}>
                <FaUsers className="nav-logo-icon" />
                <span>EMS</span>
            </div>

            <div className="nav-links">
                {getNavLinks().map((link) => (
                    <button
                        key={link.path}
                        className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                        onClick={() => navigate(link.path)}
                    >
                        {link.icon}
                        <span>{link.label}</span>
                    </button>
                ))}
            </div>

            <div className="nav-user">
                {user?.profilePicture && (
                    <img src={user.profilePicture} alt="Profile" className="nav-avatar" />
                )}
                <div className="nav-user-info">
                    <span className="nav-username">{user?.name}</span>
                    {getRoleBadge()}
                </div>
                <button className="nav-theme-toggle" onClick={toggleTheme} title="Toggle Theme" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', transition: 'var(--transition)' }}>
                    {theme === 'light' ? <FaMoon /> : <FaSun />}
                </button>
                <button className="nav-logout" onClick={handleLogout} title="Sign Out">
                    <FaSignOutAlt />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
