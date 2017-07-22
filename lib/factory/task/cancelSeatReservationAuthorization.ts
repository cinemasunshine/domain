/**
 * 座席予約承認解除タスクファクトリー
 *
 * @namespace factory/task/cancelSeatReservationAuthorization
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
    runsAt: Date;
    remainingNumberOfTries: number;
    lastTriedAt: Date | null;
    numberOfTried: number;
    executionResults: TaskExecutionResult.ITaskExecutionResult[];
    data: IData;
}): ITask {
    // todo validation

    return TaskFactory.create({ ...args, ...{ name: TaskName.CancelSeatReservationAuthorization } });
}
