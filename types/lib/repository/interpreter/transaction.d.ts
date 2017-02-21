/// <reference types="mongoose" />
/**
 * 取引リポジトリ
 *
 * @class TransactionRepositoryInterpreter
 */
import * as monapt from 'monapt';
import * as mongoose from 'mongoose';
import Authorization from '../../model/authorization';
import Notification from '../../model/notification';
import ObjectId from '../../model/objectId';
import Transaction from '../../model/transaction';
import TransactionEvent from '../../model/transactionEvent';
import TransactionRepository from '../transaction';
export default class TransactionRepositoryInterpreter implements TransactionRepository {
    readonly connection: mongoose.Connection;
    constructor(connection: mongoose.Connection);
    find(conditions: Object): Promise<Transaction[]>;
    findById(id: ObjectId): Promise<monapt.Option<Transaction>>;
    findOne(conditions: Object): Promise<monapt.Option<Transaction>>;
    findOneAndUpdate(conditions: Object, update: Object): Promise<monapt.Option<Transaction>>;
    store(transaction: Transaction): Promise<void>;
    addEvent(transactionEvent: TransactionEvent): Promise<void>;
    findAuthorizationsById(id: ObjectId): Promise<Authorization[]>;
    findNotificationsById(id: ObjectId): Promise<Notification[]>;
    /**
     * 成立可能かどうか
     *
     * @returns {Promies<boolean>}
     */
    canBeClosed(id: ObjectId): Promise<boolean>;
}
