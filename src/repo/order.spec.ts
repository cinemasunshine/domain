/**
 * creativeWork repository test
 * @ignore
 */

import * as assert from 'power-assert';
import * as sinon from 'sinon';
// tslint:disable-next-line:no-require-imports
// tslint:disable-next-line:no-var-requires
require('sinon-mongoose');
import * as sskts from '../index';

let sandbox: sinon.SinonSandbox;

before(() => {
    sandbox = sinon.sandbox.create();
});

describe('findByOrderInquiryKey()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('注文が存在すれば、取得できるはず', async () => {
        const orderInquiryKey = {};

        const repository = new sskts.repository.Order(sskts.mongoose.connection);

        sandbox.mock(repository.orderModel)
            .expects('findOne').once()
            .chain('exec')
            .resolves(new repository.orderModel());

        const result = await repository.findByOrderInquiryKey(<any>orderInquiryKey);

        assert.notEqual(result, undefined);
        sandbox.verify();
    });
});

describe('save()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('MongoDBの状態が正常であれば、保管できるはず', async () => {
        const order = {};

        const repository = new sskts.repository.Order(sskts.mongoose.connection);

        sandbox.mock(repository.orderModel)
            .expects('findOneAndUpdate').once()
            .chain('exec')
            .resolves(new repository.orderModel());

        const result = await repository.save(<any>order);

        assert.equal(result, undefined);
        sandbox.verify();
    });
});
