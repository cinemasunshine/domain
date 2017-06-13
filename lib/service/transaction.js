"use strict";
/**
 * 取引サービス
 * 取引一般に対する処理はここで定義する
 * 特定の取引(ID指定)に対する処理はtransactionWithIdサービスで定義
 *
 * @namespace service/transaction
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
const createDebug = require("debug");
const moment = require("moment");
const monapt = require("monapt");
const _ = require("underscore");
const argument_1 = require("../error/argument");
const AnonymousOwnerFactory = require("../factory/owner/anonymous");
const ownerGroup_1 = require("../factory/ownerGroup");
const CancelAuthorizationQueueFactory = require("../factory/queue/cancelAuthorization");
const DisableTransactionInquiryQueueFactory = require("../factory/queue/disableTransactionInquiry");
const PushNotificationQueueFactory = require("../factory/queue/pushNotification");
const SettleAuthorizationQueueFactory = require("../factory/queue/settleAuthorization");
const queueStatus_1 = require("../factory/queueStatus");
const TransactionFactory = require("../factory/transaction");
const transactionQueuesStatus_1 = require("../factory/transactionQueuesStatus");
const TransactionScopeFactory = require("../factory/transactionScope");
const transactionStatus_1 = require("../factory/transactionStatus");
const transactionCount_1 = require("../adapter/transactionCount");
const debug = createDebug('sskts-domain:service:transaction');
/**
 * スコープ指定で取引が利用可能かどうかを取得する
 *
 * @param {string} scope 取引のスコープ
 * @param {number} unitOfCountInSeconds 取引数カウント単位時間(秒)
 * @param {number} maxCountPerUnit カウント単位あたりの取引最大数
 */
function isAvailable(scope, unitOfCountInSeconds, maxCountPerUnit) {
    return (transactionCountAdapter) => __awaiter(this, void 0, void 0, function* () {
        const scopeStr = TransactionScopeFactory.scope2String(scope);
        const dateNow = moment();
        const unitStr = (dateNow.unix() - dateNow.unix() % unitOfCountInSeconds).toString();
        const redisKey = `${transactionCount_1.default.KEY_PREFIX}:${scopeStr}:${unitStr}`;
        const ttl = unitOfCountInSeconds;
        return new Promise((resolve, reject) => {
            // redisでカウントアップ
            const multi = transactionCountAdapter.redisClient.multi();
            multi.incr(redisKey, debug)
                .expire(redisKey, ttl, debug)
                .exec((err, replies) => __awaiter(this, void 0, void 0, function* () {
                if (err instanceof Error) {
                    reject(err);
                    return;
                }
                debug('replies:', replies);
                // カウント単位あたりの取引最大数を超過しているかどうか
                // tslint:disable-next-line:no-magic-numbers
                const numberOfTransactions = parseInt(replies[0], 10);
                resolve((numberOfTransactions <= maxCountPerUnit));
            }));
        });
    });
}
exports.isAvailable = isAvailable;
/**
 * 開始準備のできた取引を用意する
 *
 * @param {number} length 取引数
 * @param {number} expiresInSeconds 現在から何秒後に期限切れにするか
 * @memberof service/transaction
 */
function prepare(length, expiresInSeconds) {
    return (transactionAdapter) => __awaiter(this, void 0, void 0, function* () {
        // 取引を{length}コ作成
        const expiresAt = moment().add(expiresInSeconds, 'seconds').toDate();
        const transactions = Array.from(Array(length).keys()).map(() => {
            const transaction = TransactionFactory.create({
                status: transactionStatus_1.default.READY,
                owners: [],
                expires_at: expiresAt
            });
            transaction._id = transaction.id;
            return transaction;
        });
        // 永続化
        debug('creating transactions...', transactions);
        yield transactionAdapter.transactionModel.create(transactions);
    });
}
exports.prepare = prepare;
/**
 * 匿名所有者として取引開始する
 *
 * @param {Date} args.expiresAt 期限切れ予定日時
 * @param {number} args.unitOfCountInSeconds 取引数制限単位期間
 * @param {number} args.maxCountPerUnit 単位期間あたりの最大取引数
 * @returns {OwnerAndTransactionAndTransactionCountOperation<monapt.Option<TransactionFactory.ITransaction>>}
 *
 * @memberof service/transaction
 */
