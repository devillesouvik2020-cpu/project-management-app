const { createLinkedCrudRoute } = require('./projectLinked');

module.exports = createLinkedCrudRoute('payments', ['project_id', 'amount', 'payment_date']);
