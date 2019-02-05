import { IConnectionSettings, IOperation } from '../task';

import * as factory from '../../factory';
import { MongoRepository as ActionRepo } from '../../repo/action';

import * as StockService from '../stock';

/**
 * タスク実行関数
 */
export function call(data: factory.task.IData<factory.taskName.CancelSeatReservation>): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        const actionRepo = new ActionRepo(settings.connection);
        await StockService.cancelSeatReservationAuth(data.transactionId)({ action: actionRepo });
    };
}