function startAsAnonymous(args) {
    return (ownerAdapter, transactionAdapter, transactionCountAdapter) => __awaiter(this, void 0, void 0, function* () {
        // 利用可能かどうか
        const available = yield isAvailable(args.scope, args.unitOfCountInSeconds, args.maxCountPerUnit)(transactionCountAdapter);
        if (!available) {
            return monapt.None;
        }
        // 利用可能であれば、取引作成&匿名所有者作成
        // 一般所有者作成(後で取引の所有者が適切かどうかを確認するために、状態を持たせる)
        const anonymousOwner = AnonymousOwnerFactory.create({
            state: args.state
        });
        // 興行主取得
        const promoterOwnerDoc = yield ownerAdapter.model.findOne({ group: ownerGroup_1.default.PROMOTER }).exec();
        if (promoterOwnerDoc === null) {
            throw new Error('promoter not found');
        }
        const promoter = promoterOwnerDoc.toObject();
        // 取引ファクトリーで新しい進行中取引オブジェクトを作成
        const newTransaction = TransactionFactory.create({
            status: transactionStatus_1.default.UNDERWAY,
            owners: [promoter, anonymousOwner],
            expires_at: args.expiresAt,
            started_at: moment().toDate()
        });
        // 所有者永続化
        // createコマンドで作成すること(ありえないはずだが、万が一所有者IDが重複するようなバグがあっても、ユニークインデックスではじかれる)
        debug('creating anonymous owner...', anonymousOwner);
        const anonymousOwnerDoc = Object.assign({}, anonymousOwner, { _id: anonymousOwner.id });
        yield ownerAdapter.model.create(anonymousOwnerDoc);
        debug('creating transaction...');
        // mongoDBに追加するために_idとowners属性を拡張
        const newTransactionDoc = Object.assign({}, newTransaction, { _id: newTransaction.id, owners: [promoter.id, anonymousOwner.id] });
        yield transactionAdapter.transactionModel.create(newTransactionDoc);
        return monapt.Option(newTransaction);
    });
}
exports.startAsAnonymous = startAsAnonymous;
/**
 * 照会する
 *
 * @param {TransactionInquiryKey} key
 * @returns {TransactionOperation<void>}
 *
 * @memberof service/transaction
 */
function makeInquiry(key) {
    debug('finding a transaction...', key);
    return (transactionAdapter) => __awaiter(this, void 0, void 0, function* () {
        const doc = yield transactionAdapter.transactionModel.findOne({
            'inquiry_key.theater_code': key.theater_code,
            'inquiry_key.reserve_num': key.reserve_num,
            'inquiry_key.tel': key.tel,
            status: transactionStatus_1.default.CLOSED
        }).populate('owners').exec();
        return (doc === null) ? monapt.None : monapt.Option(doc.toObject());
    });
}
exports.makeInquiry = makeInquiry;
/**
 * 不要な取引を削除する
 * @memberof service/transaction
 */
function clean() {
    return (transactionAdapter) => __awaiter(this, void 0, void 0, function* () {
        // 開始準備ステータスのまま期限切れの取引を削除する
        yield transactionAdapter.transactionModel.remove({
            status: transactionStatus_1.default.READY,
            expires_at: { $lt: new Date() }
        }).exec();
    });
}
exports.clean = clean;
/**
 * 取引を期限切れにする
 * @memberof service/transaction
 */
function makeExpired() {
    return (transactionAdapter) => __awaiter(this, void 0, void 0, function* () {
        const expiredAt = moment().toDate();
        // ステータスと期限を見て更新
        yield transactionAdapter.transactionModel.update({
            status: transactionStatus_1.default.UNDERWAY,
            expires_at: { $lt: expiredAt }
        }, {
            status: transactionStatus_1.default.EXPIRED,
            expired_at: expiredAt
        }, { multi: true }).exec();
    });
}
exports.makeExpired = makeExpired;
/**
 * ひとつの取引のキューをエクスポートする
 *
 * @param {TransactionStatus} statu 取引ステータス
 * @memberof service/transaction
 */
