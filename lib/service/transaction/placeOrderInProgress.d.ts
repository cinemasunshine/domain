import * as GMO from '@motionpicture/gmo-service';
import * as factory from '@motionpicture/sskts-factory';
import OrganizationRepository from '../../repo/organization';
import TransactionRepository from '../../repo/transaction';
import TransactionCountRepository from '../../repo/transactionCount';
export declare type ITransactionOperation<T> = (transactionRepository: TransactionRepository) => Promise<T>;
export declare type IOrganizationAndTransactionOperation<T> = (organizationRepository: OrganizationRepository, transactionRepository: TransactionRepository) => Promise<T>;
export declare type IOrganizationAndTransactionAndTransactionCountOperation<T> = (organizationRepository: OrganizationRepository, transactionRepository: TransactionRepository, transactionCountRepository: TransactionCountRepository) => Promise<T>;
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
 * オーソリを取得するクレジットカード情報インターフェース
 */
export declare type ICreditCard4authorization = factory.paymentMethod.paymentCard.creditCard.IUncheckedCardRaw | factory.paymentMethod.paymentCard.creditCard.IUncheckedCardTokenized | factory.paymentMethod.paymentCard.creditCard.IUnauthorizedCardOfMember;
/**
 * クレジットカードオーソリ取得
 */
export declare function createCreditCardAuthorization(agentId: string, transactionId: string, orderId: string, amount: number, method: GMO.utils.util.Method, creditCard: ICreditCard4authorization): IOrganizationAndTransactionOperation<factory.authorization.gmo.IAuthorization>;
export declare function cancelGMOAuthorization(agentId: string, transactionId: string, authorizationId: string): (transactionRepository: TransactionRepository) => Promise<void>;
export declare function createSeatReservationAuthorization(agentId: string, transactionId: string, individualScreeningEvent: factory.event.individualScreeningEvent.IEvent, offers: factory.offer.ISeatReservationOffer[]): ITransactionOperation<factory.authorization.seatReservation.IAuthorization>;
export declare function cancelSeatReservationAuthorization(agentId: string, transactionId: string, authorizationId: string): (transactionRepository: TransactionRepository) => Promise<void>;
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
export declare function createMvtkAuthorization(agentId: string, transactionId: string, authorizationResult: factory.authorization.mvtk.IResult): ITransactionOperation<factory.authorization.mvtk.IAuthorization>;
export declare function cancelMvtkAuthorization(agentId: string, transactionId: string, authorizationId: string): (transactionRepository: TransactionRepository) => Promise<void>;
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
 * 取引中の購入者情報を変更する
 */
export declare function setCustomerContacts(agentId: string, transactionId: string, contact: factory.transaction.placeOrder.ICustomerContact): ITransactionOperation<void>;
/**
 * 取引確定
 */
export declare function confirm(agentId: string, transactionId: string): (transactionRepository: TransactionRepository) => Promise<factory.order.IOrder>;
