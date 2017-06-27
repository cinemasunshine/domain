/// <reference types="mongoose" />
/**
 * sskts-domainモジュール
 *
 * @module
 */
import { Connection } from 'mongoose';
import { RedisClient } from 'redis';
import * as ClientService from './service/client';
import * as MasterService from './service/master';
import * as MemberService from './service/member';
import * as NotificationService from './service/notification';
import * as QueueService from './service/queue';
import * as ReportService from './service/report';
import * as SalesService from './service/sales';
import * as StockService from './service/stock';
import * as StockStatusService from './service/stockStatus';
import * as TransactionService from './service/transaction';
import * as TransactionWithIdService from './service/transactionWithId';
import AssetAdapter from './adapter/asset';
import ClientAdapter from './adapter/client';
import FilmAdapter from './adapter/film';
import GMONotificationAdapter from './adapter/gmoNotification';
import OwnerAdapter from './adapter/owner';
import PerformanceAdapter from './adapter/performance';
import QueueAdapter from './adapter/queue';
import ScreenAdapter from './adapter/screen';
import SendGridEventAdapter from './adapter/sendGridEvent';
import PerformanceStockStatusAdapter from './adapter/stockStatus/performance';
import TelemetryAdapter from './adapter/telemetry';
import TheaterAdapter from './adapter/theater';
import TransactionAdapter from './adapter/transaction';
import TransactionCountAdapter from './adapter/transactionCount';
import * as SeatReservationAssetFactory from './factory/asset/seatReservation';
import AssetGroup from './factory/assetGroup';
import * as CoaSeatReservationAuthorizationFactory from './factory/authorization/coaSeatReservation';
import * as GmoAuthorizationFactory from './factory/authorization/gmo';
import * as MvtkAuthorizationFactory from './factory/authorization/mvtk';
import AuthorizationGroup from './factory/authorizationGroup';
import * as GMOCardFactory from './factory/card/gmo';
import CardGroup from './factory/cardGroup';
import * as ClientFactory from './factory/client';
import * as ClientEventFactory from './factory/clientEvent';
import * as FilmFactory from './factory/film';
import * as EmailNotificationFactory from './factory/notification/email';
import NotificationGroup from './factory/notificationGroup';
import * as AnonymousOwnerFactory from './factory/owner/anonymous';
import * as MemberOwnerFactory from './factory/owner/member';
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
import * as PerformanceStockStatusFactory from './factory/stockStatus/performance';
import * as TheaterFactory from './factory/theater';
import * as TransactionFactory from './factory/transaction';
import * as AddNotificationTransactionEventFactory from './factory/transactionEvent/addNotification';
import * as AuthorizeTransactionEventFactory from './factory/transactionEvent/authorize';
import * as RemoveNotificationTransactionEventFactory from './factory/transactionEvent/removeNotification';
import * as UnauthorizeTransactionEventFactory from './factory/transactionEvent/unauthorize';
import TransactionEventGroup from './factory/transactionEventGroup';
import * as TransactionInquiryKeyFactory from './factory/transactionInquiryKey';
import TransactionQueuesStatus from './factory/transactionQueuesStatus';
import * as TransactionScopeFactory from './factory/transactionScope';
import TransactionStatus from './factory/transactionStatus';
export declare namespace adapter {
    function asset(connection: Connection): AssetAdapter;
    function client(connection: Connection): ClientAdapter;
    function film(connection: Connection): FilmAdapter;
    function gmoNotification(connection: Connection): GMONotificationAdapter;
    function owner(connection: Connection): OwnerAdapter;
    function performance(connection: Connection): PerformanceAdapter;
    namespace stockStatus {
        function performance(redisClient: RedisClient): PerformanceStockStatusAdapter;
    }
    function queue(connection: Connection): QueueAdapter;
    function screen(connection: Connection): ScreenAdapter;
    function sendGridEvent(connection: Connection): SendGridEventAdapter;
    function telemetry(connection: Connection): TelemetryAdapter;
    function theater(connection: Connection): TheaterAdapter;
    function transaction(connection: Connection): TransactionAdapter;
    function transactionCount(redisClient: RedisClient): TransactionCountAdapter;
}
export declare namespace service {
    export import client = ClientService;
    export import master = MasterService;
    export import member = MemberService;
    export import notification = NotificationService;
    export import queue = QueueService;
    export import report = ReportService;
    export import sales = SalesService;
    export import stock = StockService;
    export import stockStatus = StockStatusService;
    export import transaction = TransactionService;
    export import transactionWithId = TransactionWithIdService;
}
export declare namespace factory {
    namespace asset {
        export import seatReservation = SeatReservationAssetFactory;
    }
    export import assetGroup = AssetGroup;
    namespace authorization {
        export import coaSeatReservation = CoaSeatReservationAuthorizationFactory;
        export import gmo = GmoAuthorizationFactory;
        export import mvtk = MvtkAuthorizationFactory;
    }
    export import authorizationGroup = AuthorizationGroup;
    namespace card {
        export import gmo = GMOCardFactory;
    }
    export import cardGroup = CardGroup;
    export import client = ClientFactory;
    export import clientEvent = ClientEventFactory;
    export import film = FilmFactory;
    namespace notification {
        export import email = EmailNotificationFactory;
    }
    export import notificationGroup = NotificationGroup;
    namespace owner {
        export import anonymous = AnonymousOwnerFactory;
        export import member = MemberOwnerFactory;
        export import promoter = PromoterOwnerFactory;
    }
    export import ownerGroup = OwnerGroup;
    export import ownership = OwnershipFactory;
    export import performance = PerformanceFactory;
    namespace queue {
        export import cancelAuthorization = CancelAuthorizationQueueFactory;
        export import disableTransactionInquiry = DisableTransactionInquiryQueueFactory;
        export import pushNotification = PushNotificationQueueFactory;
        export import settleAuthorization = SettleAuthorizationQueueFactory;
    }
    export import queueGroup = QueueGroup;
    export import queueStatus = QueueStatus;
    export import screen = ScreenFactory;
    namespace stockStatus {
        export import performance = PerformanceStockStatusFactory;
    }
    export import theater = TheaterFactory;
    export import transaction = TransactionFactory;
    namespace transactionEvent {
        export import addNotification = AddNotificationTransactionEventFactory;
        export import authorize = AuthorizeTransactionEventFactory;
        export import removeNotification = RemoveNotificationTransactionEventFactory;
        export import unauthorize = UnauthorizeTransactionEventFactory;
    }
    export import transactionEventGroup = TransactionEventGroup;
    export import transactionInquiryKey = TransactionInquiryKeyFactory;
    export import transactionQueuesStatus = TransactionQueuesStatus;
    export import transactionScope = TransactionScopeFactory;
    export import transactionStatus = TransactionStatus;
}
