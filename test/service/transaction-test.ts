/**
 * 取引サービステスト
 *
 * @ignore
 */

import * as assert from 'assert';
import * as moment from 'moment';
import * as mongoose from 'mongoose';
import * as redis from 'redis';
import * as sskts from '../../lib/index';

import ArgumentError from '../../lib/error/argument';

import * as ClientUserFactory from '../../lib/factory/clientUser';
import * as EmailNotificationFactory from '../../lib/factory/notification/email';
import * as MemberOwnerFactory from '../../lib/factory/owner/member';
import OwnerGroup from '../../lib/factory/ownerGroup';
import TaskName from '../../lib/factory/taskName';
import * as TransactionFactory from '../../lib/factory/transaction';
import * as AddNotificationTransactionEventFactory from '../../lib/factory/transactionEvent/addNotification';
import * as TransactionInquiryKeyFactory from '../../lib/factory/transactionInquiryKey';
import * as TransactionScopeFactory from '../../lib/factory/transactionScope';
import TransactionStatus from '../../lib/factory/transactionStatus';
import TransactionTasksExportationStatus from '../../lib/factory/transactionTasksExportationStatus';

import TaskAdapter from '../../lib/adapter/task';
import TransactionCountAdapter from '../../lib/adapter/transactionCount';

const TEST_UNIT_OF_COUNT_TRANSACTIONS_IN_SECONDS = 60;
let TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS: any;
let TEST_START_TRANSACTION_AS_MEMBER_ARGS: any;
const TEST_PROMOTER_OWNER = {
    name: {
        ja: '佐々木興業株式会社',
        en: 'Cinema Sunshine Co., Ltd.'
    }
};
let TEST_MEMBER_OWNER: MemberOwnerFactory.IOwner;

let redisClient: redis.RedisClient;
let connection: mongoose.Connection;

before(async () => {
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
    await ownerAdapter.model.remove({ group: OwnerGroup.ANONYMOUS }).exec();
    await transactionAdapter.transactionModel.remove({}).exec();

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

    TEST_MEMBER_OWNER = await MemberOwnerFactory.create({
        username: 'xxx',
        password: 'xxx',
        name_first: 'xxx',
        name_last: 'xxx',
        email: 'noreplay@example.com'
    });
    TEST_START_TRANSACTION_AS_MEMBER_ARGS = { ...TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS, ...{ ownerId: TEST_MEMBER_OWNER.id } };
});

describe('取引サービス 匿名所有者として取引開始する', () => {
    it('開始できる', async () => {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionCountAdapter = new TransactionCountAdapter(redisClient);

        const transactionOption = await sskts.service.transaction.startAsAnonymous(TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS)(
            ownerAdapter, transactionAdapter, transactionCountAdapter
        );

        assert(transactionOption.isDefined);
        assert.equal(transactionOption.get().status, sskts.factory.transactionStatus.UNDERWAY);
        assert.equal(transactionOption.get().expires_at.valueOf(), TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS.expiresAt.valueOf());
        assert.equal(transactionOption.get().tasks_exportation_status, TransactionTasksExportationStatus.Unexported);
    });
});

