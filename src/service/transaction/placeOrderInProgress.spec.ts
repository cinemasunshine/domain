// tslint:disable:no-implicit-dependencies

/**
 * placeOrderInProgress transaction service test
 * @ignore
 */

import * as waiter from '@motionpicture/waiter-domain';
import * as assert from 'power-assert';
import * as redis from 'redis-mock';
import * as sinon from 'sinon';
import * as sskts from '../../index';

let sandbox: sinon.SinonSandbox;

before(() => {
    sandbox = sinon.sandbox.create();
});

describe('start()', () => {
    beforeEach(() => {
        delete process.env.WAITER_PASSPORT_ISSUER;
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('販売者が存在すれば、開始できるはず', async () => {
        const agentId = 'agentId';
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' },
            identifier: 'sellerIdentifier'
        };
        const transaction = {
            expires: new Date()
        };
        const scope = {};
        const maxCountPerUnit = 999;

        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);
        const transactioCountRepo = new sskts.repository.TransactionCount(redis.createClient());

        sandbox.mock(organizationRepo).expects('findMovieTheaterById').once().withExactArgs(seller.id).resolves(seller);
        sandbox.mock(transactioCountRepo).expects('incr').once().withExactArgs(scope).resolves(maxCountPerUnit - 1);
        sandbox.mock(transactionRepo).expects('startPlaceOrder').once().resolves(transaction);

        const result = await sskts.service.transaction.placeOrderInProgress.start({
            expires: transaction.expires,
            maxCountPerUnit: maxCountPerUnit,
            clientUser: <any>{},
            scope: <any>scope,
            agentId: agentId,
            sellerId: seller.id
        })(organizationRepo, transactionRepo, transactioCountRepo);

        assert.deepEqual(result, transaction);
        // assert.equal(result.expires, transaction.expires);
        sandbox.verify();
    });

    it('クライアントユーザーにusernameが存在すれば、会員として開始できるはず', async () => {
        const agentId = 'agentId';
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' },
            identifier: 'sellerIdentifier'
        };
        const transaction = {
            expires: new Date()
        };
        const scope = {};
        const maxCountPerUnit = 999;
        const clientUser = {
            username: 'username'
        };

        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);
        const transactioCountRepo = new sskts.repository.TransactionCount(redis.createClient());

        sandbox.mock(organizationRepo).expects('findMovieTheaterById').once().withExactArgs(seller.id).resolves(seller);
        sandbox.mock(transactioCountRepo).expects('incr').once().withExactArgs(scope).resolves(maxCountPerUnit - 1);
        sandbox.mock(transactionRepo).expects('startPlaceOrder').once().resolves(transaction);

        const result = await sskts.service.transaction.placeOrderInProgress.start({
            expires: transaction.expires,
            maxCountPerUnit: maxCountPerUnit,
            clientUser: <any>clientUser,
            scope: <any>scope,
            agentId: agentId,
            sellerId: seller.id
        })(organizationRepo, transactionRepo, transactioCountRepo);

        assert.deepEqual(result, transaction);
        sandbox.verify();
    });

    it('許可証トークンの検証に成功すれば、開始できるはず', async () => {
        process.env.WAITER_PASSPORT_ISSUER = 'https://example.com';
        const agentId = 'agentId';
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' },
            identifier: 'sellerIdentifier'
        };
        const transaction = {
            expires: new Date()
        };
        const passportToken = 'passportToken';
        const passport = {
            scope: `placeOrderTransaction.${seller.identifier}`,
            iat: 123,
            exp: 123,
            iss: process.env.WAITER_PASSPORT_ISSUER,
            issueUnit: {}
        };

        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(organizationRepo).expects('findMovieTheaterById').once().withExactArgs(seller.id).resolves(seller);
        sandbox.mock(waiter.service.passport).expects('verify').once().resolves(passport);
        sandbox.mock(transactionRepo).expects('startPlaceOrder').once().resolves(transaction);

        const result = await sskts.service.transaction.placeOrderInProgress.start({
            expires: transaction.expires,
            passportToken: passportToken,
            clientUser: <any>{},
            agentId: agentId,
            sellerId: seller.id
        })(organizationRepo, transactionRepo);
        assert.deepEqual(result, transaction);
        sandbox.verify();
    });

    it('許可証トークンの検証に失敗すれば、Argumentエラーとなるはず', async () => {
        process.env.WAITER_PASSPORT_ISSUER = 'https://example.com';
        const agentId = 'agentId';
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' },
            identifier: 'sellerIdentifier'
        };
        const transaction = {
            expires: new Date()
        };
        const passportToken = 'passportToken';
        const verifyResult = new Error('verifyError');

        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(organizationRepo).expects('findMovieTheaterById').once().withExactArgs(seller.id).resolves(seller);
        sandbox.mock(waiter.service.passport).expects('verify').once().rejects(verifyResult);
        sandbox.mock(transactionRepo).expects('startPlaceOrder').never();

        const result = await sskts.service.transaction.placeOrderInProgress.start({
            expires: transaction.expires,
            passportToken: passportToken,
            clientUser: <any>{},
            agentId: agentId,
            sellerId: seller.id
        })(organizationRepo, transactionRepo).catch((err) => err);
        assert(result instanceof sskts.factory.errors.Argument);
        sandbox.verify();
    });

    it('許可証の発行者が期待通りでなければ、Argumentエラーとなるはず', async () => {
        process.env.WAITER_PASSPORT_ISSUER = 'https://example.com';
        const agentId = 'agentId';
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' },
            identifier: 'sellerIdentifier'
        };
        const transaction = {
            expires: new Date()
        };
        const passportToken = 'passportToken';
        const passport = {
            scope: `placeOrderTransaction.${seller.id}`,
            iat: 123,
            exp: 123,
            iss: 'invalidIssuer',
            issueUnit: {}
        };

        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(organizationRepo).expects('findMovieTheaterById').once().withExactArgs(seller.id).resolves(seller);
        sandbox.mock(waiter.service.passport).expects('verify').once().resolves(passport);
        sandbox.mock(transactionRepo).expects('startPlaceOrder').once().never();

        const result = await sskts.service.transaction.placeOrderInProgress.start({
            expires: transaction.expires,
            passportToken: passportToken,
            clientUser: <any>{},
            agentId: agentId,
            sellerId: seller.id
        })(organizationRepo, transactionRepo).catch((err) => err);
        assert(result instanceof sskts.factory.errors.Argument);
        sandbox.verify();
    });

    it('許可証がない場合、スコープの指定がなければArgumentNullエラーとなるはず', async () => {
        const agentId = 'agentId';
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' },
            identifier: 'sellerIdentifier'
        };
        const transaction = {
            expires: new Date()
        };
        const scope = undefined;
        const maxCountPerUnit = 999;

        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);
        const transactioCountRepo = new sskts.repository.TransactionCount(redis.createClient());

        sandbox.mock(organizationRepo).expects('findMovieTheaterById').once().withExactArgs(seller.id).resolves(seller);
        sandbox.mock(transactioCountRepo).expects('incr').never();
        sandbox.mock(transactionRepo).expects('startPlaceOrder').never();

        const result = await sskts.service.transaction.placeOrderInProgress.start({
            expires: transaction.expires,
            scope: <any>scope,
            maxCountPerUnit: maxCountPerUnit,
            clientUser: <any>{},
            agentId: agentId,
            sellerId: seller.id
        })(organizationRepo, transactionRepo, transactioCountRepo).catch((err) => err);
        assert(result instanceof sskts.factory.errors.ArgumentNull);
        sandbox.verify();
    });

    it('許可証がない場合、単位あたりの最大取引数の指定がなければArgumentNullエラーとなるはず', async () => {
        const agentId = 'agentId';
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' },
            identifier: 'sellerIdentifier'
        };
        const transaction = {
            expires: new Date()
        };
        const scope = {};
        const maxCountPerUnit = undefined;

        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);
        const transactioCountRepo = new sskts.repository.TransactionCount(redis.createClient());

        sandbox.mock(organizationRepo).expects('findMovieTheaterById').once().withExactArgs(seller.id).resolves(seller);
        sandbox.mock(transactioCountRepo).expects('incr').never();
        sandbox.mock(transactionRepo).expects('startPlaceOrder').never();

        const result = await sskts.service.transaction.placeOrderInProgress.start({
            expires: transaction.expires,
            scope: <any>scope,
            maxCountPerUnit: maxCountPerUnit,
            clientUser: <any>{},
            agentId: agentId,
            sellerId: seller.id
        })(organizationRepo, transactionRepo, transactioCountRepo).catch((err) => err);
        assert(result instanceof sskts.factory.errors.ArgumentNull);
        sandbox.verify();
    });

    it('許可証がない場合、取引数レポジトリーの指定がなければArgumentNullエラーとなるはず', async () => {
        const agentId = 'agentId';
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' },
            identifier: 'sellerIdentifier'
        };
        const transaction = {
            expires: new Date()
        };
        const scope = {};
        const maxCountPerUnit = 999;

        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);
        const transactioCountRepo = new sskts.repository.TransactionCount(redis.createClient());

        sandbox.mock(organizationRepo).expects('findMovieTheaterById').once().withExactArgs(seller.id).resolves(seller);
        sandbox.mock(transactioCountRepo).expects('incr').never();
        sandbox.mock(transactionRepo).expects('startPlaceOrder').never();

        const result = await sskts.service.transaction.placeOrderInProgress.start({
            expires: transaction.expires,
            scope: <any>scope,
            maxCountPerUnit: maxCountPerUnit,
            clientUser: <any>{},
            agentId: agentId,
            sellerId: seller.id
        })(organizationRepo, transactionRepo).catch((err) => err);
        console.error(result);
        assert(result instanceof sskts.factory.errors.ArgumentNull);
        sandbox.verify();
    });

    it('取引作成時に何かしらエラーが発生すれば、そのままのエラーになるはず', async () => {
        process.env.WAITER_PASSPORT_ISSUER = 'https://example.com';
        const agentId = 'agentId';
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' },
            identifier: 'sellerIdentifier'
        };
        const expires = new Date();
        const startResult = new Error('startError');
        const passportToken = 'passportToken';
        const passport = {
            scope: `placeOrderTransaction.${seller.identifier}`,
            iat: 123,
            exp: 123,
            iss: process.env.WAITER_PASSPORT_ISSUER,
            issueUnit: {}
        };

        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(organizationRepo).expects('findMovieTheaterById').once().withExactArgs(seller.id).resolves(seller);
        sandbox.mock(waiter.service.passport).expects('verify').once().resolves(passport);
        sandbox.mock(transactionRepo).expects('startPlaceOrder').once().rejects(startResult);

        const result = await sskts.service.transaction.placeOrderInProgress.start({
            expires: expires,
            passportToken: passportToken,
            clientUser: <any>{},
            agentId: agentId,
            sellerId: seller.id
        })(organizationRepo, transactionRepo).catch((err) => err);
        assert.deepEqual(result, startResult);
        sandbox.verify();
    });

    it('許可証を重複使用しようとすれば、AlreadyInUseエラーとなるはず', async () => {
        process.env.WAITER_PASSPORT_ISSUER = 'https://example.com';
        const agentId = 'agentId';
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' },
            identifier: 'sellerIdentifier'
        };
        const expires = new Date();
        const startResult = sskts.mongoose.mongo.MongoError.create({ code: 11000 });
        const passportToken = 'passportToken';
        const passport = {
            scope: `placeOrderTransaction.${seller.identifier}`,
            iat: 123,
            exp: 123,
            iss: process.env.WAITER_PASSPORT_ISSUER,
            issueUnit: {}
        };

        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(organizationRepo).expects('findMovieTheaterById').once().withExactArgs(seller.id).resolves(seller);
        sandbox.mock(waiter.service.passport).expects('verify').once().resolves(passport);
        sandbox.mock(transactionRepo).expects('startPlaceOrder').once().rejects(startResult);

        const result = await sskts.service.transaction.placeOrderInProgress.start({
            expires: expires,
            passportToken: passportToken,
            clientUser: <any>{},
            agentId: agentId,
            sellerId: seller.id
        })(organizationRepo, transactionRepo).catch((err) => err);
        assert(result instanceof sskts.factory.errors.AlreadyInUse);
        sandbox.verify();
    });

    it('取引数制限を超えていれば、RateLimitExceededエラーが投げられるはず', async () => {
        const agentId = 'agentId';
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' },
            identifier: 'sellerIdentifier'
        };
        const transaction = {
            expires: new Date()
        };
        const scope = {};
        const maxCountPerUnit = 999;

        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);
        const transactioCountRepo = new sskts.repository.TransactionCount(redis.createClient());

        sandbox.mock(organizationRepo).expects('findMovieTheaterById').once().withExactArgs(seller.id).resolves(seller);
        sandbox.mock(transactioCountRepo).expects('incr').once().withExactArgs(scope).resolves(maxCountPerUnit + 1);
        sandbox.mock(transactionRepo).expects('startPlaceOrder').never();

        const startError = await sskts.service.transaction.placeOrderInProgress.start({
            expires: transaction.expires,
            maxCountPerUnit: maxCountPerUnit,
            clientUser: <any>{},
            scope: <any>scope,
            agentId: agentId,
            sellerId: seller.id
        })(organizationRepo, transactionRepo, transactioCountRepo)
            .catch((err) => err);

        assert(startError instanceof sskts.factory.errors.RateLimitExceeded);
        sandbox.verify();
    });
});

