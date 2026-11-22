'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

// All cases use in-memory order objects; they do not load the JSON store.
test('invoice uses the HSN slab stored on order lines', function () {
  var items = [{
    id: 1,
    name: 'Rice',
    sku: 'GRN-001',
    hsn: '1006',
    price: 100,
    qty: 1
  }];
  var ledger = pricing.computeTotals(items, '');
  var printedInvoice = invoice.computeInvoiceFigures({ items: items, coupon: '' });

  assert.deepEqual(
    {
      subtotal: printedInvoice.subtotal,
      discount: printedInvoice.discount,
      tax: printedInvoice.tax,
      cgst: printedInvoice.cgst,
      sgst: printedInvoice.sgst,
      total: printedInvoice.total,
      gstPercent: printedInvoice.rows[0].gstPercent,
      lineTax: printedInvoice.rows[0].lineTax
    },
    {
      subtotal: ledger.subtotal,
      discount: ledger.discount,
      tax: ledger.tax,
      cgst: ledger.cgst,
      sgst: ledger.sgst,
      total: ledger.total,
      gstPercent: ledger.lines[0].gstPercent,
      lineTax: ledger.lines[0].tax
    }
  );
});

test('invoice uses the configured coupon cap and post-discount GST basis', function () {
  var items = [{
    id: 4,
    name: 'Cold-Pressed Sunflower Oil',
    sku: 'OIL-001',
    hsn: '1508',
    price: 1120,
    qty: 2
  }];
  var ledger = pricing.computeTotals(items, 'SAVE10');
  var printedInvoice = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.deepEqual(
    {
      subtotal: printedInvoice.subtotal,
      discount: printedInvoice.discount,
      tax: printedInvoice.tax,
      cgst: printedInvoice.cgst,
      sgst: printedInvoice.sgst,
      total: printedInvoice.total,
      gstPercent: printedInvoice.rows[0].gstPercent,
      lineTax: printedInvoice.rows[0].lineTax
    },
    {
      subtotal: ledger.subtotal,
      discount: ledger.discount,
      tax: ledger.tax,
      cgst: ledger.cgst,
      sgst: ledger.sgst,
      total: ledger.total,
      gstPercent: ledger.lines[0].gstPercent,
      lineTax: ledger.lines[0].tax
    }
  );
  assert.equal(printedInvoice.discount, 150);
  assert.equal(printedInvoice.tax, 104.5);
  assert.equal(printedInvoice.total, 2194.5);
});

test('rendered invoice matches the stored billed total without a mismatch warning', function () {
  var items = [{
    id: 4,
    name: 'Cold-Pressed Sunflower Oil',
    sku: 'OIL-001',
    hsn: '1508',
    price: 1120,
    qty: 2
  }];
  var ledger = pricing.computeTotals(items, 'SAVE10');
  var order = {
    id: 1004,
    date: '30/01/2022',
    customer: 'Test customer',
    paymentMode: 'cash',
    status: 'completed',
    coupon: 'SAVE10',
    subtotal: ledger.subtotal,
    discount: ledger.discount,
    tax: ledger.tax,
    total: ledger.total,
    items: items
  };

  var html = invoice.render(order);

  assert.match(html, /Invoice Total<\/td><td class="r">₹2194\.50/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
