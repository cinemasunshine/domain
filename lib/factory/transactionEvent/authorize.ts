/**
 * オーソリ追加取引イベントファクトリー
 *
 * @namespace factory/transactionEvent/authorize
 */

import * as _ from 'underscore';

import ArgumentError from '../../error/argument';
import ArgumentNullError from '../../error/argumentNull';

import * as Authorization from '../authorization';
import ObjectId from '../objectId';
import * as TransactionEventFactory from '../transactionEvent';
import TransactionEventGroup from '../transactionEventGroup';

/**
 * オーソリ追加取引イベント
 *
 * @interface AuthorizeTransactionEvent
 * @extends {TransactionEvent}
 * @param {Authorization} authorization
 * @memberof tobereplaced$
 */
export interface IAuthorizeTransactionEvent extends TransactionEventFactory.ITransactionEvent {
    authorization: Authorization.IAuthorization;
}

/**
 *
 * @memberof tobereplaced$
 */
export function create(args: {
    id?: string,
    transaction: string,
    occurred_at: Date,
    authorization: Authorization.IAuthorization
}): IAuthorizeTransactionEvent {
    if (_.isEmpty(args.transaction)) throw new ArgumentNullError('transaction');
    if (_.isEmpty(args.authorization)) throw new ArgumentNullError('authorization');
    if (!_.isDate(args.occurred_at)) throw new ArgumentError('occurred_at', 'occurred_at should be Date');

    return {
        id: (args.id === undefined) ? ObjectId().toString() : args.id,
        group: TransactionEventGroup.AUTHORIZE,
        transaction: args.transaction,
        occurred_at: args.occurred_at,
        authorization: args.authorization
    };
}
