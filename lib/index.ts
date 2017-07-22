/**
 * sskts-domainモジュール
 *
 * @module
 */

import * as COA from '@motionpicture/coa-service';
import * as GMO from '@motionpicture/gmo-service';
import * as mongoose from 'mongoose';
import * as redis from 'redis';

import * as ClientService from './service/client';
import * as MasterService from './service/master';
import * as NotificationService from './service/notification';
import * as ReportService from './service/report';
import * as SalesService from './service/sales';
import * as ShopService from './service/shop';
import * as StockService from './service/stock';
import * as StockStatusService from './service/stockStatus';
import * as TaskService from './service/task';
import * as TradeService from './service/trade';
import * as TradeInProgressService from './service/tradeInProgress';

import ActionAdapter from './adapter/action';
import ClientAdapter from './adapter/client';
import CreativeWorkAdapter from './adapter/creativeWork';
import EventAdapter from './adapter/event';
import GMONotificationAdapter from './adapter/gmoNotification';
import OrganizationAdapter from './adapter/organization';
import OwnerAdapter from './adapter/owner';
import OwnershipInfoAdapter from './adapter/ownershipInfo';
import PersonAdapter from './adapter/person';
import PlaceAdapter from './adapter/place';
import SendGridEventAdapter from './adapter/sendGridEvent';
import PerformanceStockStatusAdapter from './adapter/stockStatus/performance';
import TaskAdapter from './adapter/task';
import TelemetryAdapter from './adapter/telemetry';
import TransactionCountAdapter from './adapter/transactionCount';

import * as ActionFactory from './factory/action';
import * as AddNotificationActionEventFactory from './factory/actionEvent/addNotification';
import * as AuthorizeActionEventFactory from './factory/actionEvent/authorize';
import * as RemoveNotificationActionEventFactory from './factory/actionEvent/removeNotification';
import * as UnauthorizeActionEventFactory from './factory/actionEvent/unauthorize';
import ActionEventGroup from './factory/actionEventType';
import * as ActionScopeFactory from './factory/actionScope';
import ActionStatusType from './factory/actionStatusType';
import ActionTasksExportationStatus from './factory/actionTasksExportationStatus';
import * as CoaSeatReservationAuthorizationFactory from './factory/authorization/coaSeatReservation';
import * as GmoAuthorizationFactory from './factory/authorization/gmo';
import * as MvtkAuthorizationFactory from './factory/authorization/mvtk';
import AuthorizationGroup from './factory/authorizationGroup';
import * as GMOCardFactory from './factory/card/gmo';
import CardGroup from './factory/cardGroup';
import * as GMOCardIdFactory from './factory/cardId/gmo';
import * as ClientFactory from './factory/client';
import * as ClientEventFactory from './factory/clientEvent';
import * as ClientUserFactory from './factory/clientUser';
import EventType from './factory/eventType';
import * as EmailNotificationFactory from './factory/notification/email';
import NotificationGroup from './factory/notificationGroup';
import * as OrderInquiryKeyFactory from './factory/orderInquiryKey';
import * as CorporationOrganizationFactory from './factory/organization/corporation';
import * as MovieTheaterOrganizationFactory from './factory/organization/movieTheater';
import CorporationOrganizationIdentifier from './factory/organizationIdentifier/corporation';
import OrganizationType from './factory/organizationType';
import ReservationStatusType from './factory/reservationStatusType';
import * as PerformanceStockStatusFactory from './factory/stockStatus/performance';
import * as TaskFactory from './factory/task';
import * as TaskExecutionResultFactory from './factory/taskExecutionResult';
import TaskName from './factory/taskName';
import TaskStatus from './factory/taskStatus';
import * as URLFactory from './factory/url';

import ErrorCode from './errorCode';

/**
 * MongoDBクライアント`mongoose`
 *
 * @example
 * var promise = sskts.mongoose.connect('mongodb://localhost/myapp', {
 *     useMongoClient: true
 * });
 */
export import mongoose = mongoose;

/**
 * Redis Cacheクライアント
 *
 * @example
 * const client = sskts.redis.createClient({
 *      host: process.env.REDIS_HOST,
 *      port: process.env.REDIS_PORT,
 *      password: process.env.REDIS_KEY,
 *      tls: { servername: process.env.TEST_REDIS_HOST }
 * });
 */
export import redis = redis;

/**
 * COAのAPIクライアント
 *
 * @example
 * sskts.COA.services.master.theater({ theater_code: '118' }).then(() => {
 *     console.log(result);
 * });
 */
