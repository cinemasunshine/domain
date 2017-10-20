import * as factory from '@motionpicture/sskts-factory';
import * as createDebug from 'debug';
import * as moment from 'moment';
import * as redis from 'redis';

const debug = createDebug('sskts-domain:repository:transactionCount');
const KEY_PREFIX: string = 'sskts-domain:transactionCount';

/**
 * 取引数redisレポジトリー
 * @class TransactionCountRepository
 */
// waiterに移行予定なのでテストコード省略
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
export class MongoRepository {
    public readonly redisClient: redis.RedisClient;

    constructor(redisClient: redis.RedisClient) {
        this.redisClient = redisClient;
    }

    // tslint:disable-next-line:no-single-line-block-comment
    /* istanbul ignore next */
    public static SCOPE2KEY(scope: factory.transactionScope.ITransactionScope): string {
        return `${KEY_PREFIX}:${factory.transactionScope.scope2String(scope)}`;
    }

    // tslint:disable-next-line:no-single-line-block-comment
    /* istanbul ignore next */
    public async incr(scope: factory.transactionScope.ITransactionScope) {
        return new Promise<number>((resolve, reject) => {
            // redisでカウントアップ
            const key = MongoRepository.SCOPE2KEY(scope);
            const expireAt = moment(scope.readyThrough).add(1, 'minutes').unix();
            const multi = this.redisClient.multi();
            multi
                .incr([key], debug)
                // unix timestampで期限セット
                .expireat([key, expireAt], debug)
                .exec((err, replies) => {
                    debug('incr executed.', key, err, replies);
                    if (err instanceof Error) {
                        reject(err);

                        return;
                    }

                    // tslint:disable-next-line:no-magic-numbers
                    resolve(parseInt(replies[0], 10));
                });
        });
    }

    // tslint:disable-next-line:no-single-line-block-comment
    /* istanbul ignore next */
    public async getByScope(scope: factory.transactionScope.ITransactionScope) {
        return new Promise<number>((resolve, reject) => {
            const key = MongoRepository.SCOPE2KEY(scope);
            this.redisClient.get([key], (err, replies) => {
                debug(`get ${key}`, err, replies);
                if (err instanceof Error) {
                    reject(err);

                    return;
                }

                // nullならまだ取引が発生していないので0
                // tslint:disable-next-line:no-magic-numbers
                const numberOfTransactions = (replies !== null) ? parseInt(replies, 10) : 0;
                resolve(numberOfTransactions);
            });
        });
    }
}
