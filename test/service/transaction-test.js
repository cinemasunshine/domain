"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 取引サービステスト
 *
 * @ignore
 */
const assert = require("assert");
const moment = require("moment");
const mongoose = require("mongoose");
const sskts = require("../../lib/index");
const emailNotificationFactory = require("../../lib/factory/notification/email");
const transactionFactory = require("../../lib/factory/transaction");
const AddNotificationTransactionEventFactory = require("../../lib/factory/transactionEvent/addNotification");
const transactionInquiryKey = require("../../lib/factory/transactionInquiryKey");
const transactionQueuesStatus_1 = require("../../lib/factory/transactionQueuesStatus");
const transactionStatus_1 = require("../../lib/factory/transactionStatus");
let connection;
before(() => __awaiter(this, void 0, void 0, function* () {
    connection = mongoose.createConnection(process.env.MONGOLAB_URI);
    // 全て削除してからテスト開始
    const transactionAdapter = sskts.adapter.transaction(connection);
    yield transactionAdapter.transactionModel.remove({}).exec();
}));
describe('transaction service', () => {
    it('startIfPossible fail', (done) => {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const expiresAt = moment().add(30, 'minutes').toDate(); // tslint:disable-line:no-magic-numbers
        sskts.service.transaction.startIfPossible(expiresAt)(ownerAdapter, transactionAdapter)
            .then((transactionOption) => {
            assert(transactionOption.isEmpty);
            done();
        })
            .catch((err) => {
            done(err);
        });
    });
    it('exportQueues ok.', () => __awaiter(this, void 0, void 0, function* () {
        const queueAdapter = sskts.adapter.queue(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const status = transactionStatus_1.default.CLOSED;
        // test data
        const transaction = transactionFactory.create({
            status: status,
            owners: [],
            expires_at: new Date(),
            inquiry_key: transactionInquiryKey.create({
                theater_code: '000',
                reserve_num: 123,
                tel: '09012345678'
            }),
            queues_status: transactionQueuesStatus_1.default.UNEXPORTED
        });
        yield transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, { new: true, upsert: true }).exec();
        const queueStatus = yield sskts.service.transaction.exportQueues(status)(queueAdapter, transactionAdapter);
        assert.equal(queueStatus, transactionQueuesStatus_1.default.EXPORTED);
    }));
    it('exportQueues prohibited status.', () => __awaiter(this, void 0, void 0, function* () {
        const queueAdapter = sskts.adapter.queue(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const status = transactionStatus_1.default.UNDERWAY;
        // test data
        const transaction = transactionFactory.create({
            status: status,
            owners: [],
            expires_at: new Date(),
            inquiry_key: transactionInquiryKey.create({
                theater_code: '000',
                reserve_num: 123,
                tel: '09012345678'
            }),
            queues_status: transactionQueuesStatus_1.default.UNEXPORTED
        });
        yield transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, { new: true, upsert: true }).exec();
        let exportQueues;
        try {
            yield sskts.service.transaction.exportQueues(status)(queueAdapter, transactionAdapter);
        }
        catch (error) {
            exportQueues = error;
        }
        assert(exportQueues instanceof RangeError);
        yield transactionAdapter.transactionModel.findByIdAndRemove(transaction.id).exec();
    }));
    it('exportQueuesById ok.', () => __awaiter(this, void 0, void 0, function* () {
        const queueAdapter = sskts.adapter.queue(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        // test data
        const transaction = transactionFactory.create({
            status: transactionStatus_1.default.CLOSED,
            owners: [],
            expires_at: new Date(),
            inquiry_key: transactionInquiryKey.create({
                theater_code: '000',
                reserve_num: 123,
                tel: '09012345678'
            }),
            queues_status: transactionQueuesStatus_1.default.UNEXPORTED
        });
        const event = AddNotificationTransactionEventFactory.create({
            transaction: transaction.id,
            occurred_at: new Date(),
            notification: emailNotificationFactory.create({
                from: 'noreply@localhost',
                to: 'hello',
                subject: 'sskts-domain:test:service:transaction-test',
                content: 'sskts-domain:test:service:transaction-test'
            })
        });
        // todo オーソリイベントもテストデータに追加する
        yield transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, { new: true, upsert: true }).exec();
        yield transactionAdapter.addEvent(event);
        const queueIds = yield sskts.service.transaction.exportQueuesById(transaction.id)(queueAdapter, transactionAdapter);
        const numberOfQueues = yield queueAdapter.model.count({ _id: { $in: queueIds } }).exec();
        assert.equal(numberOfQueues, queueIds.length);
    }));
    it('reexportQueues ok.', () => __awaiter(this, void 0, void 0, function* () {
        const transactionAdapter = sskts.adapter.transaction(connection);
        // test data
        const transaction = transactionFactory.create({
            status: transactionStatus_1.default.CLOSED,
            owners: [],
            expires_at: new Date(),
            inquiry_key: transactionInquiryKey.create({
                theater_code: '000',
                reserve_num: 123,
                tel: '09012345678'
            }),
            queues_status: transactionQueuesStatus_1.default.EXPORTING
        });
        yield transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, { new: true, upsert: true }).exec();
        yield sskts.service.transaction.reexportQueues(0)(transactionAdapter); // tslint:disable-line:no-magic-numbers
        // ステータスが変更されているかどうか確認
        const retriedTransaction = yield transactionAdapter.transactionModel.findById(transaction.id).exec();
        assert.equal(retriedTransaction.get('queues_status'), transactionQueuesStatus_1.default.UNEXPORTED);
    }));
    it('prepare ok', (done) => {
        sskts.service.transaction.prepare(3, 60)(sskts.adapter.transaction(connection)) // tslint:disable-line:no-magic-numbers
            .then(() => {
            done();
        })
            .catch((err) => {
            done(err);
        });
    });
    it('makeExpired ok', (done) => {
        const transactionAdapter = sskts.adapter.transaction(connection);
        // 期限切れの取引を作成
        sskts.service.transaction.prepare(3, -60)(transactionAdapter) // tslint:disable-line:no-magic-numbers
            .then(() => {
            sskts.service.transaction.makeExpired()(transactionAdapter)
                .then(() => {
                done();
            })
                .catch((err) => {
                done(err);
            });
        })
            .catch((err) => {
            done(err);
        });
    });
    it('startIfPossible ok', (done) => {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        sskts.service.transaction.prepare(1, 60)(transactionAdapter) // tslint:disable-line:no-magic-numbers
            .then(() => {
            const expiresAt = moment().add(30, 'minutes').toDate(); // tslint:disable-line:no-magic-numbers
            sskts.service.transaction.startIfPossible(expiresAt)(ownerAdapter, transactionAdapter)
                .then((transactionOption) => {
                assert(transactionOption.isDefined);
                assert.equal(transactionOption.get().status, sskts.factory.transactionStatus.UNDERWAY);
                assert.equal(transactionOption.get().expires_at.valueOf(), expiresAt.valueOf());
                done();
            })
                .catch((err) => {
                done(err);
            });
        })
            .catch((err) => {
            done(err);
        });
    });
    it('startForcibly ok', (done) => {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const expiresAt = moment().add(30, 'minutes').toDate(); // tslint:disable-line:no-magic-numbers
        sskts.service.transaction.startForcibly(expiresAt)(ownerAdapter, transactionAdapter)
            .then((transaction) => {
            assert.equal(transaction.expires_at.valueOf(), expiresAt.valueOf());
            done();
        })
            .catch((err) => {
            done(err);
        });
    });
    it('clean should be removed', () => __awaiter(this, void 0, void 0, function* () {
        // test data
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionIds = [];
        const promises = Array.from(Array(3).keys()).map(() => __awaiter(this, void 0, void 0, function* () {
            const transaction = transactionFactory.create({
                status: transactionStatus_1.default.READY,
                owners: [],
                expires_at: moment().add(0, 'seconds').toDate()
            });
            yield transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, { new: true, upsert: true }).exec();
            transactionIds.push(transaction.id);
        }));
        yield Promise.all(promises);
        yield sskts.service.transaction.clean()(sskts.adapter.transaction(connection));
        const nubmerOfTransaction = yield transactionAdapter.transactionModel.find({ _id: { $in: transactionIds } }).count().exec();
        assert.equal(nubmerOfTransaction, 0);
    }));
    it('clean should not be removed', () => __awaiter(this, void 0, void 0, function* () {
        // test data
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionIds = [];
        const promises = Array.from(Array(3).keys()).map(() => __awaiter(this, void 0, void 0, function* () {
            const transaction = transactionFactory.create({
                status: transactionStatus_1.default.READY,
                owners: [],
                expires_at: moment().add(60, 'seconds').toDate() // tslint:disable-line:no-magic-numbers
            });
            yield transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, { new: true, upsert: true }).exec();
            transactionIds.push(transaction.id);
        }));
        yield Promise.all(promises);
        yield sskts.service.transaction.clean()(sskts.adapter.transaction(connection));
        const nubmerOfTransaction = yield transactionAdapter.transactionModel.find({ _id: { $in: transactionIds } }).count().exec();
        assert.equal(nubmerOfTransaction, 3); // tslint:disable-line:no-magic-numbers
    }));
});
