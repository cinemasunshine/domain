// tslint:disable-next-line:missing-jsdoc
import * as assert from 'assert';
import * as mongoose from 'mongoose';

import * as Transaction from '../../lib/factory/transaction';
import * as sskts from '../../lib/index';

let connection: mongoose.Connection;
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

        sskts.service.stock.disableTransactionInquiry(transaction)(
            sskts.createTransactionAdapter(connection)
        ).then(() => {
            done(new Error('unexpected.'));
        }).catch((err) => {
            assert(err instanceof RangeError);
            done();
        });
    });
});
