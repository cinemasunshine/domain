import * as ActionEventFactory from '../actionEvent';
import * as Authorization from '../authorization';
/**
 * オーソリ追加取引イベント
 *
 * @interface TransactionEvent
 * @extends {TransactionEvent}
 * @param {Authorization} authorization
 * @memberof tobereplaced$
 */
export interface IActionEvent extends ActionEventFactory.IActionEvent {
    authorization: Authorization.IAuthorization;
}
/**
 *
 * @memberof tobereplaced$
 */
export declare function create(args: {
    id?: string;
    occurredAt: Date;
    authorization: Authorization.IAuthorization;
}): IActionEvent;
