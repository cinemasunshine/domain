// tslint:disable:no-implicit-dependencies
/**
 * 口座サービステスト
 */
import * as assert from 'power-assert';
import * as redis from 'redis-mock';
import * as sinon from 'sinon';
import * as sskts from '../index';

let sandbox: sinon.SinonSandbox;
let redisClient: redis.RedisClient;

before(() => {
    sandbox = sinon.createSandbox();
    redisClient = redis.createClient();
});

describe('ポイント口座を開設する', () => {
    beforeEach(() => {
        sandbox.restore();
    });

    it('口座リポジトリーが正常であれば開設できるはず', async () => {
        const account = {};
        const accountNumberRepo = new sskts.repository.AccountNumber(redisClient);
        const accountService = new sskts.pecorinoapi.service.Account(<any>{});
        sandbox.mock(accountNumberRepo).expects('publish').once().resolves('accountNumber');
        sandbox.mock(accountService).expects('open').once().resolves(account);

        const result = await sskts.service.account.open(<any>{})({
            accountNumber: accountNumberRepo,
            accountService: accountService
        });
        assert.equal(typeof result, 'object');
        sandbox.verify();
    });
});

describe('ポイントを入金する', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('Pecorinoサービスが正常であれば入金できるはず', async () => {
        const depositTransaction = {};
        const depositService = new sskts.pecorinoapi.service.transaction.Deposit(<any>{});
        sandbox.mock(depositService).expects('start').once().resolves(depositTransaction);
        sandbox.mock(depositService).expects('confirm').once().resolves();

        const result = await sskts.service.account.deposit(<any>{
            agent: {},
            recipient: {}
        })({
            depositService: depositService
        });
        assert.equal(result, undefined);
        sandbox.verify();
    });
});
