/**
 * sskts-domainモジュール
 *
 * @module
 */
import { Connection } from 'mongoose';

import * as masterService from './service/master';
import * as notificationService from './service/notification';
import * as queueService from './service/queue';
import * as salesService from './service/sales';
import * as stockService from './service/stock';
import * as transactionService from './service/transaction';

import AssetAdapter from './adapter/asset';
import FilmAdapter from './adapter/film';
import OwnerAdapter from './adapter/owner';
import PerformanceAdapter from './adapter/performance';
import QueueAdapter from './adapter/queue';
import ScreenAdapter from './adapter/screen';
import TheaterAdapter from './adapter/theater';
import TransactionAdapter from './adapter/transaction';

import * as asset from './factory/asset';
import * as authorization from './factory/authorization';
import * as notification from './factory/notification';
import * as owner from './factory/owner';
import * as ownership from './factory/ownership';
import queueStatus from './factory/queueStatus';
import * as transactionInquiryKey from './factory/transactionInquiryKey';
import transactionQueuesStatus from './factory/transactionQueuesStatus';
import transactionStatus from './factory/transactionStatus';

export const adapter = {
    asset: (connection: Connection) => {
        return new AssetAdapter(connection);
    },
    film: (connection: Connection) => {
        return new FilmAdapter(connection);
    },
    owner: (connection: Connection) => {
        return new OwnerAdapter(connection);
    },
    performance: (connection: Connection) => {
        return new PerformanceAdapter(connection);
    },
    queue: (connection: Connection) => {
        return new QueueAdapter(connection);
    },
    screen: (connection: Connection) => {
        return new ScreenAdapter(connection);
    },
    theater: (connection: Connection) => {
        return new TheaterAdapter(connection);
    },
    transaction: (connection: Connection) => {
        return new TransactionAdapter(connection);
    }
};

export const service = {
    master: masterService,
    notification: notificationService,
    queue: queueService,
    sales: salesService,
    stock: stockService,
    transaction: transactionService
};

export const factory = {
    asset,
    authorization,
    notification,
    owner,
    ownership,
    queueStatus,
    transactionInquiryKey,
    transactionQueuesStatus,
    transactionStatus
};
