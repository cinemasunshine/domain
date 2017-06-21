import * as monapt from 'monapt';
import * as AuthorizationFactory from '../factory/authorization';
import * as COASeatReservationAuthorizationFactory from '../factory/authorization/coaSeatReservation';
import * as GMOAuthorizationFactory from '../factory/authorization/gmo';
import * as MvtkAuthorizationFactory from '../factory/authorization/mvtk';
import * as EmailNotificationFactory from '../factory/notification/email';
import OwnerGroup from '../factory/ownerGroup';
import * as TransactionFactory from '../factory/transaction';
import * as TransactionInquiryKeyFactory from '../factory/transactionInquiryKey';
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
 * @memberof service/transactionWithId
 */
export declare function findById(id: string): TransactionOperation<monapt.Option<TransactionFactory.ITransaction>>;
export declare function addAuthorization(transactionId: string, authorization: AuthorizationFactory.IAuthorization): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * GMO資産承認
 *
 * @param {string} transactionId
 * @param {GMOAuthorization} authorization
 * @returns {TransactionOperation<void>}
 *
 * @memberof service/transactionWithId
 */
export declare function addGMOAuthorization(transactionId: string, authorization: GMOAuthorizationFactory.IGMOAuthorization): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * COA資産承認
 *
 * @param {string} transactionId
 * @param {COASeatReservationAuthorization} authorization
 * @returns {OwnerAndTransactionOperation<void>}
 *
 * @memberof service/transactionWithId
 */
export declare function addCOASeatReservationAuthorization(transactionId: string, authorization: COASeatReservationAuthorizationFactory.ICOASeatReservationAuthorization): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * ムビチケ着券承認追加
 *
 * @param {string} transactionId
 * @param {MvtkAuthorization.IMvtkAuthorization} authorization
 * @returns {OwnerAndTransactionOperation<void>}
 *
 * @memberof service/transactionWithId
 */
export declare function addMvtkAuthorization(transactionId: string, authorization: MvtkAuthorizationFactory.IMvtkAuthorization): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * 資産承認解除
 *
 * @param {string} transactionId
 * @param {string} authorizationId
 * @returns {TransactionOperation<void>}
 *
 * @memberof service/transactionWithId
 */
export declare function removeAuthorization(transactionId: string, authorizationId: string): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * メール追加
 *
 * @param {string} transactionId
 * @param {EmailNotification} notification
 * @returns {TransactionOperation<void>}
 *
 * @memberof service/transactionWithId
 */
export declare function addEmail(transactionId: string, notification: EmailNotificationFactory.IEmailNotification): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * メール削除
 *
 * @param {string} transactionId
 * @param {string} notificationId
 * @returns {TransactionOperation<void>}
 *
 * @memberof service/transactionWithId
 */
export declare function removeEmail(transactionId: string, notificationId: string): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * 匿名所有者更新
 *
 * @returns {OwnerAndTransactionOperation<void>}
 * @memberof service/transactionWithId
 * @deprecated use setAnonymousOwnerProfile instead
 */
export declare function updateAnonymousOwner(args: {
    transaction_id: string;
    name_first?: string;
    name_last?: string;
    email?: string;
    tel?: string;
}): (ownerAdapter: OwnerAdapter, transactionAdapter: TransactionAdapter) => Promise<void>;
export declare function setAnonymousOwnerProfile(transactionId: string, profile: {
    username?: string;
    password?: string;
    name_first: string;
    name_last: string;
    email: string;
    tel: string;
    /**
     * カードトークン
     */
    token?: string;
    group: OwnerGroup;
}): (ownerAdapter: OwnerAdapter, transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * 照合を可能にする
 *
 * @param {string} transactionId
 * @param {TransactionInquiryKey} key
 * @returns {TransactionOperation<monapt.Option<Transaction>>}
 *
 * @memberof service/transactionWithId
 */
export declare function enableInquiry(id: string, key: TransactionInquiryKeyFactory.ITransactionInquiryKey): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * 取引成立
 *
 * @param {string} transactionId
 * @returns {TransactionOperation<void>}
 *
 * @memberof service/transactionWithId
 */
export declare function close(id: string): (transactionAdapter: TransactionAdapter) => Promise<void>;
