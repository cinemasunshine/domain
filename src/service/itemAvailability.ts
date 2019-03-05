/**
 * 注文アイテムの在庫状況を表現するサービス
 */
import { repository } from '@cinerino/domain';

import * as COA from '@motionpicture/coa-service';
import * as createDebug from 'debug';
import * as moment from 'moment-timezone';

import * as MasterSyncService from './masterSync';

const debug = createDebug('sskts-domain:service:itemAvailability');

export type IItemAvailabilityOperation<T> = (repos: { itemAvailability: repository.itemAvailability.ScreeningEvent }) => Promise<T>;

/**
 * 劇場IDと上映日範囲から上映イベント在庫状況を更新する
 */
export function updateIndividualScreeningEvents(locationBranchCode: string, startFrom: Date, startThrough: Date):
    IItemAvailabilityOperation<void> {
    return async (repos: { itemAvailability: repository.itemAvailability.ScreeningEvent }) => {
        // COAから空席状況取得
        const countFreeSeatResult = await COA.services.reserve.countFreeSeat({
            theaterCode: locationBranchCode,
            begin: moment(startFrom).tz('Asia/Tokyo').format('YYYYMMDD'), // COAは日本時間で判断
            end: moment(startThrough).tz('Asia/Tokyo').format('YYYYMMDD') // COAは日本時間で判断
        });

        // 上映日ごとに
        await Promise.all(countFreeSeatResult.listDate.map(async (countFreeSeatDate) => {
            debug('saving screeningEvent item availability... day:', countFreeSeatDate.dateJouei);
            // 上映イベントごとに空席状況を生成して保管
            await Promise.all(
                countFreeSeatDate.listPerformance.map(async (countFreeSeatPerformance) => {
                    const eventId = MasterSyncService.createScreeningEventIdFromCOA({
                        theaterCode: countFreeSeatResult.theaterCode,
                        titleCode: countFreeSeatPerformance.titleCode,
                        titleBranchNum: countFreeSeatPerformance.titleBranchNum,
                        dateJouei: countFreeSeatDate.dateJouei,
                        screenCode: countFreeSeatPerformance.screenCode,
                        timeBegin: countFreeSeatPerformance.timeBegin
                    });

                    const itemAvailability = createItemAvailability(
                        // COAからのレスポンスが負の値の場合があるので調整
                        Math.max(0, countFreeSeatPerformance.cntReserveFree),
                        Math.max(0, countFreeSeatPerformance.cntReserveMax)
                    );

                    // 永続化
                    debug('saving item availability... identifier:', eventId);
                    await repos.itemAvailability.updateOne(
                        countFreeSeatDate.dateJouei,
                        eventId,
                        itemAvailability
                    );
                    debug('item availability saved');
                })
            );
        }));
    };
}

/**
 * 座席数から在庫状況表現を生成する
 */
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
export function createItemAvailability(
    numberOfAvailableSeats: number, numberOfAllSeats: number
): number {
    if (numberOfAllSeats === 0) {
        return 0;
    }

    // 残席数より空席率を算出
    // tslint:disable-next-line:no-magic-numbers
    return Math.floor(numberOfAvailableSeats / numberOfAllSeats * 100);
}
