// tslint:disable:max-classes-per-file completed-docs
/**
 * service module
 */
import { service } from '@cinerino/domain';

import * as AccountService from './service/account';
import * as DeliveryService from './service/delivery';
import * as ItemAvailabilityService from './service/itemAvailability';
import * as MasterSyncService from './service/masterSync';
import * as OfferService from './service/offer';
import * as OrderService from './service/order';
import * as PaymentService from './service/payment';
import * as ProgramMembershipService from './service/programMembership';
import * as ReportService from './service/report';
import * as StockService from './service/stock';
import * as TaskService from './service/task';
import * as PlaceOrderTransactionService from './service/transaction/placeOrder';
import * as PlaceOrderInProgressTransactionService from './service/transaction/placeOrderInProgress';
import * as ReturnOrderTransactionService from './service/transaction/returnOrder';

export import account = AccountService;
export import delivery = DeliveryService;
export import offer = OfferService;
export import itemAvailability = ItemAvailabilityService;
export import masterSync = MasterSyncService;
export import notification = service.notification;
export import order = OrderService;
export import person = service.person;
// export namespace person {
//     export import creditCard = PersonCreditCardService;
// }
export import programMembership = ProgramMembershipService;
export import report = ReportService;
export import reservation = service.reservation;
export import payment = PaymentService;
export import stock = StockService;
export import task = TaskService;
export namespace transaction {
    export import placeOrder = PlaceOrderTransactionService;
    export import placeOrderInProgress = PlaceOrderInProgressTransactionService;
    export import returnOrder = ReturnOrderTransactionService;
}
export import util = service.util;
