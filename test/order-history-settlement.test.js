'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var orders = require('../lib/orders');
var ledger = require('../lib/ledger');

function makeOrdersDb() {
  return {
    orders: [
      { id: 1001, date: '28/12/2021' },
      { id: 1004, date: '30/01/2022' },
      { id: 1006, date: '18/02/2022' },
      { id: 1008, date: '15/03/2022' },
      { id: 1003, date: '14/01/2022' },
      { id: 1002, date: '05/01/2022' },
      { id: 1007, date: '04/03/2022' },
      { id: 1005, date: '02/02/2022' }
    ]
  };
}

test('order history lists orders newest first by calendar date', function () {
  var result = orders.list(makeOrdersDb());

  assert.deepEqual(result.map(function (order) { return order.id; }), [1008, 1007, 1006, 1005, 1004, 1003, 1002, 1001]);
});

test('date range returns only orders whose dates are within the inclusive range', function () {
  var result = orders.list(makeOrdersDb(), {
    from: '2022-03-01',
    to: '2022-03-31'
  });

  assert.deepEqual(result.map(function (order) { return order.id; }), [1008, 1007]);
});

test('string settlement amount is added numerically to the customer ledger', function () {
  var customer = {
    id: 1,
    name: 'Meera Joshi',
    openingBalance: 450,
    totalBilled: 1982.01,
    totalSettled: 1200
  };
  var db = {
    customers: [customer],
    settlements: [],
    nextSettlementId: 501
  };

  var result = ledger.recordSettlement(db, 1, '500', 'upi', '');

  assert.equal(result.ok, true);
  assert.equal(result.settlement.amount, 500);
  assert.equal(customer.totalSettled, 1700);
  assert.equal(customer.balance, 732.01);
});
