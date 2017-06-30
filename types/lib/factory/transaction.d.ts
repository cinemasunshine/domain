import * as ClientUserFactory from './clientUser';
import * as OwnerFactory from './owner';
import * as TransactionInquiryKeyFactory from './transactionInquiryKey';
import TransactionQueuesStatus from './transactionQueuesStatus';
import TransactionStatus from './transactionStatus';
/**
 * 取引インターフェース
 *
 * @export
 * @interface ITransaction
 * @memberof factory/transaction
 */
export interface ITransaction {
    id: string;
    /**
     * 取引状態
     */
    status: TransactionStatus;
    /**
     * 取引に参加している所有者リスト
     */
    owners: OwnerFactory.IOwner[];
    /**
     * 取引を進行するクライアントユーザー
     */
    client_user: ClientUserFactory.IClientUser;
    /**
     * 期限切れ予定日時
     */
    expires_at: Date;
    /**
     * 期限切れ日時
     */
    expired_at?: Date;
    /**
     * 開始日時
     */
    started_at?: Date;
    /**
     * 成立日時
     */
    closed_at?: Date;
    /**
     * 照会キー
     */
    inquiry_key?: TransactionInquiryKeyFactory.ITransactionInquiryKey;
    /**
     * キューエクスポート日時
     */
    queues_exported_at?: Date;
    /**
     * キューエクスポート状態
     */
    queues_status: TransactionQueuesStatus;
}
/**
 * 取引を作成する
 *
 * @export
 * @returns {ITransaction} 取引
 * @memberof factory/transaction
 */
export declare function create(args: {
    id?: string;
    status: TransactionStatus;
    owners: OwnerFactory.IOwner[];
    client_user?: ClientUserFactory.IClientUser;
    expires_at: Date;
    expired_at?: Date;
    started_at?: Date;
    closed_at?: Date;
    inquiry_key?: TransactionInquiryKeyFactory.ITransactionInquiryKey;
    queues_exported_at?: Date;
    queues_status?: TransactionQueuesStatus;
}): ITransaction;