describe('setCustomerContact()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('取引が進行中であれば、エラーにならないはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller,
            object: {
            }
        };
        const contact = {
            givenName: 'givenName',
            familyName: 'familyName',
            telephone: '09012345678',
            email: 'john@example.com'
        };

        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findPlaceOrderInProgressById').once()
            .withExactArgs(transaction.id).resolves(transaction);
        sandbox.mock(transactionRepo).expects('setCustomerContactOnPlaceOrderInProgress').once()
            .withArgs(transaction.id).resolves();

        const result = await sskts.service.transaction.placeOrderInProgress.setCustomerContact(
            agent.id,
            transaction.id,
            <any>contact
        )(transactionRepo);

        assert.equal(typeof result, 'object');
        sandbox.verify();
    });

    it('所有者の取引でなければ、Forbiddenエラーが投げられるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: { id: 'anotherAgentId' },
            seller: seller,
            object: {
            }
        };
        const contact = {
            givenName: 'givenName',
            familyName: 'familyName',
            telephone: '09012345678',
            email: 'john@example.com'
        };

        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findPlaceOrderInProgressById').once()
            .withExactArgs(transaction.id).resolves(transaction);
        sandbox.mock(transactionRepo).expects('setCustomerContactOnPlaceOrderInProgress').never();

        const result = await sskts.service.transaction.placeOrderInProgress.setCustomerContact(
            agent.id,
            transaction.id,
            <any>contact
        )(transactionRepo).catch((err) => err);

        assert(result instanceof sskts.factory.errors.Forbidden);
        sandbox.verify();
    });

    it('電話番号フォーマットが不適切であれば、Argumentエラーが投げられるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller,
            object: {
            }
        };
        const contact = {
            givenName: 'givenName',
            familyName: 'familyName',
            telephone: '090123456789',
            email: 'john@example.com'
        };

        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findPlaceOrderInProgressById').never()
            .withExactArgs(transaction.id).resolves(transaction);
        sandbox.mock(transactionRepo).expects('setCustomerContactOnPlaceOrderInProgress').never();

        const result = await sskts.service.transaction.placeOrderInProgress.setCustomerContact(
            agent.id,
            transaction.id,
            <any>contact
        )(transactionRepo).catch((err) => err);
        assert(result instanceof sskts.factory.errors.Argument);
        sandbox.verify();
    });
});

