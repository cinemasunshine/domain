/**
 * ムビチケ承認資産移動タスクファクトリー
 *
 * @namespace factory/task/settleMvtkAuthorization
 */
import * as MvtkAuthorizationFactory from '../authorization/mvtk';
import * as TaskFactory from '../task';
import * as TaskExecutionResult from '../taskExecutionResult';
import TaskStatus from '../taskStatus';
export interface IData {
    authorization: MvtkAuthorizationFactory.IAuthorization;
}
export interface ITask extends TaskFactory.ITask {
    data: IData;
}
export declare function create(args: {
    id?: string;
    status: TaskStatus;
    runs_at: Date;
    max_number_of_try: number;
    last_tried_at: Date | null;
    number_of_tried: number;
    execution_results: TaskExecutionResult.ITaskExecutionResult[];
    data: IData;
}): ITask;