function exportQueues(status) {
    return (queueAdapter, transactionAdapter) => __awaiter(this, void 0, void 0, function* () {
        const statusesQueueExportable = [transactionStatus_1.default.EXPIRED, transactionStatus_1.default.CLOSED];
        if (statusesQueueExportable.indexOf(status) < 0) {
            throw new argument_1.default('status', `transaction status should be in [${statusesQueueExportable.join(',')}]`);
        }
        let transactionDoc = yield transactionAdapter.transactionModel.findOneAndUpdate({
            status: status,
            queues_status: transactionQueuesStatus_1.default.UNEXPORTED
        }, { queues_status: transactionQueuesStatus_1.default.EXPORTING }, { new: true }).exec();
        if (transactionDoc === null) {
            return;
        }
        // 失敗してもここでは戻さない(RUNNINGのまま待機)
        yield exportQueuesById(transactionDoc.get('id'))(queueAdapter, transactionAdapter);
        transactionDoc = yield transactionAdapter.transactionModel.findByIdAndUpdate(transactionDoc.get('id'), {
            queues_status: transactionQueuesStatus_1.default.EXPORTED,
            queues_exported_at: moment().toDate()
        }, { new: true }).exec();
    });
}
exports.exportQueues = exportQueues;
/**
 * ID指定で取引のキュー出力
 *
 * @param {string} id
 * @returns {TransactionAndQueueOperation<void>}
 *
 * @memberof service/transaction
 */
function exportQueuesById(id) {
    // tslint:disable-next-line:max-func-body-length
    return (queueAdapter, transactionAdapter) => __awaiter(this, void 0, void 0, function* () {
        const doc = yield transactionAdapter.transactionModel.findById(id).populate('owners').exec();
        if (doc === null) {
            throw new Error(`transaction[${id}] not found.`);
        }
        const transaction = doc.toObject();
        const queues = [];
        switch (transaction.status) {
            case transactionStatus_1.default.CLOSED:
                // 取引イベントからキューリストを作成
                (yield transactionAdapter.findAuthorizationsById(transaction.id)).forEach((authorization) => {
                    queues.push(SettleAuthorizationQueueFactory.create({
                        authorization: authorization,
                        status: queueStatus_1.default.UNEXECUTED,
                        run_at: new Date(),
                        max_count_try: 10,
                        last_tried_at: null,
                        count_tried: 0,
                        results: []
                    }));
                });
                (yield transactionAdapter.findNotificationsById(transaction.id)).forEach((notification) => {
                    queues.push(PushNotificationQueueFactory.create({
                        notification: notification,
                        status: queueStatus_1.default.UNEXECUTED,
                        run_at: new Date(),
                        max_count_try: 10,
                        last_tried_at: null,
                        count_tried: 0,
                        results: []
                    }));
                });
                break;
            // 期限切れの場合は、キューリストを作成する
            case transactionStatus_1.default.EXPIRED:
                (yield transactionAdapter.findAuthorizationsById(transaction.id)).forEach((authorization) => {
                    queues.push(CancelAuthorizationQueueFactory.create({
                        authorization: authorization,
                        status: queueStatus_1.default.UNEXECUTED,
                        run_at: new Date(),
                        max_count_try: 10,
                        last_tried_at: null,
                        count_tried: 0,
                        results: []
                    }));
                });
                // COA本予約があれば取消
                if (!_.isEmpty(transaction.inquiry_key)) {
                    queues.push(DisableTransactionInquiryQueueFactory.create({
                        transaction: transaction,
                        status: queueStatus_1.default.UNEXECUTED,
                        run_at: new Date(),
                        max_count_try: 10,
                        last_tried_at: null,
                        count_tried: 0,
                        results: []
                    }));
                }
                break;
            default:
                throw new argument_1.default('id', 'transaction group not implemented.');
        }
        debug('queues:', queues);
        const promises = queues.map((queue) => __awaiter(this, void 0, void 0, function* () {
            debug('storing queue...', queue);
            yield queueAdapter.model.findByIdAndUpdate(queue.id, queue, { new: true, upsert: true }).exec();
        }));
        yield Promise.all(promises);
    });
}
exports.exportQueuesById = exportQueuesById;
/**
 * キューエクスポートリトライ
 * todo updated_atを基準にしているが、キューエクスポートトライ日時を持たせた方が安全か？
 *
 * @param {number} intervalInMinutes
 * @memberof service/transaction
 */
function reexportQueues(intervalInMinutes) {
    return (transactionAdapter) => __awaiter(this, void 0, void 0, function* () {
        yield transactionAdapter.transactionModel.findOneAndUpdate({
            queues_status: transactionQueuesStatus_1.default.EXPORTING,
            updated_at: { $lt: moment().add(-intervalInMinutes, 'minutes').toISOString() } // tslint:disable-line:no-magic-numbers
        }, {
            queues_status: transactionQueuesStatus_1.default.UNEXPORTED
        }).exec();
    });
}
exports.reexportQueues = reexportQueues;
