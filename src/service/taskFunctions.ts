/**
 * タスクファンクションサービス
 * タスク名ごとに、実行するファンクションをひとつずつ定義しています
 * @namespace service.taskFunctions
 */

import * as factory from '@motionpicture/sskts-factory';
import * as mongoose from 'mongoose';

import { MongoRepository as ActionRepo } from '../repo/action';
import { MongoRepository as CreditCardAuthorizeActionRepo } from '../repo/action/authorize/creditCard';
import { MongoRepository as SeatReservationAuthorizeActionRepo } from '../repo/action/authorize/seatReservation';
import { MongoRepository as OrderRepo } from '../repo/order';
import { MongoRepository as OwnershipInfoRepo } from '../repo/ownershipInfo';
import { MongoRepository as TransactionRepo } from '../repo/transaction';

import * as NotificationService from '../service/notification';
import * as OrderService from '../service/order';
import * as OwnershipInfoService from '../service/ownershipInfo';
import * as SalesService from '../service/sales';
import * as StockService from '../service/stock';

export type IOperation<T> = (connection: mongoose.Connection) => Promise<T>;

export function sendEmailNotification(
    data: factory.task.sendEmailNotification.IData
): IOperation<void> {
    return async (__: mongoose.Connection) => {
        await NotificationService.sendEmail(data.emailMessage)();
    };
}

export function cancelSeatReservation(
    data: factory.task.cancelSeatReservation.IData
): IOperation<void> {
    return async (connection: mongoose.Connection) => {
        const authorizeActionRepo = new SeatReservationAuthorizeActionRepo(connection);
        await StockService.cancelSeatReservationAuth(data.transactionId)(authorizeActionRepo);
    };
}

export function cancelCreditCard(
    data: factory.task.cancelCreditCard.IData
): IOperation<void> {
    return async (connection: mongoose.Connection) => {
        const authorizeActionRepo = new CreditCardAuthorizeActionRepo(connection);
        await SalesService.cancelCreditCardAuth(data.transactionId)(authorizeActionRepo);
    };
}

export function cancelMvtk(
    data: factory.task.cancelMvtk.IData
): IOperation<void> {
    return async (__: mongoose.Connection) => {
        await SalesService.cancelMvtk(data.transactionId)();
    };
}

export function settleSeatReservation(
    data: factory.task.settleSeatReservation.IData
): IOperation<void> {
    return async (connection: mongoose.Connection) => {
        const transactionRepo = new TransactionRepo(connection);
        await StockService.transferSeatReservation(data.transactionId)(transactionRepo);
    };
}

export function settleCreditCard(
    data: factory.task.settleCreditCard.IData
): IOperation<void> {
    return async (connection: mongoose.Connection) => {
        const actionRepo = new ActionRepo(connection);
        const transactionRepo = new TransactionRepo(connection);
        await SalesService.settleCreditCardAuth(data.transactionId)(actionRepo, transactionRepo);
    };
}

export function settleMvtk(
    data: factory.task.settleMvtk.IData
): IOperation<void> {
    return async (__: mongoose.Connection) => {
        await SalesService.settleMvtk(data.transactionId)();
    };
}

export function createOrder(
    data: factory.task.createOrder.IData
): IOperation<void> {
    return async (connection: mongoose.Connection) => {
        const actionRepo = new ActionRepo(connection);
        const orderRepository = new OrderRepo(connection);
        const transactionRepo = new TransactionRepo(connection);
        await OrderService.createFromTransaction(data.transactionId)(actionRepo, orderRepository, transactionRepo);
    };
}

export function createOwnershipInfos(
    data: factory.task.createOrder.IData
): IOperation<void> {
    return async (connection: mongoose.Connection) => {
        const actionRepo = new ActionRepo(connection);
        const ownershipInfoRepository = new OwnershipInfoRepo(connection);
        const transactionRepo = new TransactionRepo(connection);
        await OwnershipInfoService.createFromTransaction(data.transactionId)(actionRepo, ownershipInfoRepository, transactionRepo);
    };
}

export function returnCreditCardSales(
    data: factory.task.returnCreditCardSales.IData
): IOperation<void> {
    return async (connection: mongoose.Connection) => {
        const actionRepo = new ActionRepo(connection);
        const transactionRepo = new TransactionRepo(connection);
        await SalesService.returnCreditCardSales(data.transactionId)(actionRepo, transactionRepo);
    };
}

export function returnOrder(
    data: factory.task.returnOrder.IData
): IOperation<void> {
    return async (connection: mongoose.Connection) => {
        const actionRepo = new ActionRepo(connection);
        const orderRepo = new OrderRepo(connection);
        const ownershipInfoRepo = new OwnershipInfoRepo(connection);
        const transactionRepo = new TransactionRepo(connection);
        await OrderService.cancelReservations(data.transactionId)(actionRepo, orderRepo, ownershipInfoRepo, transactionRepo);
    };
}
