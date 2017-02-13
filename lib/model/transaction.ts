import * as monapt from 'monapt';
import Authorization from './authorization';
import COASeatReservationAuthorization from './authorization/coaSeatReservation';
import AuthorizationGroup from './authorizationGroup';
import Notification from './notification';
import ObjectId from './objectId';
import Owner from './owner';
import Queue from './queue';
import TransactionEvent from './transactionEvent';
import AuthorizeTransactionEvent from './transactionEvent/authorize';
import NotificationAddTransactionEvent from './transactionEvent/notificationAdd';
import NotificationRemoveTransactionEvent from './transactionEvent/notificationRemove';
import UnauthorizeTransactionEvent from './transactionEvent/unauthorize';
import TransactionEventGroup from './transactionEventGroup';
import TransactionInquiryKey from './transactionInquiryKey';
import TransactionQueuesStatus from './transactionQueuesStatus';
import TransactionStatus from './transactionStatus';

/**
 * 取引
 *
 * @class Transaction
 *
 * @param {ObjectId} _id
 * @param {TransactionStatus} status
 * @param {Array<TransactionEvent>} events
 * @param {Array<Owner>} owners
 * @param {Array<Queue>} queues
 * @param {Date} expired_at
 * @param {string} inquiry_theater
 * @param {string} inquiry_id
 * @param {string} inquiry_pass
 * @param {TransactionQueuesStatus} queues_status
 */
export default class Transaction {
    constructor(
        readonly _id: ObjectId,
        readonly status: TransactionStatus,
        readonly events: TransactionEvent[],
        readonly owners: Owner[],
        readonly queues: Queue[],
        readonly expired_at: Date,
        readonly inquiry_key: TransactionInquiryKey | null,
        readonly queues_status: TransactionQueuesStatus
    ) {
        // todo validation
    }

    /**
     * COA座席仮予約を取得する
     *
     * @returns {monapt.Option<COASeatReservationAuthorization>}
     *
     * @memberOf Transaction
     */
    public getCoaSeatReservationAuthorization() {
        const coaAuthorization = this.authorizations().find(
            (authorization) => (authorization.group === AuthorizationGroup.COA_SEAT_RESERVATION)
        );

        return (coaAuthorization) ? monapt.Option(<COASeatReservationAuthorization> coaAuthorization) : monapt.None;
    }

    /**
     * イベントから承認リストを取得する
     *
     * @returns {Array<Authorization>}
     *
     * @memberOf Transaction
     */
    public authorizations(): Authorization[] {
        // 承認イベント
        const authorizations = this.events
            .filter((event) => (event.group === TransactionEventGroup.AUTHORIZE))
            .map((event: AuthorizeTransactionEvent) => event.authorization);

        // 承認解除イベント
        const removedAuthorizationIds = this.events
            .filter((event) => (event.group === TransactionEventGroup.UNAUTHORIZE))
            .map((event: UnauthorizeTransactionEvent) => event.authorization._id.toString());

        return authorizations.filter(
            (authorization) => (removedAuthorizationIds.indexOf(authorization._id.toString()) < 0)
        );
    }

    /**
     * イベントから通知リストを取得する
     *
     * @returns {Array<Notification>}
     *
     * @memberOf Transaction
     */
    public notifications() {
        const notifications = this.events
            .filter((event) => (event.group === TransactionEventGroup.NOTIFICATION_ADD))
            .map((event: NotificationAddTransactionEvent<Notification>) => event.notification);

        // メール削除イベント
        const removedNotificationIds = this.events
            .filter((event) => (event.group === TransactionEventGroup.NOTIFICATION_REMOVE))
            .map((event: NotificationRemoveTransactionEvent<Notification>) => event.notification._id.toString());

        return notifications.filter(
            (notification) => (removedNotificationIds.indexOf(notification._id.toString()) < 0)
        );
    }

    /**
     * 照会可能かどうか
     *
     * @returns {boolean}
     *
     * @memberOf Transaction
     */
    public isInquiryAvailable() {
        return (this.inquiry_key);
    }

    /**
     * 成立可能かどうか
     *
     * @returns {boolean}
     *
     * @memberOf Transaction
     */
    public canBeClosed() {
        const authorizations = this.authorizations();
        const pricesByOwner: {
            [ownerId: string]: number
        } = {};

        authorizations.forEach((authorization) => {
            if (!pricesByOwner[authorization.owner_from.toString()]) {
                pricesByOwner[authorization.owner_from.toString()] = 0;
            }
            if (!pricesByOwner[authorization.owner_to.toString()]) {
                pricesByOwner[authorization.owner_to.toString()] = 0;
            }

            pricesByOwner[authorization.owner_from.toString()] -= authorization.price;
            pricesByOwner[authorization.owner_to.toString()] += authorization.price;
        });

        return Object.keys(pricesByOwner).every((ownerId) => (pricesByOwner[ownerId] === 0));
    }
}