export import COA = COA;

/**
 * GMOのAPIクライアント
 *
 * @example
 * sskts.GMO.services.card.searchMember({
 *     siteId: '',
 *     sitePass: '',
 *     memberId: ''
 * }).then((result) => {
 *     console.log(result);
 * });
 */
export import GMO = GMO;

export namespace adapter {
    export function action(connection: mongoose.Connection) {
        return new ActionAdapter(connection);
    }
    export function client(connection: mongoose.Connection) {
        return new ClientAdapter(connection);
    }
    export function creativeWork(connection: mongoose.Connection) {
        return new CreativeWorkAdapter(connection);
    }
    export function event(connection: mongoose.Connection) {
        return new EventAdapter(connection);
    }
    export function gmoNotification(connection: mongoose.Connection) {
        return new GMONotificationAdapter(connection);
    }
    export function organization(connection: mongoose.Connection) {
        return new OrganizationAdapter(connection);
    }
    export function owner(connection: mongoose.Connection) {
        return new OwnerAdapter(connection);
    }
    export function ownershipInfo(connection: mongoose.Connection) {
        return new OwnershipInfoAdapter(connection);
    }
    export function person(connection: mongoose.Connection) {
        return new PersonAdapter(connection);
    }
    export function place(connection: mongoose.Connection) {
        return new PlaceAdapter(connection);
    }
    export namespace stockStatus {
        // tslint:disable-next-line:no-shadowed-variable
        export function performance(redisClient: redis.RedisClient) {
            return new PerformanceStockStatusAdapter(redisClient);
        }
    }
    export function sendGridEvent(connection: mongoose.Connection) {
        return new SendGridEventAdapter(connection);
    }
    export function task(connection: mongoose.Connection) {
        return new TaskAdapter(connection);
    }
    export function telemetry(connection: mongoose.Connection) {
        return new TelemetryAdapter(connection);
    }
    export function transactionCount(redisClient: redis.RedisClient) {
        return new TransactionCountAdapter(redisClient);
    }
}

export namespace service {
    export import client = ClientService;
    export import master = MasterService;
    export import notification = NotificationService;
    export import report = ReportService;
    export import sales = SalesService;
    export import shop = ShopService;
    export import stock = StockService;
    export import stockStatus = StockStatusService;
    export import task = TaskService;
    export import trade = TradeService;
    export import tradeInProgress = TradeInProgressService;
}

export namespace factory {
    export namespace authorization {
        export import coaSeatReservation = CoaSeatReservationAuthorizationFactory;
        export import gmo = GmoAuthorizationFactory;
        export import mvtk = MvtkAuthorizationFactory;
    }
    export import authorizationGroup = AuthorizationGroup;
    export namespace card {
        export import gmo = GMOCardFactory;
    }
    export namespace cardId {
        export import gmo = GMOCardIdFactory;
    }
    export import cardGroup = CardGroup;
    export import client = ClientFactory;
    export import clientEvent = ClientEventFactory;
    export import clientUser = ClientUserFactory;
    export namespace notification {
        export import email = EmailNotificationFactory;
    }
    export import eventType = EventType;
    export import notificationGroup = NotificationGroup;
    export namespace organization {
        export import corporation = CorporationOrganizationFactory;
        export import movieTheater = MovieTheaterOrganizationFactory;
    }
    export import orderInquiryKey = OrderInquiryKeyFactory;
    export namespace organizationIdentifier {
        export import corporation = CorporationOrganizationIdentifier;
    }
    export import organizationType = OrganizationType;
    export import reservationStatusType = ReservationStatusType;
    export namespace stockStatus {
        // tslint:disable-next-line:no-shadowed-variable
        export import performance = PerformanceStockStatusFactory;
    }
    export import task = TaskFactory;
    export import taskExecutionResult = TaskExecutionResultFactory;
    export import taskName = TaskName;
    export import taskStatus = TaskStatus;
    export import action = ActionFactory;
    export namespace actionEvent {
        export import addNotification = AddNotificationActionEventFactory;
        export import authorize = AuthorizeActionEventFactory;
        export import removeNotification = RemoveNotificationActionEventFactory;
        export import unauthorize = UnauthorizeActionEventFactory;
    }
    export import actionEventGroup = ActionEventGroup;
    export import actionScope = ActionScopeFactory;
    export import actionStatusType = ActionStatusType;
    export import actionTasksExportationStatus = ActionTasksExportationStatus;
    export import url = URLFactory;
}

export import errorCode = ErrorCode;
