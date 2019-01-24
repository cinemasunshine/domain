// tslint:disable:max-classes-per-file completed-docs
/**
 * repository
 */
import { RedisRepository as AccountNumberRepo } from './repo/accountNumber';
import { MongoRepository as ActionRepo } from './repo/action';
import { MongoRepository as PrintActionRepo } from './repo/action/print';
import { RedisRepository as RegisterProgramMembershipActionInProgress } from './repo/action/registerProgramMembershipInProgress';
import { MongoRepository as CreativeWorkRepo } from './repo/creativeWork';
import { MongoRepository as EventRepo } from './repo/event';
import { MongoRepository as ScreeningEventItemAvailabilityRepo } from './repo/itemAvailability/screeningEvent';
import { MongoRepository as OrderRepo } from './repo/order';
import { RedisRepository as OrderNumberRepo } from './repo/orderNumber';
import { MongoRepository as OrganizationRepo } from './repo/organization';
import { MongoRepository as OwnershipInfoRepo } from './repo/ownershipInfo';
import { CognitoRepository as PersonRepo } from './repo/person';
import { MongoRepository as PlaceRepo } from './repo/place';
import { MongoRepository as ProgramMembershipRepo } from './repo/programMembership';
import { MongoRepository as TaskRepo } from './repo/task';
import { MongoRepository as TelemetryRepo } from './repo/telemetry';
import { MongoRepository as TransactionRepo } from './repo/transaction';

export class AccountNumber extends AccountNumberRepo { }
export class Action extends ActionRepo { }
export namespace action {
    export class Print extends PrintActionRepo { }
    export class RegisterProgramMembershipInProgress extends RegisterProgramMembershipActionInProgress { }
}
export class CreativeWork extends CreativeWorkRepo { }
export class Event extends EventRepo { }
export class Order extends OrderRepo { }
export class OrderNumber extends OrderNumberRepo { }
export class Organization extends OrganizationRepo { }
export class OwnershipInfo extends OwnershipInfoRepo { }
export class Person extends PersonRepo { }
export class Place extends PlaceRepo { }
export class ProgramMembership extends ProgramMembershipRepo { }
export class Task extends TaskRepo { }
export class Telemetry extends TelemetryRepo { }
export class Transaction extends TransactionRepo { }

export namespace itemAvailability {
    export class ScreeningEvent extends ScreeningEventItemAvailabilityRepo { }
}
