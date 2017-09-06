/**
 * レポートサービス
 * todo 実験的実装中
 *
 * @namespace service/report
 */

import * as GMO from '@motionpicture/gmo-service';
import * as factory from '@motionpicture/sskts-factory';
import * as createDebug from 'debug';
import * as moment from 'moment';

import { MongoRepository as GMONotificationRepository } from '../repo/gmoNotification';
import { MongoRepository as TaskRepository } from '../repo/task';
import { MongoRepository as TelemetryRepository } from '../repo/telemetry';
import { MongoRepository as TransactionRepository } from '../repo/transaction';

export type TaskAndTransactionOperation<T> = (taskRepository: TaskRepository, transactionRepository: TransactionRepository) => Promise<T>;
export type TaskAndTelemetryAndTransactionOperation<T> =
    (taskRepository: TaskRepository, telemetryRepository: TelemetryRepository, transactionRepository: TransactionRepository) => Promise<T>;
export type GMONotificationOperation<T> = (gmoNotificationRepository: GMONotificationRepository) => Promise<T>;

const debug = createDebug('sskts-domain:service:report');
const TELEMETRY_UNIT_OF_MEASUREMENT_IN_SECONDS = 60; // 測定単位時間(秒)

/**
 * フローデータ
 *
 * @interface IFlow
 * @see https://en.wikipedia.org/wiki/Stock_and_flow
 */
export interface IFlow {
    transactions: {
        /**
         * 集計期間中に開始された取引数
         */
        numberOfStarted: number;
        /**
         * 集計期間中に成立した取引数
         */
        numberOfClosed: number;
        /**
         * 集計期間中に期限切れになった取引数
         */
        numberOfExpired: number;
        /**
         * 取引の合計所要時間(ミリ秒)
         */
        totalRequiredTimeInMilliseconds: number;
        /**
         * 取引の最大所要時間(ミリ秒)
         */
        maxRequiredTimeInMilliseconds: number;
        /**
         * 取引の最小所要時間(ミリ秒)
         */
        minRequiredTimeInMilliseconds: number;
        /**
         * 取引の合計金額(yen)
         */
        totalAmount: number;
        /**
         * 最大金額
         */
        maxAmount: number;
        /**
         * 最小金額
         */
        minAmount: number;
    };
    tasks: {
        /**
         * 集計期間中に作成されたタスク数
         */
        numberOfCreated: number;
        /**
         * 集計期間中に実行されたタスク数
         */
        numberOfExecuted: number;
        /**
         * 集計期間中に中止されたタスク数
         */
        numberOfAborted: number;
        /**
         * 合計待ち時間
         */
        totalLatencyInMilliseconds: number;
        /**
         * 最大待ち時間
         */
        maxLatencyInMilliseconds: number;
        /**
         * 最小待ち時間
         */
        minLatencyInMilliseconds: number;
        /**
         * 合計試行回数
         */
        totalNumberOfTrials: number;
        /**
         * 最大試行回数
         */
        maxNumberOfTrials: number;
        /**
         * 最小試行回数
         */
        minNumberOfTrials: number;
    };
    measured_from: Date;
    measured_to: Date;
}

/**
 * ストックデータ
 *
 * @interface IStock
 * @see https://en.wikipedia.org/wiki/Stock_and_flow
 */
export interface IStock {
    transactions: {
        numberOfUnderway: number;
    };
    tasks: {
        numberOfUnexecuted: number;
    };
    measured_at: Date;
}

export interface ITelemetry {
    flow: IFlow;
    stock: IStock;
}

/**
 * 測定データを作成する
 *
 * @returns {TaskAndTelemetryAndTransactionOperation<void>}
 * @memberof service/report
 */
