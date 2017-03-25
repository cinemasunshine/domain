
/**
 * 通知削除取引イベントファクトリー
 *
 * @namespace RemoveNotificationTransactionEventFactory
 */
import * as validator from 'validator';

import ArgumentError from '../../error/argument';
import ArgumentNullError from '../../error/argumentNull';

import * as Notification from '../notification';
import ObjectId from '../objectId';
import * as TransactionEventFactory from '../transactionEvent';
import TransactionEventGroup from '../transactionEventGroup';

/**
 * 通知削除取引イベント
 *
 * @interface RemoveNotificationTransactionEvent
 * @extends {TransactionEvent}
 * @template T
 *
 * @param {T} notification
 */
export interface IRemoveNotificationTransactionEvent<T extends Notification.INotification>
    extends TransactionEventFactory.ITransactionEvent {
    notification: T;
}

export function create<T extends Notification.INotification>(args: {
    id?: string,
    transaction: string,
    occurred_at: Date,
    notification: T
}): IRemoveNotificationTransactionEvent<T> {
    if (validator.isEmpty(args.occurred_at.toString())) throw new ArgumentNullError('occurred_at');
    if (!(args.occurred_at instanceof Date)) throw new ArgumentError('occurred_at should be Date');

    return {
        id: (args.id === undefined) ? ObjectId().toString() : args.id,
        group: TransactionEventGroup.REMOVE_NOTIFICATION,
        transaction: args.transaction,
        occurred_at: args.occurred_at,
        notification: args.notification
    };
}
