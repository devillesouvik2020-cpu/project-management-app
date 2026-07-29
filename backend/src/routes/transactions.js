const { createLinkedCrudRoute } = require('./projectLinked');

module.exports = createLinkedCrudRoute('transactions', ['project_id', 'type', 'amount', 'transaction_date']);