describe('confirm()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('確定条件が整っていれば、確定できるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller,
            object: {
                customerContact: {}
            }
        };
        const creditCardAuthorizeActions = [
            {
                id: 'actionId2',
                actionStatus: 'CompletedActionStatus',
                agent: transaction.agent,
                object: {},
                result: {
                    price: 1234
                },
                endDate: new Date()
            }
        ];
        const seatReservationAuthorizeActions = [
            {
                id: 'actionId1',
                actionStatus: 'CompletedActionStatus',
                agent: transaction.seller,
                object: {},
                result: {
                    updTmpReserveSeatArgs: {},
                    price: 1234
                },
                endDate: new Date()
            }
        ];
        const order = {
            orderNumber: 'orderNumber',
            acceptedOffers: [
                {
                    itemOffered: {
                        reservationFor: { endDate: new Date() },
                        reservedTicket: { ticketToken: 'ticketToken1' }
                    }
                },
                {
                    itemOffered: {
                        reservationFor: { endDate: new Date() },
                        reservedTicket: { ticketToken: 'ticketToken2' }
                    }
                }
            ],
            customer: {
                name: 'name'
            }
        };

        const creditCardAuthorizeActionRepo = new sskts.repository.action.authorize.CreditCard(sskts.mongoose.connection);
        const mvtkAuthorizeActionRepo = new sskts.repository.action.authorize.Mvtk(sskts.mongoose.connection);
        const seatReservationAuthorizeActionRepo = new sskts.repository.action.authorize.SeatReservation(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findPlaceOrderInProgressById').once()
            .withExactArgs(transaction.id).resolves(transaction);
        sandbox.mock(creditCardAuthorizeActionRepo).expects('findByTransactionId').once()
            .withExactArgs(transaction.id).resolves(creditCardAuthorizeActions);
        sandbox.mock(mvtkAuthorizeActionRepo).expects('findByTransactionId').once()
            .withExactArgs(transaction.id).resolves([]);
        sandbox.mock(seatReservationAuthorizeActionRepo).expects('findByTransactionId').once()
            .withExactArgs(transaction.id).resolves(seatReservationAuthorizeActions);
        sandbox.mock(sskts.factory.order).expects('createFromPlaceOrderTransaction').once().returns(order);
        sandbox.mock(sskts.factory.ownershipInfo).expects('create').exactly(order.acceptedOffers.length).returns([]);
        sandbox.mock(transactionRepo).expects('confirmPlaceOrder').once().withArgs(transaction.id).resolves();

        const result = await sskts.service.transaction.placeOrderInProgress.confirm(
            agent.id,
            transaction.id
        )(creditCardAuthorizeActionRepo, mvtkAuthorizeActionRepo, seatReservationAuthorizeActionRepo, transactionRepo);

        assert.deepEqual(result, order);
        sandbox.verify();
    });

    it('確定条件が整っていなければ、Argumentエラーになるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller,
            object: {
                customerContact: {}
            }
        };
        const authorizeActions = [
            {
                id: 'actionId1',
                actionStatus: 'CompletedActionStatus',
                agent: transaction.seller,
                object: {},
                result: {
                    updTmpReserveSeatArgs: {},
                    price: 1234
                },
                endDate: new Date()
            },
            {
                id: 'actionId2',
                actionStatus: 'CompletedActionStatus',
                agent: transaction.agent,
                object: {},
                result: {
                    price: 1235
                },
                endDate: new Date()
            }
        ];

        const creditCardAuthorizeActionRepo = new sskts.repository.action.authorize.CreditCard(sskts.mongoose.connection);
        const mvtkAuthorizeActionRepo = new sskts.repository.action.authorize.Mvtk(sskts.mongoose.connection);
        const seatReservationAuthorizeActionRepo = new sskts.repository.action.authorize.SeatReservation(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findPlaceOrderInProgressById').once()
            .withExactArgs(transaction.id).resolves(transaction);
        sandbox.mock(creditCardAuthorizeActionRepo).expects('findByTransactionId').once()
            .withExactArgs(transaction.id).resolves(authorizeActions);
        sandbox.mock(mvtkAuthorizeActionRepo).expects('findByTransactionId').once()
            .withExactArgs(transaction.id).resolves(authorizeActions);
        sandbox.mock(seatReservationAuthorizeActionRepo).expects('findByTransactionId').once()
            .withExactArgs(transaction.id).resolves(authorizeActions);
        sandbox.mock(sskts.factory.order).expects('createFromPlaceOrderTransaction').never();
        sandbox.mock(sskts.factory.ownershipInfo).expects('create').never();
        sandbox.mock(transactionRepo).expects('confirmPlaceOrder').never();

        const result = await sskts.service.transaction.placeOrderInProgress.confirm(
            agent.id,
            transaction.id
        )(creditCardAuthorizeActionRepo, mvtkAuthorizeActionRepo, seatReservationAuthorizeActionRepo, transactionRepo)
            .catch((err) => err);

        assert(result instanceof sskts.factory.errors.Argument);
        sandbox.verify();
    });

    it('所有者の取引でなければ、Forbiddenエラーが投げられるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: { id: 'anotherAgentId' },
            seller: seller,
            object: {
            }
        };

        const creditCardAuthorizeActionRepo = new sskts.repository.action.authorize.CreditCard(sskts.mongoose.connection);
        const mvtkAuthorizeActionRepo = new sskts.repository.action.authorize.Mvtk(sskts.mongoose.connection);
        const seatReservationAuthorizeActionRepo = new sskts.repository.action.authorize.SeatReservation(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findPlaceOrderInProgressById').once()
            .withExactArgs(transaction.id).resolves(transaction);
        sandbox.mock(creditCardAuthorizeActionRepo).expects('findByTransactionId').never();
        sandbox.mock(mvtkAuthorizeActionRepo).expects('findByTransactionId').never();
        sandbox.mock(seatReservationAuthorizeActionRepo).expects('findByTransactionId').never();
        sandbox.mock(sskts.factory.order).expects('createFromPlaceOrderTransaction').never();
        sandbox.mock(sskts.factory.ownershipInfo).expects('create').never();
        sandbox.mock(transactionRepo).expects('confirmPlaceOrder').never();

        const result = await sskts.service.transaction.placeOrderInProgress.confirm(
            agent.id,
            transaction.id
        )(creditCardAuthorizeActionRepo, mvtkAuthorizeActionRepo, seatReservationAuthorizeActionRepo, transactionRepo)
            .catch((err) => err);

        assert(result instanceof sskts.factory.errors.Forbidden);
        sandbox.verify();
    });
});
