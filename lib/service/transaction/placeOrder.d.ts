import * as GMO from '@motionpicture/gmo-service';
import * as factory from '@motionpicture/sskts-factory';
import OrganizationAdapter from '../../adapter/organization';
import TaskAdapter from '../../adapter/task';
import TransactionAdapter from '../../adapter/transaction';
import TransactionCountAdapter from '../../adapter/transactionCount';
export declare type ITransactionOperation<T> = (transactionAdapter: TransactionAdapter) => Promise<T>;
export declare type ITaskAndTransactionOperation<T> = (taskAdapter: TaskAdapter, transactionAdapter: TransactionAdapter) => Promise<T>;
export declare type IOrganizationAndTransactionOperation<T> = (organizationAdapter: OrganizationAdapter, transactionAdapter: TransactionAdapter) => Promise<T>;
export declare type IOrganizationAndTransactionAndTransactionCountOperation<T> = (organizationAdapter: OrganizationAdapter, transactionAdapter: TransactionAdapter, transactionCountAdapter: TransactionCountAdapter) => Promise<T>;
/**
 * 取引開始
 */
export declare function start(args: {
    expires: Date;
    maxCountPerUnit: number;
    clientUser: factory.clientUser.IClientUser;
    scope: factory.transactionScope.ITransactionScope;
    agentId: string;
    sellerId: string;
}): IOrganizationAndTransactionAndTransactionCountOperation<factory.transaction.placeOrder.ITransaction>;
/**
 * 取引を期限切れにする
 */
export declare function makeExpired(): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * ひとつの取引のタスクをエクスポートする
 */
export declare function exportTasks(status: factory.transactionStatusType): (taskAdapter: TaskAdapter, transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * ID指定で取引のタスク出力
 */
export declare function exportTasksById(transactionId: string): ITaskAndTransactionOperation<factory.task.ITask[]>;
/**
 * タスクエクスポートリトライ
 * todo updatedAtを基準にしているが、タスクエクスポートトライ日時を持たせた方が安全か？
 *
 * @param {number} intervalInMinutes
 * @memberof service/transaction
 */
export declare function reexportTasks(intervalInMinutes: number): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * 進行中の取引を取得する
 */
export declare function findInProgressById(transactionId: string): ITransactionOperation<factory.transaction.placeOrder.ITransaction>;
/**
 * オーソリを取得するクレジットカード情報インターフェース
 */
export declare type ICreditCard4authorization = factory.paymentMethod.paymentCard.creditCard.IUncheckedCardRaw | factory.paymentMethod.paymentCard.creditCard.IUncheckedCardTokenized | factory.paymentMethod.paymentCard.creditCard.IUnauthorizedCardOfMember;
/**
 * クレジットカードオーソリ取得
 */
export declare function createCreditCardAuthorization(transactionId: string, orderId: string, amount: number, method: GMO.utils.util.Method, creditCard: ICreditCard4authorization): IOrganizationAndTransactionOperation<factory.authorization.gmo.IAuthorization>;
export declare function cancelGMOAuthorization(transactionId: string, authorizationId: string): (transactionAdapter: TransactionAdapter) => Promise<void>;
export declare function createSeatReservationAuthorization(transactionId: string, individualScreeningEvent: factory.event.individualScreeningEvent.IEvent, offers: factory.offer.ISeatReservationOffer[]): ITransactionOperation<factory.authorization.seatReservation.IAuthorization>;
export declare function cancelSeatReservationAuthorization(transactionId: string, authorizationId: string): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * create a mvtk authorization
 * add the result of using a mvtk card
 * @export
 * @function
 * @param {string} transactionId
 * @param {factory.authorization.mvtk.IResult} authorizationResult
 * @return {ITransactionOperation<factory.authorization.mvtk.IAuthorization>}
 * @memberof service/transaction/placeOrder
 */
export declare function createMvtkAuthorization(transactionId: string, authorizationResult: factory.authorization.mvtk.IResult): ITransactionOperation<factory.authorization.mvtk.IAuthorization>;
export declare function cancelMvtkAuthorization(transactionId: string, authorizationId: string): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * メール追加
 *
 * @param {string} transactionId
 * @param {EmailNotification} notification
 * @returns {TransactionOperation<void>}
 *
 * @memberof service/transaction/placeOrder
 */
/**
 * メール削除
 *
 * @param {string} transactionId
 * @param {string} notificationId
 * @returns {TransactionOperation<void>}
 *
 * @memberof service/transaction/placeOrder
 */
/**
 * 取引中の所有者プロフィールを変更する
 * 匿名所有者として開始した場合のみ想定(匿名か会員に変更可能)
 */
export declare function setAgentProfile(transactionId: string, profile: factory.transaction.placeOrder.ICustomerContact): (transactionAdapter: TransactionAdapter) => Promise<void>;
/**
 * 取引確定
 */
export declare function confirm(transactionId: string): (transactionAdapter: TransactionAdapter) => Promise<factory.order.IOrder>;
