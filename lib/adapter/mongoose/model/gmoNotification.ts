import * as mongoose from 'mongoose';

/**
 * GMO通知スキーマ
 *
 * @ignore
 */
const schema = new mongoose.Schema(
    {
        shop_id: String, // ショップID
        access_id: String, // 取引ID
        order_id: String, // オーダーID
        status: String, // 現状態
        job_cd: String, // 処理区分
        amount: String, // 利用金額
        tax: String, // 税送料
        currency: String, // 通貨コード
        forward: String, // 仕向先会社コード
        method: String, // 支払方法
        pay_times: String, // 支払回数
        tran_id: String, // トランザクションID
        approve: String, // 承認番号
        tran_date: String, // 処理日付
        ErrCode: String, // エラーコード
        ErrInfo: String, // エラー詳細コード
        pay_type: String // 決済方法
    },
    {
        collection: 'gmo_notifications',
        id: true,
        read: 'primaryPreferred',
        safe: <any>{ j: 1, w: 'majority', wtimeout: 10000 },
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        },
        toJSON: { getters: true },
        toObject: { getters: true }
    }
);

export default mongoose.model('GMONotification', schema);
