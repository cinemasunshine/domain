import * as monapt from 'monapt';
import * as COASeatReservationAuthorization from '../factory/authorization/coaSeatReservation';
import * as GMOAuthorization from '../factory/authorization/gmo';
import * as MvtkAuthorization from '../factory/authorization/mvtk';
import * as Notification from '../factory/notification';
import * as Transaction from '../factory/transaction';
import * as TransactionInquiryKey from '../factory/transactionInquiryKey';
import OwnerAdapter from '../adapter/owner';
import QueueAdapter from '../adapter/queue';
import TransactionAdapter from '../adapter/transaction';
export declare type TransactionAndQueueOperation<T> = (transactionAdapter: TransactionAdapter, queueAdapter: QueueAdapter) => Promise<T>;
export declare type OwnerAndTransactionOperation<T> = (ownerAdapter: OwnerAdapter, transactionAdapter: TransactionAdapter) => Promise<T>;
export declare type TransactionOperation<T> = (transactionAdapter: TransactionAdapter) => Promise<T>;
/**
 * IDから取得する
 *
 * @param {string} id
 * @returns {TransactionOperation<monapt.Option<Transaction>>}
 *
 * @memberOf TransactionWithIdService
 */
export declare function findById(id: string): TransactionOperation<monapt.Option<Transaction.ITransaction>>;
/**
 * GMO資産承認
 *
 * @param {string} transactionId
 * @param {GMOAuthorization} authorization
 * @returns {TransactionOperation<void>}
 *
 * @memberOf TransactionWithIdService
 */
export declare function addGMOAuthorization(transactionId: string, authorization: GMOAuthorization.IGMOAuthorization): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * COA資産承認
 *
 * @param {string} transactionId
 * @param {COASeatReservationAuthorization} authorization
 * @returns {OwnerAndTransactionOperation<void>}
 *
 * @memberOf TransactionWithIdService
 */
export declare function addCOASeatReservationAuthorization(transactionId: string, authorization: COASeatReservationAuthorization.ICOASeatReservationAuthorization): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * ムビチケ着券承認追加
 *
 * @param {string} transactionId
 * @param {MvtkAuthorization.IMvtkAuthorization} authorization
 * @returns {OwnerAndTransactionOperation<void>}
 *
 * @memberOf TransactionWithIdService
 */
export declare function addMvtkAuthorization(transactionId: string, authorization: MvtkAuthorization.IMvtkAuthorization): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * 資産承認解除
 *
 * @param {string} transactionId
 * @param {string} authorizationId
 * @returns {TransactionOperation<void>}
 *
 * @memberOf TransactionWithIdService
 */
export declare function removeAuthorization(transactionId: string, authorizationId: string): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * メール追加
 *
 * @param {string} transactionId
 * @param {EmailNotification} notification
 * @returns {TransactionOperation<void>}
 *
 * @memberOf TransactionWithIdService
 */
export declare function addEmail(transactionId: string, notification: Notification.IEmailNotification): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * メール削除
 *
 * @param {string} transactionId
 * @param {string} notificationId
 * @returns {TransactionOperation<void>}
 *
 * @memberOf TransactionWithIdService
 */
export declare function removeEmail(transactionId: string, notificationId: string): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * 匿名所有者更新
 *
 * @returns {OwnerAndTransactionOperation<void>}
 *
 * @memberOf TransactionWithIdService
 */
export declare function updateAnonymousOwner(args: {
    transaction_id: string;
    name_first?: string;
    name_last?: string;
    email?: string;
    tel?: string;
}): OwnerAndTransactionOperation<void>;
/**
 * 照合を可能にする
 *
 * @param {string} transactionId
 * @param {TransactionInquiryKey} key
 * @returns {TransactionOperation<monapt.Option<Transaction>>}
 *
 * @memberOf TransactionWithIdService
 */
export declare function enableInquiry(id: string, key: TransactionInquiryKey.ITransactionInquiryKey): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * 取引成立
 *
 * @param {string} transactionId
 * @returns {TransactionOperation<void>}
 *
 * @memberOf TransactionWithIdService
 */
export declare function close(id: string): (transactionAdapter: TransactionAdapter) => Promise<void>;
