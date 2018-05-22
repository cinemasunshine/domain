// tslint:disable:no-implicit-dependencies
/**
 * taskFunctions test
 * @ignore
 */

import * as assert from 'power-assert';
import * as sinon from 'sinon';
import * as sskts from '../index';

import * as TaskFunctionsService from './taskFunctions';

let sandbox: sinon.SinonSandbox;

before(() => {
    sandbox = sinon.sandbox.create();
});

describe('TaskFunctionsService.cancelSeatReservation()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('仮予約解除サービスが正常であれば、エラーにならないはず', async () => {
        const data = {
            transactionId: 'transactionId'
        };

        sandbox.mock(sskts.service.stock).expects('cancelSeatReservationAuth').once()
            .withArgs(data.transactionId).returns(async () => Promise.resolve());

        const result = await TaskFunctionsService.cancelSeatReservation(<any>data)({ connection: sskts.mongoose.connection });

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('TaskFunctionsService.cancelCreditCard()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('クレジットカードオーソリ解除サービスが正常であれば、エラーにならないはず', async () => {
        const data = {
            transactionId: 'transactionId'
        };

        sandbox.mock(sskts.service.payment).expects('cancelCreditCardAuth').once()
            .withArgs(data.transactionId).returns(async () => Promise.resolve());

        const result = await TaskFunctionsService.cancelCreditCard(<any>data)({ connection: sskts.mongoose.connection });

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('TaskFunctionsService.cancelMvtk()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('ムビチケキャンセルサービスが正常であれば、エラーにならないはず', async () => {
        const data = {
            transactionId: 'transactionId'
        };

        sandbox.mock(sskts.service.payment).expects('cancelMvtk').once()
            .withArgs(data.transactionId).returns(async () => Promise.resolve());

        const result = await TaskFunctionsService.cancelMvtk(<any>data)({ connection: sskts.mongoose.connection });

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('TaskFunctionsService.settleCreditCard()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('クレジットカード実売上サービスが正常であれば、エラーにならないはず', async () => {
        const data = {
            transactionId: 'transactionId'
        };

        sandbox.mock(sskts.service.payment).expects('payCreditCard').once()
            .withArgs(data.transactionId).returns(async () => Promise.resolve());

        const result = await TaskFunctionsService.payCreditCard(<any>data)({ connection: sskts.mongoose.connection });

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('TaskFunctionsService.settleMvtk()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('ムビチケ確定サービスが正常であれば、エラーにならないはず', async () => {
        const data = {
            transactionId: 'transactionId'
        };

        sandbox.mock(sskts.service.payment).expects('useMvtk').once()
            .withArgs(data.transactionId).returns(async () => Promise.resolve());

        const result = await TaskFunctionsService.useMvtk(<any>data)({ connection: sskts.mongoose.connection });

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('TaskFunctionsService.createOrder()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('注文作成サービスが正常であれば、エラーにならないはず', async () => {
        const data = {
            transactionId: 'transactionId'
        };

        sandbox.mock(sskts.service.order).expects('createFromTransaction').once()
            .withArgs(data.transactionId).returns(async () => Promise.resolve());

        const result = await TaskFunctionsService.placeOrder(<any>data)({ connection: sskts.mongoose.connection });

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('TaskFunctionsService.sendEmailMessage()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('通知サービスが正常であればエラーにならないはず', async () => {
        const data = {
            transactionId: 'transactionId',
            actionAttributes: {}
        };

        sandbox.mock(sskts.service.notification).expects('sendEmailMessage').once()
            .withArgs(data.actionAttributes).returns(async () => Promise.resolve());

        const result = await TaskFunctionsService.sendEmailMessage(<any>data)({ connection: sskts.mongoose.connection });

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('TaskFunctionsService.refundCreditCard()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('売上サービスが正常であればエラーにならないはず', async () => {
        const data = {
            transactionId: 'transactionId'
        };

        sandbox.mock(sskts.service.payment).expects('refundCreditCard').once()
            .withArgs(data.transactionId).returns(async () => Promise.resolve());

        const result = await TaskFunctionsService.refundCreditCard(<any>data)({ connection: sskts.mongoose.connection });

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('TaskFunctionsService.returnOrder()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('注文サービスが正常であればエラーにならないはず', async () => {
        const data = {
            transactionId: 'transactionId'
        };

        sandbox.mock(sskts.service.order).expects('cancelReservations').once()
            .withArgs(data.transactionId).returns(async () => Promise.resolve());

        const result = await TaskFunctionsService.returnOrder(<any>data)({ connection: sskts.mongoose.connection });

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('TaskFunctionsService.sendOrder()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('配送サービスが正常であればエラーにならないはず', async () => {
        const data = {
            transactionId: 'transactionId'
        };

        sandbox.mock(sskts.service.delivery).expects('sendOrder').once()
            .withArgs(data.transactionId).returns(async () => Promise.resolve());

        const result = await TaskFunctionsService.sendOrder(<any>data)({ connection: sskts.mongoose.connection });

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('TaskFunctionsService.payPecorino()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('決済サービスが正常であればエラーにならないはず', async () => {
        const data = {};

        const pecorinoAuthClient = new sskts.pecorinoapi.auth.ClientCredentials(<any>{});

        sandbox.mock(sskts.service.payment).expects('payPecorino').once().returns(async () => Promise.resolve());

        const result = await TaskFunctionsService.payPecorino(<any>data)({
            connection: sskts.mongoose.connection,
            pecorinoAuthClient: pecorinoAuthClient
        });

        assert.equal(result, undefined);
        sandbox.verify();
    });

    it('PecorinoAPIクライアントがセットされていなければエラーとなるはず', async () => {
        const data = {
            transactionId: 'transactionId'
        };

        sandbox.mock(sskts.service.payment).expects('payPecorino').never();

        const result = await TaskFunctionsService.payPecorino(<any>data)({
            connection: sskts.mongoose.connection
        }).catch((err) => err);

        assert(result instanceof Error);
        sandbox.verify();
    });
});
