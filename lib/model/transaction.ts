// tslint:disable:variable-name
import ObjectId from './objectId';
import Owner from './owner';
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
 * @param {Owner[]} owners
 * @param {Date} expired_at
 * @param {string} inquiry_theater
 * @param {string} inquiry_id
 * @param {string} inquiry_pass
 * @param {TransactionQueuesStatus} queues_status
 */
class Transaction {
    constructor(
        readonly _id: ObjectId,
        readonly status: TransactionStatus,
        readonly owners: Owner[],
        readonly expired_at: Date,
        readonly inquiry_key: TransactionInquiryKey | null,
        readonly queues_status: TransactionQueuesStatus
    ) {
        // todo validation
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
}

namespace Transaction {
    export interface ITransaction {
        _id?: ObjectId;
        status: TransactionStatus;
        owners: Owner[];
        expired_at: Date;
        inquiry_key?: TransactionInquiryKey;
        queues_status?: TransactionQueuesStatus;
    }

    export function create(args: ITransaction): Transaction {
        return new Transaction(
            (args._id === undefined) ? ObjectId() : (args._id),
            args.status,
            args.owners,
            args.expired_at,
            (args.inquiry_key === undefined) ? null : (args.inquiry_key),
            (args.queues_status === undefined) ? TransactionQueuesStatus.UNEXPORTED : (args.queues_status)
        );
    }
}

export default Transaction;
