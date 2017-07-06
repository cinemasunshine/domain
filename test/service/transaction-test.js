"use strict";
/**
 * 取引サービステスト
 *
 * @ignore
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const moment = require("moment");
const mongoose = require("mongoose");
const redis = require("redis");
const sskts = require("../../lib/index");
const argument_1 = require("../../lib/error/argument");
const ClientUserFactory = require("../../lib/factory/clientUser");
const EmailNotificationFactory = require("../../lib/factory/notification/email");
const MemberOwnerFactory = require("../../lib/factory/owner/member");
const ownerGroup_1 = require("../../lib/factory/ownerGroup");
const taskName_1 = require("../../lib/factory/taskName");
const TransactionFactory = require("../../lib/factory/transaction");
const AddNotificationTransactionEventFactory = require("../../lib/factory/transactionEvent/addNotification");
const TransactionInquiryKeyFactory = require("../../lib/factory/transactionInquiryKey");
const TransactionScopeFactory = require("../../lib/factory/transactionScope");
const transactionStatus_1 = require("../../lib/factory/transactionStatus");
const transactionTasksExportationStatus_1 = require("../../lib/factory/transactionTasksExportationStatus");
const task_1 = require("../../lib/adapter/task");
const transactionCount_1 = require("../../lib/adapter/transactionCount");
const TEST_UNIT_OF_COUNT_TRANSACTIONS_IN_SECONDS = 60;
let TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS;
let TEST_START_TRANSACTION_AS_MEMBER_ARGS;
const TEST_PROMOTER_OWNER = {
    name: {
        ja: '佐々木興業株式会社',
        en: 'Cinema Sunshine Co., Ltd.'
    }
};
let TEST_MEMBER_OWNER;
let redisClient;
let connection;
before(() => __awaiter(this, void 0, void 0, function* () {
    if (typeof process.env.TEST_REDIS_HOST !== 'string') {
        throw new Error('environment variable TEST_REDIS_HOST required');
    }
    if (typeof process.env.TEST_REDIS_PORT !== 'string') {
        throw new Error('environment variable TEST_REDIS_PORT required');
    }
    if (typeof process.env.TEST_REDIS_KEY !== 'string') {
        throw new Error('environment variable TEST_REDIS_KEY required');
    }
    redisClient = redis.createClient({
        host: process.env.TEST_REDIS_HOST,
        port: process.env.TEST_REDIS_PORT,
        password: process.env.TEST_REDIS_KEY,
        tls: { servername: process.env.TEST_REDIS_HOST }
    });
    connection = mongoose.createConnection(process.env.MONGOLAB_URI);
    // 全て削除してからテスト開始
    const ownerAdapter = sskts.adapter.owner(connection);
    const transactionAdapter = sskts.adapter.transaction(connection);
    yield ownerAdapter.model.remove({ group: ownerGroup_1.default.ANONYMOUS }).exec();
    yield transactionAdapter.transactionModel.remove({}).exec();
    // tslint:disable-next-line:no-magic-numbers
    const expiresAt = moment().add(30, 'minutes').toDate();
    const dateNow = moment();
    const readyFrom = moment.unix(dateNow.unix() - dateNow.unix() % TEST_UNIT_OF_COUNT_TRANSACTIONS_IN_SECONDS);
    const readyUntil = moment(readyFrom).add(TEST_UNIT_OF_COUNT_TRANSACTIONS_IN_SECONDS, 'seconds');
    const scope = TransactionScopeFactory.create({
        ready_from: readyFrom.toDate(),
        ready_until: readyUntil.toDate()
    });
    const clientUser = ClientUserFactory.create({
        client: 'xxx',
        state: 'xxx',
        scopes: ['xxx']
    });
    TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS = {
        expiresAt: expiresAt,
        maxCountPerUnit: 999,
        clientUser: clientUser,
        scope: scope
    };
    TEST_MEMBER_OWNER = yield MemberOwnerFactory.create({
        username: 'xxx',
        password: 'xxx',
        name_first: 'xxx',
        name_last: 'xxx',
        email: 'noreplay@example.com'
    });
    TEST_START_TRANSACTION_AS_MEMBER_ARGS = Object.assign({}, TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS, { ownerId: TEST_MEMBER_OWNER.id });
}));
describe('取引サービス 匿名所有者として取引開始する', () => {
    it('開始できる', () => __awaiter(this, void 0, void 0, function* () {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionCountAdapter = new transactionCount_1.default(redisClient);
        const transactionOption = yield sskts.service.transaction.startAsAnonymous(TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS)(ownerAdapter, transactionAdapter, transactionCountAdapter);
        assert(transactionOption.isDefined);
        assert.equal(transactionOption.get().status, sskts.factory.transactionStatus.UNDERWAY);
        assert.equal(transactionOption.get().expires_at.valueOf(), TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS.expiresAt.valueOf());
        assert.equal(transactionOption.get().tasks_exportation_status, transactionTasksExportationStatus_1.default.Unexported);
    }));
});
describe('取引サービス 取引開始する', () => {
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        // 興行所有者を準備
        const ownerAdapter = sskts.adapter.owner(connection);
        yield ownerAdapter.model.findOneAndUpdate({ group: ownerGroup_1.default.PROMOTER }, TEST_PROMOTER_OWNER, { upsert: true }).exec();
        // テスト会員削除
        yield ownerAdapter.model.findByIdAndRemove(TEST_MEMBER_OWNER.id).exec();
    }));
    it('取引数制限を越えているため開始できない', () => __awaiter(this, void 0, void 0, function* () {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionCountAdapter = new transactionCount_1.default(redisClient);
        const args = Object.assign({}, TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS, { maxCountPerUnit: 0 });
        const transactionOption = yield sskts.service.transaction.start(args)(ownerAdapter, transactionAdapter, transactionCountAdapter);
        assert(transactionOption.isEmpty);
    }));
    it('興行所有者が存在しなければ開始できない', () => __awaiter(this, void 0, void 0, function* () {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionCountAdapter = new transactionCount_1.default(redisClient);
        yield ownerAdapter.model.remove({ group: ownerGroup_1.default.PROMOTER }).exec();
        const startError = yield sskts.service.transaction.start(TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS)(ownerAdapter, transactionAdapter, transactionCountAdapter).catch((error) => {
            return error;
        });
        assert(startError instanceof Error);
    }));
    it('匿名所有者として開始できる', () => __awaiter(this, void 0, void 0, function* () {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionCountAdapter = new transactionCount_1.default(redisClient);
        const transactionOption = yield sskts.service.transaction.start(TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS)(ownerAdapter, transactionAdapter, transactionCountAdapter);
        assert(transactionOption.isDefined);
        assert.equal(transactionOption.get().status, sskts.factory.transactionStatus.UNDERWAY);
        assert.equal(transactionOption.get().expires_at.valueOf(), TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS.expiresAt.valueOf());
        assert.equal(transactionOption.get().tasks_exportation_status, transactionTasksExportationStatus_1.default.Unexported);
    }));
    it('会員が存在しなければ開始できない', () => __awaiter(this, void 0, void 0, function* () {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionCountAdapter = new transactionCount_1.default(redisClient);
        // 会員は存在しないのでエラーになるはず
        const startError = yield sskts.service.transaction.start(TEST_START_TRANSACTION_AS_MEMBER_ARGS)(ownerAdapter, transactionAdapter, transactionCountAdapter).catch((error) => error);
        assert(startError instanceof argument_1.default);
        console.error(startError);
        console.error(startError.name);
        assert.equal(startError.argumentName, 'ownerId');
    }));
    it('会員として開始できる', () => __awaiter(this, void 0, void 0, function* () {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionCountAdapter = new transactionCount_1.default(redisClient);
        // テスト会員作成
        yield ownerAdapter.model.findByIdAndUpdate(TEST_MEMBER_OWNER.id, TEST_MEMBER_OWNER, { upsert: true }).exec();
        // 取引を開始できて、ステータスや所有者が正しいことを確認
        const transactionOption = yield sskts.service.transaction.start(TEST_START_TRANSACTION_AS_MEMBER_ARGS)(ownerAdapter, transactionAdapter, transactionCountAdapter);
        assert(transactionOption.isDefined);
        const transaction = transactionOption.get();
        assert.equal(transaction.status, sskts.factory.transactionStatus.UNDERWAY);
        assert.equal(transaction.expires_at.valueOf(), TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS.expiresAt.valueOf());
        assert.equal(transaction.tasks_exportation_status, transactionTasksExportationStatus_1.default.Unexported);
        const memberOwnerInTransaction = transaction.owners.find((owner) => owner.group === ownerGroup_1.default.MEMBER);
        assert.notEqual(memberOwnerInTransaction, null);
        assert.equal(memberOwnerInTransaction.id, TEST_MEMBER_OWNER.id);
        // テスト会員削除
        yield ownerAdapter.model.findByIdAndRemove(TEST_MEMBER_OWNER.id).exec();
    }));
});
describe('取引サービス 再エクスポート', () => {
    it('ok', () => __awaiter(this, void 0, void 0, function* () {
        const transactionAdapter = sskts.adapter.transaction(connection);
        // test data
        const transaction = TransactionFactory.create({
            status: transactionStatus_1.default.CLOSED,
            owners: [],
            expires_at: new Date(),
            inquiry_key: TransactionInquiryKeyFactory.create({
                theater_code: '000',
                reserve_num: 123,
                tel: '09012345678'
            }),
            tasks_exportation_status: transactionTasksExportationStatus_1.default.Exporting
        });
        yield transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, { new: true, upsert: true }).exec();
        yield sskts.service.transaction.reexportTasks(0)(transactionAdapter); // tslint:disable-line:no-magic-numbers
        // ステータスが変更されているかどうか確認
        const retriedTransaction = yield transactionAdapter.transactionModel.findById(transaction.id).exec();
        assert.equal(retriedTransaction.get('tasks_exportation_status'), transactionTasksExportationStatus_1.default.Unexported);
        // テストデータ削除
        yield retriedTransaction.remove();
    }));
});
describe('取引サービス タスクエクスポート', () => {
    it('ok.', () => __awaiter(this, void 0, void 0, function* () {
        const taskAdapter = new task_1.default(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const status = transactionStatus_1.default.CLOSED;
        // test data
        const transaction = TransactionFactory.create({
            status: status,
            owners: [],
            expires_at: new Date(),
            inquiry_key: TransactionInquiryKeyFactory.create({
                theater_code: '000',
                reserve_num: 123,
                tel: '09012345678'
            }),
            tasks_exportation_status: transactionTasksExportationStatus_1.default.Unexported
        });
        yield transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, {
            new: true, upsert: true,
            setDefaultsOnInsert: false
        }).exec();
        yield sskts.service.transaction.exportTasks(status)(taskAdapter, transactionAdapter);
        // 取引のタスクエクスポートステータスを確認
        const transactionDoc = yield transactionAdapter.transactionModel.findById(transaction.id).exec();
        assert.equal(transactionDoc.get('tasks_exportation_status'), transactionTasksExportationStatus_1.default.Exported);
        // テストデータ削除
        yield transactionDoc.remove();
    }));
    it('ステータスが不適切なので失敗', () => __awaiter(this, void 0, void 0, function* () {
        const taskAdapter = new task_1.default(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const status = transactionStatus_1.default.UNDERWAY;
        // test data
        const transaction = TransactionFactory.create({
            status: status,
            owners: [],
            expires_at: new Date(),
            inquiry_key: TransactionInquiryKeyFactory.create({
                theater_code: '000',
                reserve_num: 123,
                tel: '09012345678'
            }),
            tasks_exportation_status: transactionTasksExportationStatus_1.default.Unexported
        });
        yield transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, { new: true, upsert: true }).exec();
        const exportTasksError = yield sskts.service.transaction.exportTasks(status)(taskAdapter, transactionAdapter)
            .catch((error) => error);
        assert(exportTasksError instanceof Error);
        yield transactionAdapter.transactionModel.findByIdAndRemove(transaction.id).exec();
    }));
});
describe('取引サービス 取引IDからタスク出力する', () => {
    it('成立取引の出力成功', () => __awaiter(this, void 0, void 0, function* () {
        const taskAdapter = new task_1.default(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        // test data
        const transaction = TransactionFactory.create({
            status: transactionStatus_1.default.CLOSED,
            owners: [],
            expires_at: new Date(),
            inquiry_key: TransactionInquiryKeyFactory.create({
                theater_code: '000',
                reserve_num: 123,
                tel: '09012345678'
            }),
            tasks_exportation_status: transactionTasksExportationStatus_1.default.Unexported
        });
        const event = AddNotificationTransactionEventFactory.create({
            transaction: transaction.id,
            occurred_at: new Date(),
            notification: EmailNotificationFactory.create({
                from: 'noreply@example.net',
                to: process.env.SSKTS_DEVELOPER_EMAIL,
                subject: 'sskts-domain:test:service:transaction-test',
                content: 'sskts-domain:test:service:transaction-test'
            })
        });
        const transactionDoc = yield transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, { new: true, upsert: true }).exec();
        yield transactionAdapter.addEvent(event);
        yield sskts.service.transaction.exportTasksById(transaction.id)(taskAdapter, transactionAdapter);
        const taskDoc4pushNotification = yield taskAdapter.taskModel.findOne({
            name: taskName_1.default.SendEmailNotification,
            'data.notification.id': event.notification.id
        }).exec();
        assert.notEqual(taskDoc4pushNotification, null);
        yield transactionDoc.remove();
        yield transactionAdapter.transactionEventModel.remove({ transaction: transaction.id }).exec();
        yield taskDoc4pushNotification.remove();
    }));
});
