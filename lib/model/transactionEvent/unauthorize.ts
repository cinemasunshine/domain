import Authorization from '../authorization';
import ObjectId from '../objectId';
import TransactionEvent from '../transactionEvent';
import TransactionEventGroup from '../transactionEventGroup';

/**
 * オーソリ削除取引イベント
 *
 *
 * @class Unauthorize
 * @extends {TransactionEvent}
 */
export default class Unauthorize extends TransactionEvent {
    /**
     * Creates an instance of Unauthorize.
     *
     * @param {ObjectId} _id
     * @param {Date} occurred_at
     * @param {Authorization} authorization
     *
     * @memberOf Unauthorize
     */
    constructor(
        readonly _id: ObjectId,
        readonly occurred_at: Date,
        readonly authorization: Authorization
    ) {
        super(_id, TransactionEventGroup.UNAUTHORIZE, occurred_at);

        // todo validation
    }
}
