/// <reference types="mongoose" />
/**
 * sskts-domainモジュール
 *
 * @module
 */
import { Connection } from 'mongoose';
import * as masterService from './service/master';
import * as notificationService from './service/notification';
import * as queueService from './service/queue';
import * as reportService from './service/report';
import * as salesService from './service/sales';
import * as stockService from './service/stock';
import * as transactionService from './service/transaction';
import * as transactionWithIdService from './service/transactionWithId';
import AssetAdapter from './adapter/asset';
import FilmAdapter from './adapter/film';
import OwnerAdapter from './adapter/owner';
import PerformanceAdapter from './adapter/performance';
import QueueAdapter from './adapter/queue';
import ScreenAdapter from './adapter/screen';
import TheaterAdapter from './adapter/theater';
import TransactionAdapter from './adapter/transaction';
import * as AssetFactory from './factory/asset';
import AssetGroup from './factory/assetGroup';
import * as CoaSeatReservationAuthorizationFactory from './factory/authorization/coaSeatReservation';
import * as GmoAuthorizationFactory from './factory/authorization/gmo';
import * as MvtkAuthorizationFactory from './factory/authorization/mvtk';
import AuthorizationGroup from './factory/authorizationGroup';
import * as FilmFactory from './factory/film';
import * as EmailNotificationFactory from './factory/notification/email';
import NotificationGroup from './factory/notificationGroup';
import * as AnonymousOwnerFactory from './factory/owner/anonymous';
import * as PromoterOwnerFactory from './factory/owner/promoter';
import OwnerGroup from './factory/ownerGroup';
import * as OwnershipFactory from './factory/ownership';
import * as PerformanceFactory from './factory/performance';
import * as CancelAuthorizationQueueFactory from './factory/queue/cancelAuthorization';
import * as DisableTransactionInquiryQueueFactory from './factory/queue/disableTransactionInquiry';
import * as PushNotificationQueueFactory from './factory/queue/pushNotification';
import * as SettleAuthorizationQueueFactory from './factory/queue/settleAuthorization';
import QueueGroup from './factory/queueGroup';
import QueueStatus from './factory/queueStatus';
import * as ScreenFactory from './factory/screen';
import * as TheaterFactory from './factory/theater';
import * as TransactionFactory from './factory/transaction';
import TransactionEventGroup from './factory/transactionEventGroup';
import * as TransactionInquiryKeyFactory from './factory/transactionInquiryKey';
import TransactionQueuesStatus from './factory/transactionQueuesStatus';
import TransactionStatus from './factory/transactionStatus';
export declare const adapter: {
    asset: (connection: Connection) => AssetAdapter;
    film: (connection: Connection) => FilmAdapter;
    owner: (connection: Connection) => OwnerAdapter;
    performance: (connection: Connection) => PerformanceAdapter;
    queue: (connection: Connection) => QueueAdapter;
    screen: (connection: Connection) => ScreenAdapter;
    theater: (connection: Connection) => TheaterAdapter;
    transaction: (connection: Connection) => TransactionAdapter;
};
export declare const service: {
    master: typeof masterService;
    notification: typeof notificationService;
    queue: typeof queueService;
    report: typeof reportService;
    sales: typeof salesService;
    stock: typeof stockService;
    transaction: typeof transactionService;
    transactionWithId: typeof transactionWithIdService;
};
export declare const factory: {
    asset: typeof AssetFactory;
    assetGroup: typeof AssetGroup;
    authorization: {
        coaSeatReservation: typeof CoaSeatReservationAuthorizationFactory;
        gmo: typeof GmoAuthorizationFactory;
        mvtk: typeof MvtkAuthorizationFactory;
    };
    authorizationGroup: typeof AuthorizationGroup;
    film: typeof FilmFactory;
    notification: {
        email: typeof EmailNotificationFactory;
    };
    notificationGroup: typeof NotificationGroup;
    owner: {
        anonymous: typeof AnonymousOwnerFactory;
        promoter: typeof PromoterOwnerFactory;
    };
    ownerGroup: typeof OwnerGroup;
    ownership: typeof OwnershipFactory;
    performance: typeof PerformanceFactory;
    queue: {
        cancelAuthorization: typeof CancelAuthorizationQueueFactory;
        disableTransactionInquiry: typeof DisableTransactionInquiryQueueFactory;
        pushNotification: typeof PushNotificationQueueFactory;
        settleAuthorization: typeof SettleAuthorizationQueueFactory;
    };
    queueGroup: typeof QueueGroup;
    queueStatus: typeof QueueStatus;
    screen: typeof ScreenFactory;
    theater: typeof TheaterFactory;
    transaction: typeof TransactionFactory;
    transactionEventGroup: typeof TransactionEventGroup;
    transactionInquiryKey: typeof TransactionInquiryKeyFactory;
    transactionQueuesStatus: typeof TransactionQueuesStatus;
    transactionStatus: typeof TransactionStatus;
};
