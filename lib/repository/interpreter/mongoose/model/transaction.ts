import * as mongoose from 'mongoose';
import ownerModel from './owner';

/**
 * 取引スキーマ
 *
 * @ignore
 */
const schema = new mongoose.Schema(
    {
        expired_at: Date,
        status: String,
        owners: [{ // 取引の対象所有者リスト
            type: mongoose.Schema.Types.ObjectId,
            ref: ownerModel.modelName
        }],
        inquiry_key: {
            theater_code: String, // 照会劇場コード
            reserve_num: Number, // 照会ID
            tel: String // 照会PASS
        },
        queues_status: String
    },
    {
        collection: 'transactions',
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

export default mongoose.model('Transaction', schema);
