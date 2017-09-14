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
const factory = require("@motionpicture/sskts-factory");
const moment = require("moment");
const transaction_1 = require("./mongoose/model/transaction");
/**
 * transaction repository
 * @class
 */
class MongoRepository {
    constructor(connection) {
        this.transactionModel = connection.model(transaction_1.default.modelName);
    }
    startPlaceOrder(transactionAttributes) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transactionModel.create(transactionAttributes).then((doc) => doc.toObject());
        });
    }
    /**
     * find placeOrder transaction by id
     * @param {string} transactionId transaction id
     */
    findPlaceOrderById(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.transactionModel.findOne({
                _id: transactionId,
                typeOf: factory.transactionType.PlaceOrder
            }).exec();
            if (doc === null) {
                throw new factory.errors.NotFound('transaction');
            }
            return doc.toObject();
        });
    }
    /**
     * 進行中の取引を取得する
     */
    findPlaceOrderInProgressById(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.transactionModel.findOne({
                _id: transactionId,
                typeOf: factory.transactionType.PlaceOrder,
                status: factory.transactionStatusType.InProgress
            }).exec();
            if (doc === null) {
                throw new factory.errors.NotFound('transaction in progress');
            }
            return doc.toObject();
        });
    }
    /**
     * 取引中の所有者プロフィールを変更する
     * 匿名所有者として開始した場合のみ想定(匿名か会員に変更可能)
     */
    setCustomerContactsOnPlaceOrderInProgress(transactionId, contact) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.transactionModel.findOneAndUpdate({
                _id: transactionId,
                typeOf: factory.transactionType.PlaceOrder,
                status: factory.transactionStatusType.InProgress
            }, {
                'object.customerContact': contact
            }).exec();
            if (doc === null) {
                throw new factory.errors.NotFound('transaction in progress');
            }
        });
    }
    /**
     * confirm a placeOrder
     * 注文取引を確定する
     * @param {string} transactionId transaction id
     * @param {Date} endDate end date
     * @param {factory.action.authorize.IAction[]} authorizeActions authorize actions
     * @param {factory.transaction.placeOrder.IResult} result transaction result
     */
    confirmPlaceOrder(transactionId, endDate, authorizeActions, result) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.transactionModel.findOneAndUpdate({
                _id: transactionId,
                typeOf: factory.transactionType.PlaceOrder,
                status: factory.transactionStatusType.InProgress
            }, {
                status: factory.transactionStatusType.Confirmed,
                endDate: endDate,
                'object.authorizeActions': authorizeActions,
                result: result // resultを更新
            }, { new: true }).exec();
            if (doc === null) {
                throw new factory.errors.NotFound('transaction in progress');
            }
            return doc.toObject();
        });
    }
    /**
     * タスクエクスポートリトライ
     * todo updatedAtを基準にしているが、タスクエクスポートトライ日時を持たせた方が安全か？
     * @param {number} intervalInMinutes
     */
    reexportTasks(intervalInMinutes) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.transactionModel.findOneAndUpdate({
                tasksExportationStatus: factory.transactionTasksExportationStatus.Exporting,
                updatedAt: { $lt: moment().add(-intervalInMinutes, 'minutes').toISOString() }
            }, {
                tasksExportationStatus: factory.transactionTasksExportationStatus.Unexported
            }).exec();
        });
    }
    /**
     * set task status exported by transaction id
     * IDでタスクをエクスポート済に変更する
     * @param transactionId transaction id
     * @param tasks task list
     */
    setTasksExportedById(transactionId, tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.transactionModel.findByIdAndUpdate(transactionId, {
                tasksExportationStatus: factory.transactionTasksExportationStatus.Exported,
                tasksExportedAt: moment().toDate(),
                tasks: tasks
            }).exec();
        });
    }
    /**
     * 取引を期限切れにする
     */
    makeExpired() {
        return __awaiter(this, void 0, void 0, function* () {
            const endDate = moment().toDate();
            // ステータスと期限を見て更新
            yield this.transactionModel.update({
                status: factory.transactionStatusType.InProgress,
                expires: { $lt: endDate }
            }, {
                status: factory.transactionStatusType.Expired,
                endDate: endDate
            }, { multi: true }).exec();
        });
    }
    /**
     * 注文取引を検索する
     * @param conditions 検索条件
     */
    searchPlaceOrder(conditions) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.transactionModel.find({
                typeOf: factory.transactionType.PlaceOrder,
                startDate: {
                    $gte: conditions.startFrom,
                    $lte: conditions.startThrough
                }
            }).exec()
                .then((docs) => docs.map((doc) => doc.toObject()));
        });
    }
}
exports.MongoRepository = MongoRepository;
