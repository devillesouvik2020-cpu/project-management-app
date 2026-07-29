const bcrypt = require('bcryptjs');
const { initDatabase, prepare } = require('./database');

async function seed() {
  await initDatabase();

  const adminResult = await prepare('SELECT COUNT(*) AS count FROM admins').get();
  if (parseInt(adminResult.count) === 0) {
    const password = bcrypt.hashSync('admin123', 10);
    await prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', password);
    console.log('Default admin created: username=admin, password=admin123');
  }

  const clientResult = await prepare('SELECT COUNT(*) AS count FROM clients').get();
  if (parseInt(clientResult.count) === 0) {
    const c1 = await prepare(
      'INSERT INTO clients (name, contact_email, contact_phone, address) VALUES (?, ?, ?, ?)'
    ).run('Acme Corp', 'contact@acme.com', '555-0101', '123 Business Park');
    const c2 = await prepare(
      'INSERT INTO clients (name, contact_email, contact_phone, address) VALUES (?, ?, ?, ?)'
    ).run('Globex Ltd', 'info@globex.com', '555-0202', '456 Tech Avenue');

    const p1 = await prepare(
      'INSERT INTO projects (client_id, name, details, start_date, status) VALUES (?, ?, ?, ?, ?)'
    ).run(
      c1.lastInsertRowid,
      'Website Redesign',
      'Full redesign of corporate website',
      '2025-01-15',
      'active'
    );
    await prepare(
      'INSERT INTO projects (client_id, name, details, start_date, status) VALUES (?, ?, ?, ?, ?)'
    ).run(
      c2.lastInsertRowid,
      'Mobile App',
      'Cross-platform mobile application',
      '2025-03-01',
      'active'
    );

    await prepare(
      'INSERT INTO billing (project_id, invoice_number, amount, billing_date, due_date, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(p1.lastInsertRowid, 'INV-001', 15000, '2025-02-01', '2025-03-01', 'Phase 1 billing', 'pending');

    await prepare(
      'INSERT INTO payments (project_id, amount, payment_date, payment_method, reference_number, description) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(p1.lastInsertRowid, 5000, '2025-02-15', 'Bank Transfer', 'TXN-1001', 'Advance payment');

    await prepare(
      'INSERT INTO transactions (project_id, type, amount, transaction_date, description) VALUES (?, ?, ?, ?, ?)'
    ).run(p1.lastInsertRowid, 'debit', 2000, '2025-02-10', 'Hosting costs');

    const e1 = await prepare(
      'INSERT INTO employees (name, date_of_joining, designation, place_of_posting, contact_email) VALUES (?, ?, ?, ?, ?)'
    ).run('John Smith', '2024-06-01', 'Project Manager', 'New York', 'john@company.com');
    await prepare(
      'INSERT INTO employees (name, date_of_joining, designation, place_of_posting, contact_email) VALUES (?, ?, ?, ?, ?)'
    ).run('Jane Doe', '2024-08-15', 'Developer', 'Remote', 'jane@company.com');

    await prepare(
      'INSERT INTO salaries (employee_id, amount, effective_from, payment_frequency, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(e1.lastInsertRowid, 75000, '2024-06-01', 'monthly', 'Annual package');

    await prepare(
      'INSERT INTO attendance (employee_id, attendance_date, status, check_in, check_out) VALUES (?, ?, ?, ?, ?)'
    ).run(e1.lastInsertRowid, '2025-07-29', 'present', '09:00', '18:00');

    console.log('Sample data seeded successfully');
  } else {
    console.log('Database already has data, skipping seed');
  }
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