export function createTelemetry(): TaskAndTelemetryAndTransactionOperation<void> {
    return async (
        taskRepository: TaskRepository,
        telemetryRepository: TelemetryRepository,
        transactionRepository: TransactionRepository
    ) => {
        const dateNow = moment();
        const measuredTo = moment.unix((dateNow.unix() - (dateNow.unix() % TELEMETRY_UNIT_OF_MEASUREMENT_IN_SECONDS)));
        const measuredFrom = moment(measuredTo).add(-TELEMETRY_UNIT_OF_MEASUREMENT_IN_SECONDS, 'seconds');
        const measuredAt = moment(measuredTo);

        const flowData = await createFlowTelemetry(measuredFrom.toDate(), measuredTo.toDate())(taskRepository, transactionRepository);
        const stockData = await createStockTelemetry(measuredAt.toDate())(taskRepository, transactionRepository);

        const telemetry: ITelemetry = {
            flow: flowData,
            stock: stockData
        };
        await telemetryRepository.telemetryModel.create(telemetry);
        debug('telemetry created', telemetry);
    };
}

/**
 * フロー計測データーを作成する
 *
 * @param {Date} measuredFrom 計測開始日時
 * @param {Date} measuredTo 計測終了日時
 * @returns {TaskAndTransactionOperation<IFlow>}
 */
export function createFlowTelemetry(measuredFrom: Date, measuredTo: Date): TaskAndTransactionOperation<IFlow> {
    // tslint:disable-next-line:max-func-body-length
    return async (
        taskRepository: TaskRepository,
        transactionRepository: TransactionRepository
    ) => {
        // 直近{TELEMETRY_UNIT_TIME_IN_SECONDS}秒に開始された取引数を算出する
        const numberOfTransactionsStarted = await transactionRepository.transactionModel.count({
            started_at: {
                $gte: measuredFrom,
                $lt: measuredTo
            }
        }).exec();

        // 平均所要時間算出(期間の成立取引リストを取得し、開始時刻と成立時刻の差を所要時間とする)
        const closedTransactions = await transactionRepository.transactionModel.find(
            {
                closed_at: {
                    $gte: measuredFrom,
                    $lt: measuredTo
                }
            },
            'started_at closed_at'
        ).exec();
        const numberOfTransactionsClosed = closedTransactions.length;
        const requiredTimes = closedTransactions.map(
            (transaction) => moment(transaction.get('closed_at')).diff(moment(transaction.get('started_at'), 'milliseconds'))
        );
        const totalRequiredTimeInMilliseconds = requiredTimes.reduce((a, b) => a + b, 0);
        const maxRequiredTimeInMilliseconds = requiredTimes.reduce((a, b) => Math.max(a, b), 0);
        const minRequiredTimeInMilliseconds =
            requiredTimes.reduce((a, b) => Math.min(a, b), (numberOfTransactionsClosed > 0) ? requiredTimes[0] : 0);

        // todo 金額算出
        // const amounts = await Promise.all(
        //     closedTransactions.map(async (transaction) => await transactionRepository.calculateAmountById(transaction.get('id')))
        // );
        const amounts: number[] = [];
        const totalAmount = amounts.reduce((a, b) => a + b, 0);
        const maxAmount = amounts.reduce((a, b) => Math.max(a, b), 0);
        const minAmount = amounts.reduce((a, b) => Math.min(a, b), (numberOfTransactionsClosed > 0) ? amounts[0] : 0);

        const numberOfTransactionsExpired = await transactionRepository.transactionModel.count({
            expired_at: {
                $gte: measuredFrom,
                $lt: measuredTo
            }
        }).exec();

        const numberOfTasksCreated = await taskRepository.taskModel.count({
            createdAt: {
                $gte: measuredFrom,
                $lt: measuredTo
            }
        }).exec();

        // 実行中止ステータスで、最終試行日時が範囲にあるものを実行タスク数とする
        const numberOfTasksAborted = await taskRepository.taskModel.count({
            last_tried_at: {
                $gte: measuredFrom,
                $lt: measuredTo
            },
            status: factory.taskStatus.Aborted
        }).exec();

        // 実行済みステータスで、最終試行日時が範囲にあるものを実行タスク数とする
        const executedTasks = await taskRepository.taskModel.find(
            {
                last_tried_at: {
                    $gte: measuredFrom,
                    $lt: measuredTo
                },
                status: factory.taskStatus.Executed
            },
            'runs_at last_tried_at number_of_tried'
        ).exec();
        const numberOfTasksExecuted = executedTasks.length;

        const latencies = await Promise.all(
            executedTasks.map(
                (task) => moment(task.get('last_tried_at')).diff(moment(task.get('runs_at'), 'milliseconds'))
            )
        );
        const totalLatency = latencies.reduce((a, b) => a + b, 0);
        const maxLatency = latencies.reduce((a, b) => Math.max(a, b), 0);
        const minLatency = latencies.reduce((a, b) => Math.min(a, b), (numberOfTasksExecuted > 0) ? latencies[0] : 0);

        const numbersOfTrials = await Promise.all(executedTasks.map((task) => <number>task.get('number_of_tried')));
        const totalNumberOfTrials = numbersOfTrials.reduce((a, b) => a + b, 0);
        const maxNumberOfTrials = numbersOfTrials.reduce((a, b) => Math.max(a, b), 0);
        const minNumberOfTrials = numbersOfTrials.reduce((a, b) => Math.min(a, b), (numberOfTasksExecuted > 0) ? numbersOfTrials[0] : 0);

        return {
            transactions: {
                numberOfStarted: numberOfTransactionsStarted,
                numberOfClosed: numberOfTransactionsClosed,
                numberOfExpired: numberOfTransactionsExpired,
                totalRequiredTimeInMilliseconds: totalRequiredTimeInMilliseconds,
                maxRequiredTimeInMilliseconds: maxRequiredTimeInMilliseconds,
                minRequiredTimeInMilliseconds: minRequiredTimeInMilliseconds,
                totalAmount: totalAmount,
                maxAmount: maxAmount,
                minAmount: minAmount
            },
            tasks: {
                numberOfCreated: numberOfTasksCreated,
                numberOfExecuted: numberOfTasksExecuted,
                numberOfAborted: numberOfTasksAborted,
                totalLatencyInMilliseconds: totalLatency,
                maxLatencyInMilliseconds: maxLatency,
                minLatencyInMilliseconds: minLatency,
                totalNumberOfTrials: totalNumberOfTrials,
                maxNumberOfTrials: maxNumberOfTrials,
                minNumberOfTrials: minNumberOfTrials
            },
            measured_from: measuredFrom,
            measured_to: measuredTo
        };
    };
}

