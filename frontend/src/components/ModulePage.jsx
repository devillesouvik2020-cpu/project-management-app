import { useEffect, useState } from 'react';
import { api } from '../api';
import './ModulePage.css';

function formatValue(value, type) {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
  }
  if (type === 'badge') {
    return <span className={`badge badge-${value}`}>{String(value).replace('_', ' ')}</span>;
  }
  return value;
}

function RecordForm({ fields, formData, onChange, selectOptions }) {
  return (
    <div className="form-grid">
      {fields.map((field) => (
        <div key={field.name} className={`form-group ${field.fullWidth ? 'full-width' : ''}`}>
          <label htmlFor={field.name}>
            {field.label}
            {field.required && ' *'}
          </label>

          {field.type === 'select' && field.resource ? (
            <select
              id={field.name}
              name={field.name}
              value={formData[field.name] ?? ''}
              onChange={onChange}
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {(selectOptions[field.resource] || []).map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name || opt.label}
                </option>
              ))}
            </select>
          ) : field.type === 'select' && field.options ? (
            <select
              id={field.name}
              name={field.name}
              value={formData[field.name] ?? ''}
              onChange={onChange}
              required={field.required}
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              id={field.name}
              name={field.name}
              value={formData[field.name] ?? ''}
              onChange={onChange}
              required={field.required}
            />
          ) : (
            <input
              id={field.name}
              name={field.name}
              type={field.type || 'text'}
              value={formData[field.name] ?? ''}
              onChange={onChange}
              required={field.required}
              step={field.step}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ModulePage({ config }) {
  const { title, resource, searchPlaceholder, columns, fields } = config;
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectOptions, setSelectOptions] = useState({});
  const [saving, setSaving] = useState(false);

  const selectResources = [...new Set(fields.filter((f) => f.resource).map((f) => f.resource))];

  const loadRecords = async (searchTerm = search) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(resource, searchTerm);
      setRecords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectOptions = async () => {
    const options = {};
    for (const res of selectResources) {
      try {
        const data = await api.get(res);
        options[res] = data.map((item) => ({
          id: item.id,
          name:
            res === 'projects'
              ? `${item.name} (${item.client_name || 'No client'})`
              : item.name,
        }));
      } catch {
        options[res] = [];
      }
    }
    setSelectOptions(options);
  };

  useEffect(() => {
    loadRecords();
    if (selectResources.length > 0) {
      loadSelectOptions();
    }
  }, [resource]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecords(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const getEmptyForm = () => {
    const empty = {};
    fields.forEach((f) => {
      if (f.type === 'select' && f.options) {
        empty[f.name] = f.options[0]?.value ?? '';
      } else {
        empty[f.name] = '';
      }
    });
    return empty;
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(getEmptyForm());
    setShowForm(true);
    setError('');
  };

  const openEditForm = (record) => {
    setEditingId(record.id);
    const data = {};
    fields.forEach((f) => {
      data[f.name] = record[f.name] ?? '';
    });
    setFormData(data);
    setShowForm(true);
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = { ...formData };
    fields.forEach((f) => {
      if (f.type === 'number' && payload[f.name] !== '') {
        payload[f.name] = Number(payload[f.name]);
      }
      if ((f.type === 'select' && f.resource) || f.name.endsWith('_id')) {
        if (payload[f.name] !== '') {
          payload[f.name] = Number(payload[f.name]);
        }
      }
    });

    try {
      if (editingId) {
        await api.update(resource, editingId, payload);
      } else {
        await api.create(resource, payload);
      }
      closeForm();
      loadRecords();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      await api.remove(resource, id);
      loadRecords();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p className="page-subtitle">Manage {title.toLowerCase()} records</p>
        </div>
        <button className="btn btn-primary" onClick={openAddForm}>
          + Add {title.replace(/ Details| \/ Credit/g, '')}
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="record-count">{records.length} record(s)</span>
      </div>

      {error && !showForm && <div className="page-error">{error}</div>}

      {showForm && (
        <div className="form-panel">
          <div className="form-panel-header">
            <h2>{editingId ? 'Edit' : 'Add'} {title.replace(/ Details/g, '')}</h2>
            <button className="btn btn-secondary btn-sm" onClick={closeForm}>
              Cancel
            </button>
          </div>

          {error && <div className="page-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <RecordForm
              fields={fields}
              formData={formData}
              onChange={handleChange}
              selectOptions={selectOptions}
            />
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <p>No records found.</p>
            <button className="btn btn-primary" onClick={openAddForm} style={{ marginTop: '1rem' }}>
              Add first record
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  {columns.map((col) => (
                    <td key={col.key}>{formatValue(record[col.key], col.type)}</td>
                  ))}
                  <td className="actions-cell">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(record)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(record.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
