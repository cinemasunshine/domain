import Authorization from '../authorization';
import ObjectId from '../objectId';
import TransactionEvent from '../transactionEvent';
import TransactionEventGroup from '../transactionEventGroup';

/**
 * オーソリ追加取引イベント
 *
 *
 * @class AuthorizeTransactionEvent
 * @extends {TransactionEvent}
 */
export default class AuthorizeTransactionEvent extends TransactionEvent {
    /**
     * Creates an instance of AuthorizeTransactionEvent.
     *
     * @param {ObjectId} _id
     * @param {Date} occurred_at
     * @param {Authorization} authorization
     *
     * @memberOf AuthorizeTransactionEvent
     */
    constructor(
        readonly _id: ObjectId,
        readonly occurred_at: Date,
        readonly authorization: Authorization
    ) {
        super(_id, TransactionEventGroup.AUTHORIZE, occurred_at);

        // todo validation
    }
}
