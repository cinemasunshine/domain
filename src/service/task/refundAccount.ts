import { pecorinoapi, repository } from '@cinerino/domain';

import { IConnectionSettings, IOperation } from '../task';

import * as factory from '../../factory';

import * as PaymentService from '../payment';

/**
 * タスク実行関数
 */
export function call(data: factory.task.IData<factory.taskName.RefundAccount>): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (settings.pecorinoEndpoint === undefined) {
            throw new Error('settings.pecorinoEndpoint undefined.');
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (settings.pecorinoAuthClient === undefined) {
            throw new Error('settings.pecorinoAuthClient undefined.');
        }

        const actionRepo = new repository.Action(settings.connection);
        const taskRepo = new repository.Task(settings.connection);
        const depositService = new pecorinoapi.service.transaction.Deposit({
            endpoint: settings.pecorinoEndpoint,
            auth: settings.pecorinoAuthClient
        });
        const transferService = new pecorinoapi.service.transaction.Transfer({
            endpoint: settings.pecorinoEndpoint,
            auth: settings.pecorinoAuthClient
        });
        await PaymentService.account.refundAccount(data)({
            action: actionRepo,
            task: <any>taskRepo,
            depositService: depositService,
            transferService: transferService
        });
    };
}
