"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:missing-jsdoc
const assert = require("assert");
const mongoose = require("mongoose");
const sskts = require("../../lib/index");
const Transaction = require("../../lib/model/transaction");
let connection;
before(() => {
    connection = mongoose.createConnection(process.env.MONGOLAB_URI);
});
describe('stock service', () => {
    it('disableTransactionInquiry key not exists.', (done) => {
        const transaction = Transaction.create({
            status: 'UNDERWAY',
            owners: [],
            expired_at: new Date()
        });
        sskts.service.stock.disableTransactionInquiry(transaction)(sskts.createTransactionRepository(connection)).then(() => {
            done(new Error('unexpected.'));
        }).catch((err) => {
            assert(err instanceof RangeError);
            done();
        });
    });
});