/**
 * ストック計測データを作成する
 *
 * @param {Date} measuredAt 計測日時
 * @returns {TaskAndTransactionOperation<IStock>}
 */
export function createStockTelemetry(measuredAt: Date): TaskAndTransactionOperation<IStock> {
    // tslint:disable-next-line:max-func-body-length
    return async (
        taskRepository: TaskRepository,
        transactionRepository: TransactionRepository
    ) => {
        const numberOfTransactionsUnderway = await transactionRepository.transactionModel.count({
            $or: [
                // {measuredAt}以前に開始し、{measuredAt}以後に成立あるいは期限切れした取引
                {
                    started_at: {
                        $lte: measuredAt
                    },
                    $or: [
                        {
                            closed_at: {
                                $gt: measuredAt
                            }
                        },
                        {
                            expired_at: {
                                $gt: measuredAt
                            }
                        }
                    ]
                },
                // {measuredAt}以前に開始し、いまだに進行中の取引
                {
                    started_at: {
                        $lte: measuredAt
                    },
                    status: factory.transactionStatusType.InProgress
                }
            ]
        }).exec();

        const numberOfTasksUnexecuted = await taskRepository.taskModel.count({
            $or: [
                // {measuredAt}以前に作成され、{measuredAt}以後に実行試行されたタスク
                {
                    createdAt: {
                        $lte: measuredAt
                    },
                    $or: [
                        {
                            last_tried_at: {
                                $gt: measuredAt
                            }
                        }
                    ]
                },
                // {measuredAt}以前に作成され、いまだに未実行のタスク
                {
                    createdAt: {
                        $lte: measuredAt
                    },
                    status: factory.taskStatus.Ready
                }
            ]
        }).exec();

        return {
            transactions: {
                numberOfUnderway: numberOfTransactionsUnderway
            },
            tasks: {
                numberOfUnexecuted: numberOfTasksUnexecuted
            },
            measured_at: measuredAt
        };
    };
}

/**
 * カード決済GMO通知インターフェース
 * todo そのうち仕様が固まってきたらfactoryに移動
 */
