import * as factory from '@motionpicture/sskts-factory';
import { Connection } from 'mongoose';
import taskModel from './mongoose/model/task';

/**
 * タスク実行時のソート条件
 * @const
 */
const sortOrder4executionOfTasks = {
    numberOfTried: 1, // トライ回数の少なさ優先
    runsAt: 1 // 実行予定日時の早さ優先
};

/**
 * タスクレポジトリー
 *
 * @class TaskRepository
 */
export class MongoRepository {
    public readonly taskModel: typeof taskModel;

    constructor(connection: Connection) {
        this.taskModel = connection.model(taskModel.modelName);
    }

    public async save(task: factory.task.ITask) {
        await this.taskModel.findByIdAndUpdate(task.id, task, { upsert: true }).exec();
    }

    public async executeOneByName(taskName: factory.taskName): Promise<factory.task.ITask> {
        const doc = await this.taskModel.findOneAndUpdate(
            {
                status: factory.taskStatus.Ready,
                runsAt: { $lt: new Date() },
                name: taskName
            },
            {
                status: factory.taskStatus.Running, // 実行中に変更
                lastTriedAt: new Date(),
                $inc: {
                    remainingNumberOfTries: -1, // 残りトライ可能回数減らす
                    numberOfTried: 1 // トライ回数増やす
                }
            },
            { new: true }
        ).sort(sortOrder4executionOfTasks).exec();

        // タスクがなければ終了
        if (doc === null) {
            throw new factory.errors.NotFound('executable task');
        }

        return <factory.task.ITask>doc.toObject();
    }

    public async retry(lastTriedAt: Date) {
        await this.taskModel.update(
            {
                status: factory.taskStatus.Running,
                lastTriedAt: { $lt: lastTriedAt },
                remainingNumberOfTries: { $gt: 0 }
            },
            {
                status: factory.taskStatus.Ready // 実行前に変更
            },
            { multi: true }
        ).exec();
    }
}
