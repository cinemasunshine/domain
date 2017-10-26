/**
 * 座席予約承認資産移動ファクトリー
 *
 * @namespace factory/task/settleSeatReservationAuthorization
 */

import * as COASeatReservationAuthorizationFactory from '../authorization/coaSeatReservation';
import * as TaskFactory from '../task';
import * as TaskExecutionResult from '../taskExecutionResult';
import TaskName from '../taskName';
import TaskStatus from '../taskStatus';

export interface IData {
    authorization: COASeatReservationAuthorizationFactory.IAuthorization;
}

export interface ITask extends TaskFactory.ITask {
    data: IData;
}

export function create(args: {
    id?: string;
    status: TaskStatus;
    runs_at: Date;
    remaining_number_of_tries: number;
    last_tried_at: Date | null;
    number_of_tried: number;
    execution_results: TaskExecutionResult.ITaskExecutionResult[];
    data: IData;
}): ITask {
    // todo validation

    return TaskFactory.create({ ...args, ...{ name: TaskName.SettleSeatReservationAuthorization } });
}
