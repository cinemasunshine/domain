import * as factory from '@motionpicture/sskts-factory';
import { Connection } from 'mongoose';
import OrderModel from './mongoose/model/order';

/**
 * 注文レポジトリー
 *
 * @class OrderRepository
 */
export default class OrderRepository {
    public readonly orderModel: typeof OrderModel;

    constructor(connection: Connection) {
        this.orderModel = connection.model(OrderModel.modelName);
    }

    /**
     * find an order by an inquiry key
     * @param {factory.order.IOrderInquiryKey} orderInquiryKey
     */
    public async findByOrderInquiryKey(orderInquiryKey: factory.order.IOrderInquiryKey) {
        const doc = await this.orderModel.findOne(
            {
                'orderInquiryKey.theaterCode': orderInquiryKey.theaterCode,
                'orderInquiryKey.confirmationNumber': orderInquiryKey.confirmationNumber,
                'orderInquiryKey.telephone': orderInquiryKey.telephone
            }
        ).exec();

        if (doc === null) {
            throw new factory.errors.NotFound('order');
        }

        return <factory.order.IOrder>doc.toObject();
    }

    public async save(order: factory.order.IOrder) {
        await this.orderModel.findOneAndUpdate(
            {
                orderNumber: order.orderNumber
            },
            order,
            { upsert: true }
        ).exec();
    }
}
