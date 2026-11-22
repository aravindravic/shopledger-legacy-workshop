'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

test('inventory allows selling all remaining DRY-001 stock', function () {
  var products = [{
    id: 6,
    sku: 'DRY-001',
    name: 'A2 Gir Cow Ghee 500ml',
    stock: 1,
    reserved: 0
  }];

  assert.deepEqual(inventory.check(products, [{ id: 6, qty: 1 }]), { ok: true });
  assert.deepEqual(inventory.check(products, [{ id: 6, qty: 2 }]), {
    ok: false,
    msg: 'A2 Gir Cow Ghee 500ml is out of stock (1 sellable available)'
  });
});

test('inventory allows selling all remaining SPC-001 sellable stock', function () {
  var products = [{
    id: 11,
    sku: 'SPC-001',
    name: 'Byadgi Kashmiri Chilli Powder 500g',
    stock: 4,
    reserved: 3
  }];

  assert.deepEqual(inventory.check(products, [{ id: 11, qty: 1 }]), { ok: true });
});

test('cancelling Pending Order #1007 restores physical stock', function () {
  var products = [
    { id: 6, sku: 'DRY-001', stock: 1, reserved: 0 },
    { id: 4, sku: 'OIL-001', stock: 22, reserved: 4 }
  ];
  var order = {
    id: 1007,
    date: '04/03/2022',
    customer: 'Suresh Deshmukh',
    customerId: 4,
    paymentMode: 'khata',
    status: 'pending',
    total: 1407,
    items: [
      { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', price: 450, qty: 2 },
      { id: 4, sku: 'OIL-001', name: 'Cold-Pressed Sunflower Oil 1L', price: 190, qty: 2 }
    ]
  };
  var customer = { id: 4, openingBalance: 0, totalBilled: 1407, totalSettled: 0 };
  var db = { products: products, orders: [order], customers: [customer] };

  var result = orders.cancel(db, 1007, 'Characterization test');

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual(products.map(function (product) { return product.stock; }), [3, 24]);
  assert.deepEqual(products.map(function (product) { return product.reserved; }), [0, 4]);
  assert.equal(customer.totalBilled, 0);
});
