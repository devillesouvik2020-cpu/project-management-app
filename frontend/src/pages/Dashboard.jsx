import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { menuSections } from '../config/modules';
import './Dashboard.css';

const statCards = [
  { label: 'Total Clients',    resource: 'clients',      icon: '👥', color: 'blue'   },
  { label: 'Total Projects',   resource: 'projects',     icon: '📁', color: 'indigo' },
  { label: 'Total Employees',  resource: 'employees',    icon: '👤', color: 'teal'   },
  { label: 'Billing Records',  resource: 'billing',      icon: '🧾', color: 'amber'  },
  { label: 'Transactions',     resource: 'transactions', icon: '💰', color: 'green'  },
  { label: 'Salary Records',   resource: 'salaries',     icon: '💵', color: 'purple' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCounts() {
      const results = {};
      await Promise.all(
        statCards.map(async (card) => {
          try {
            const data = await api.get(card.resource);
            results[card.resource] = Array.isArray(data) ? data.length : 0;
          } catch {
            results[card.resource] = '—';
          }
        })
      );
      setCounts(results);
      setLoading(false);
    }
    loadCounts();
  }, []);

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <div className="dashboard-banner">
        <div className="banner-text">
          <h1>Welcome back, {user?.username || 'Admin'} 👋</h1>
          <p>Here's an overview of your project management data.</p>
        </div>
        <div className="banner-date">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-section">
        <h2 className="section-label">Overview</h2>
        <div className="stats-grid">
          {statCards.map((card) => (
            <div key={card.resource} className={`stat-card stat-${card.color}`}>
              <div className="stat-icon">{card.icon}</div>
              <div className="stat-info">
                <div className="stat-value">
                  {loading ? <span className="stat-loading">…</span> : counts[card.resource] ?? 0}
                </div>
                <div className="stat-label">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module Sections */}
      {menuSections.map((section) => (
        <div key={section.title} className="dashboard-section">
          <h2 className="section-label">{section.title}</h2>
          <div className="module-grid">
            {section.items.map((item) => (
              <Link key={item.path} to={item.path} className="module-card">
                <span className="module-icon">{item.icon}</span>
                <div>
                  <strong>{item.label}</strong>
                  <span>View &amp; manage records</span>
                </div>
                <span className="module-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
