import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { menuSections } from '../config/modules';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">PM</span>
          <div>
            <strong>Project Mgmt</strong>
            <small>Admin Panel</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span>🏠</span> Dashboard
          </NavLink>

          {menuSections.map((section) => (
            <div key={section.title} className="nav-section">
              <div className="nav-section-title">{section.title}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <span>{item.icon}</span> {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-avatar">{user?.username?.[0]?.toUpperCase()}</span>
            <span>{user?.username}</span>
          </div>
          <button className="btn btn-secondary btn-sm logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
