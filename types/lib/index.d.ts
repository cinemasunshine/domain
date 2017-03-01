/// <reference types="mongoose" />
/**
 * sskts-domainモジュール
 *
 * @module
 */
import { Connection } from 'mongoose';
import * as masterService from './service/master';
import * as notificationService from './service/notification';
import * as salesService from './service/sales';
import * as stockService from './service/stock';
import * as transactionService from './service/transaction';
import AssetRepository from './repository/interpreter/asset';
import FilmRepository from './repository/interpreter/film';
import OwnerRepository from './repository/interpreter/owner';
import PerformanceRepository from './repository/interpreter/performance';
import QueueRepository from './repository/interpreter/queue';
import ScreenRepository from './repository/interpreter/screen';
import TheaterRepository from './repository/interpreter/theater';
import TransactionRepository from './repository/interpreter/transaction';
import Asset from './model/asset';
import Authorization from './model/authorization';
import Notification from './model/notification';
import Ownership from './model/ownership';
import QueueStatus from './model/queueStatus';
import TransactionInquiryKey from './model/transactionInquiryKey';
import TransactionQueuesStatus from './model/transactionQueuesStatus';
import TransactionStatus from './model/transactionStatus';
export declare function createAssetRepository(connection: Connection): AssetRepository;
export declare function createFilmRepository(connection: Connection): FilmRepository;
export declare function createOwnerRepository(connection: Connection): OwnerRepository;
export declare function createPerformanceRepository(connection: Connection): PerformanceRepository;
export declare function createQueueRepository(connection: Connection): QueueRepository;
export declare function createScreenRepository(connection: Connection): ScreenRepository;
export declare function createTransactionRepository(connection: Connection): TransactionRepository;
export declare function createTheaterRepository(connection: Connection): TheaterRepository;
export declare const service: {
    master: typeof masterService;
    notification: typeof notificationService;
    sales: typeof salesService;
    stock: typeof stockService;
    transaction: typeof transactionService;
};
export declare const model: {
    Asset: typeof Asset;
    Authorization: typeof Authorization;
    Notification: typeof Notification;
    Ownership: typeof Ownership;
    QueueStatus: typeof QueueStatus;
    TransactionInquiryKey: typeof TransactionInquiryKey;
    TransactionQueuesStatus: typeof TransactionQueuesStatus;
    TransactionStatus: typeof TransactionStatus;
};