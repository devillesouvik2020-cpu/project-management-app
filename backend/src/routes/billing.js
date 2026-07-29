const { createLinkedCrudRoute } = require('./projectLinked');

module.exports = createLinkedCrudRoute('billing', ['project_id', 'amount', 'billing_date']);