describe('取引サービス 取引開始する', () => {
    beforeEach(async () => {
        // 興行所有者を準備
        const ownerAdapter = sskts.adapter.owner(connection);
        await ownerAdapter.model.findOneAndUpdate(
            { group: OwnerGroup.PROMOTER },
            TEST_PROMOTER_OWNER,
            { upsert: true }
        ).exec();

        // テスト会員削除
        await ownerAdapter.model.findByIdAndRemove(TEST_MEMBER_OWNER.id).exec();
    });

    it('取引数制限を越えているため開始できない', async () => {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionCountAdapter = new TransactionCountAdapter(redisClient);

        const args = { ...TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS, ...{ maxCountPerUnit: 0 } };
        const transactionOption = await sskts.service.transaction.start(args)(
            ownerAdapter, transactionAdapter, transactionCountAdapter
        );
        assert(transactionOption.isEmpty);
    });

    it('興行所有者が存在しなければ開始できない', async () => {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionCountAdapter = new TransactionCountAdapter(redisClient);

        await ownerAdapter.model.remove({ group: OwnerGroup.PROMOTER }).exec();

        const startError = await sskts.service.transaction.start(TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS)(
            ownerAdapter, transactionAdapter, transactionCountAdapter
        ).catch((error) => {
            return error;
        });
        assert(startError instanceof Error);
    });

    it('匿名所有者として開始できる', async () => {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionCountAdapter = new TransactionCountAdapter(redisClient);

        const transactionOption = await sskts.service.transaction.start(TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS)(
            ownerAdapter, transactionAdapter, transactionCountAdapter
        );

        assert(transactionOption.isDefined);
        assert.equal(transactionOption.get().status, sskts.factory.transactionStatus.UNDERWAY);
        assert.equal(transactionOption.get().expires_at.valueOf(), TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS.expiresAt.valueOf());
        assert.equal(transactionOption.get().tasks_exportation_status, TransactionTasksExportationStatus.Unexported);
    });

    it('会員が存在しなければ開始できない', async () => {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionCountAdapter = new TransactionCountAdapter(redisClient);

        // 会員は存在しないのでエラーになるはず
        const startError = await sskts.service.transaction.start(TEST_START_TRANSACTION_AS_MEMBER_ARGS)(
            ownerAdapter, transactionAdapter, transactionCountAdapter
        ).catch((error) => error);
        assert(startError instanceof ArgumentError);
        console.error(startError);
        console.error(startError.name);
        assert.equal((<ArgumentError>startError).argumentName, 'ownerId');
    });

    it('会員として開始できる', async () => {
        const ownerAdapter = sskts.adapter.owner(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const transactionCountAdapter = new TransactionCountAdapter(redisClient);

        // テスト会員作成
        await ownerAdapter.model.findByIdAndUpdate(TEST_MEMBER_OWNER.id, TEST_MEMBER_OWNER, { upsert: true }).exec();

        // 取引を開始できて、ステータスや所有者が正しいことを確認
        const transactionOption = await sskts.service.transaction.start(TEST_START_TRANSACTION_AS_MEMBER_ARGS)(
            ownerAdapter, transactionAdapter, transactionCountAdapter
        );

        assert(transactionOption.isDefined);
        const transaction = transactionOption.get();
        assert.equal(transaction.status, sskts.factory.transactionStatus.UNDERWAY);
        assert.equal(transaction.expires_at.valueOf(), TEST_START_TRANSACTION_AS_ANONYMOUS_ARGS.expiresAt.valueOf());
        assert.equal(transaction.tasks_exportation_status, TransactionTasksExportationStatus.Unexported);
        const memberOwnerInTransaction = transaction.owners.find((owner) => owner.group === OwnerGroup.MEMBER);
        assert.notEqual(memberOwnerInTransaction, null);
        assert.equal((<MemberOwnerFactory.IOwner>memberOwnerInTransaction).id, TEST_MEMBER_OWNER.id);

        // テスト会員削除
        await ownerAdapter.model.findByIdAndRemove(TEST_MEMBER_OWNER.id).exec();
    });
});

describe('取引サービス 再エクスポート', () => {
    it('ok', async () => {
        const transactionAdapter = sskts.adapter.transaction(connection);

        // test data
        const transaction = TransactionFactory.create({
            status: TransactionStatus.CLOSED,
            owners: [],
            expires_at: new Date(),
            inquiry_key: TransactionInquiryKeyFactory.create({
                theater_code: '000',
                reserve_num: 123,
                tel: '09012345678'
            }),
            tasks_exportation_status: TransactionTasksExportationStatus.Exporting
        });
        await transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, { new: true, upsert: true }).exec();

        await sskts.service.transaction.reexportTasks(0)(transactionAdapter); // tslint:disable-line:no-magic-numbers

        // ステータスが変更されているかどうか確認
        const retriedTransaction = <mongoose.Document>await transactionAdapter.transactionModel.findById(transaction.id).exec();
        assert.equal(retriedTransaction.get('tasks_exportation_status'), TransactionTasksExportationStatus.Unexported);

        // テストデータ削除
        await retriedTransaction.remove();
    });
});

describe('取引サービス タスクエクスポート', () => {
    it('ok.', async () => {
        const taskAdapter = new TaskAdapter(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const status = TransactionStatus.CLOSED;

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
            tasks_exportation_status: TransactionTasksExportationStatus.Unexported
        });
        await transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, {
            new: true, upsert: true,
            setDefaultsOnInsert: false
        }).exec();

        await sskts.service.transaction.exportTasks(status)(taskAdapter, transactionAdapter);

        // 取引のタスクエクスポートステータスを確認
        const transactionDoc = <mongoose.Document>await transactionAdapter.transactionModel.findById(transaction.id).exec();
        assert.equal(transactionDoc.get('tasks_exportation_status'), TransactionTasksExportationStatus.Exported);

        // テストデータ削除
        await transactionDoc.remove();
    });

    it('ステータスが不適切なので失敗', async () => {
        const taskAdapter = new TaskAdapter(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);
        const status = TransactionStatus.UNDERWAY;

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
            tasks_exportation_status: TransactionTasksExportationStatus.Unexported
        });
        await transactionAdapter.transactionModel.findByIdAndUpdate(transaction.id, transaction, { new: true, upsert: true }).exec();

        const exportTasksError = await sskts.service.transaction.exportTasks(status)(taskAdapter, transactionAdapter)
            .catch((error) => error);
        assert(exportTasksError instanceof Error);

        await transactionAdapter.transactionModel.findByIdAndRemove(transaction.id).exec();
    });
});

describe('取引サービス 取引IDからタスク出力する', () => {
    it('成立取引の出力成功', async () => {
        const taskAdapter = new TaskAdapter(connection);
        const transactionAdapter = sskts.adapter.transaction(connection);

        // test data
        const transaction = TransactionFactory.create({
            status: TransactionStatus.CLOSED,
            owners: [],
            expires_at: new Date(),
            inquiry_key: TransactionInquiryKeyFactory.create({
                theater_code: '000',
                reserve_num: 123,
                tel: '09012345678'
            }),
            tasks_exportation_status: TransactionTasksExportationStatus.Unexported
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

        const transactionDoc = <mongoose.Document>await transactionAdapter.transactionModel.findByIdAndUpdate(
            transaction.id, transaction, { new: true, upsert: true }
        ).exec();
        await transactionAdapter.addEvent(event);

        await sskts.service.transaction.exportTasksById(transaction.id)(taskAdapter, transactionAdapter);
        const taskDoc4pushNotification = <mongoose.Document>await taskAdapter.taskModel.findOne(
            {
                name: TaskName.SendEmailNotification,
                'data.notification.id': event.notification.id
            }
        ).exec();

        assert.notEqual(taskDoc4pushNotification, null);

        await transactionDoc.remove();
        await transactionAdapter.transactionEventModel.remove({ transaction: transaction.id }).exec();
        await taskDoc4pushNotification.remove();
    });
});