export interface ICreditGMONotification {
    shop_id: string; // ショップID
    access_id: string; // 取引ID
    order_id: string; // オーダーID
    status: string; // 現状態
    job_cd: string; // 処理区分
    amount: string; // 利用金額
    tax: string; // 税送料
    currency: string; // 通貨コード
    forward: string; // 仕向先会社コード
    method: string; // 支払方法
    pay_times: string; // 支払回数
    tran_id: string; // トランザクションID
    approve: string; // 承認番号
    tran_date: string; // 処理日付
    err_code: string; // エラーコード
    err_info: string; // エラー詳細コード
    pay_type: string; // 決済方法
}

/**
 * GMO実売上検索
 * todo webhookで失敗した場合に通知は重複して入ってくる
 * そのケースをどう対処するか
 *
 * @memberof service/report
 */
export function searchGMOSales(dateFrom: Date, dateTo: Date): GMONotificationOperation<ICreditGMONotification[]> {
    return async (gmoNotificationRepository: GMONotificationRepository) => {
        // 'tran_date': '20170415230109'の形式
        return <ICreditGMONotification[]>await gmoNotificationRepository.gmoNotificationModel.find(
            {
                job_cd: GMO.utils.util.JobCd.Sales,
                tran_date: {
                    $gte: moment(dateFrom).format('YYYYMMDDHHmmss'),
                    $lte: moment(dateTo).format('YYYYMMDDHHmmss')
                }
            }
        ).lean().exec();
    };
}

/**
 * GMO実売上を診察にかける
 */
// export function examineGMOSales(notification: ICreditGMONotification) {
//     return async (transactionRepository: TransactionRepository) => {
//         if (notification.job_cd !== GMO.Util.JOB_CD_SALES) {
//             throw new ArgumentError('notification.job_cd', 'job_cd should be SALES');
//         }

//         if (!_.isEmpty(notification.err_code)) {
//             throw new Error(`err_code exists${notification.err_code}`);
//         }

//         // オーダーIDから劇場コードと予約番号を取得
//         // tslint:disable-next-line:no-magic-numbers
//         const theaterCode = notification.order_id.slice(8, 11);
//         // tslint:disable-next-line:no-magic-numbers
//         const reserveNum = parseInt(notification.order_id.slice(11, 19), 10);
//         debug('theaterCode, reserveNum:', theaterCode, reserveNum);
//         if (typeof theaterCode !== 'string' || !Number.isInteger(reserveNum)) {
//             throw new Error('invalid orderId');
//         }

//         const transactionDoc = await transactionRepository.transactionModel.findOne(
//             {
//                 status: TransactionStatus.CLOSED,
//                 'inquiry_key.theater_code': theaterCode,
//                 'inquiry_key.reserve_num': reserveNum
//             },
//             '_id'
//         ).exec();
//         debug('transactionDoc:', transactionDoc);

//         if (transactionDoc === null) {
//             throw new Error('transaction not found');
//         }

//         const authorizations = await transactionRepository.findAuthorizationsById(transactionDoc.get('id'));
//         const gmoAuthorization = <GMOAuthorizationFactory.IAuthorization>authorizations.find(
//             (authorization) => authorization.group === AuthorizationGroup.GMO
//         );
//         // GMOオーソリがなければ異常
//         if (gmoAuthorization === undefined) {
//             throw new Error('gmo authorization not found');
//         }
//         debug('gmoAuthorization:', gmoAuthorization);

//         // オーソリのオーダーIDと同一かどうか
//         if (gmoAuthorization.object.orderId !== notification.order_id) {
//             throw new Error('orderId not matched');
//         }

//         if (gmoAuthorization.object.accessId !== notification.access_id) {
//             throw new Error('accessId not matched');
//         }

//         if (gmoAuthorization.object.payType !== notification.pay_type) {
//             throw new Error('payType not matched');
//         }

//         // オーソリの金額と同一かどうか
//         // tslint:disable-next-line:no-magic-numbers
//         if (gmoAuthorization.price !== parseInt(notification.amount, 10)) {
//             throw new Error('amount not matched');
//         }

//         // health!
//     };
// }
