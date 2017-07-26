/**
 * イベントサービス
 *
 * @namespace service/event
 */

import * as COA from '@motionpicture/coa-service';
import * as createDebug from 'debug';
import * as moment from 'moment';
import * as monapt from 'monapt';

import ArgumentError from '../error/argument';

import * as IndividualScreeningEventFactory from '../factory/event/individualScreeningEvent';
import * as ScreeningEventFactory from '../factory/event/screeningEvent';
import EventType from '../factory/eventType';
import IMultilingualString from '../factory/multilingualString';
import * as MovieTheaterPlaceFactory from '../factory/place/movieTheater';
import PlaceType from '../factory/placeType';
import * as PerformanceStockStatusFactory from '../factory/stockStatus/performance';

import EventAdapter from '../adapter/event';
import PlaceAdapter from '../adapter/place';
// import PerformanceStockStatusAdapter from '../adapter/stockStatus/performance';

export interface ISearchPerformancesConditions {
    day?: string;
    theater?: string;
}
export interface ISearchPerformancesResult {
    id: string;
    theater: {
        id: string;
        name: IMultilingualString;
    };
    screen: {
        id: string;
        name: IMultilingualString;
    };
    film: {
        id: string;
        name: IMultilingualString;
        minutes: number;
    };
    day: string;
    time_start: string;
    time_end: string;
    canceled: boolean;
    stock_status: PerformanceStockStatusFactory.Expression | null;
}

const debug = createDebug('sskts-domain:service:event');

/**
 * 上映イベントインポート
 */
export function importScreeningEvents(theaterCode: string) {
    return async (eventAdapter: EventAdapter, placeAdapter: PlaceAdapter) => {
        // 劇場取得
        const movieTheaterDoc = await placeAdapter.placeModel.findOne(
            {
                branchCode: theaterCode,
                typeOf: PlaceType.MovieTheater
            }
        ).exec();
        if (movieTheaterDoc === null) {
            throw new ArgumentError('movieTheater not found.');
        }
        const movieTheater = <MovieTheaterPlaceFactory.IPlace>movieTheaterDoc.toObject();

        // COAから作品取得
        const filmsFromCOA = await COA.services.master.title({
            theaterCode: theaterCode
        });

        // 永続化
        await Promise.all(filmsFromCOA.map(async (filmFromCOA) => {
            const screeningEvent = ScreeningEventFactory.createFromCOA(filmFromCOA)(movieTheater);
            debug('storing screeningEvent...', filmFromCOA, screeningEvent);
            await eventAdapter.eventModel.findOneAndUpdate(
                {
                    identifier: screeningEvent.identifier,
                    typeOf: EventType.ScreeningEvent
                },
                screeningEvent,
                { upsert: true }
            ).exec();
            debug('screeningEvent stored.');
        }));
    };
}

/**
 * 個々の上映イベントインポート
 */
export function importIndividualScreeningEvents(theaterCode: string, importFrom: Date, importThrough: Date) {
    return async (
        eventAdapter: EventAdapter,
        placeAdapter: PlaceAdapter
    ) => {
        // 劇場取得
        const movieTheater = await placeAdapter.placeModel.findOne(
            {
                branchCode: theaterCode,
                typeOf: PlaceType.MovieTheater
            }
        ).exec()
            .then((doc) => {
                if (doc === null) {
                    throw new ArgumentError('theater not found.');
                }

                return <MovieTheaterPlaceFactory.IPlace>doc.toObject();
            });

        // COAからパフォーマンス取得
        const performances = await COA.services.master.schedule({
            theaterCode: theaterCode,
            begin: moment(importFrom).locale('ja').format('YYYYMMDD'),
            end: moment(importThrough).locale('ja').format('YYYYMMDD')
        });

        // パフォーマンスごとに永続化トライ
        await Promise.all(performances.map(async (performanceFromCOA) => {
            const screeningEventIdentifier = ScreeningEventFactory.createIdentifier(
                theaterCode, performanceFromCOA.titleCode, performanceFromCOA.titleBranchNum
            );

            // スクリーン存在チェック
            const screenRoom = movieTheater.containsPlace.find(
                (place) => place.branchCode === performanceFromCOA.screenCode
            );
            if (screenRoom === undefined) {
                console.error('screenRoom not found.', performanceFromCOA.screenCode);

                return;
            }

            // 上映イベント取得
            const screeningEventDoc = await eventAdapter.eventModel.findOne(
                {
                    identifier: screeningEventIdentifier,
                    typeOf: EventType.ScreeningEvent
                }
            ).exec();
            if (screeningEventDoc === null) {
                console.error('screeningEvent not found.', screeningEventIdentifier);

                return;
            }
            const screeningEvent = <ScreeningEventFactory.IEvent>screeningEventDoc.toObject();

            // 永続化
            const individualScreeningEvent = IndividualScreeningEventFactory.createFromCOA(performanceFromCOA)(screenRoom, screeningEvent);
            debug('storing individualScreeningEvent', individualScreeningEvent);
            await eventAdapter.eventModel.findOneAndUpdate(
                {
                    identifier: individualScreeningEvent.identifier,
                    typeOf: EventType.IndividualScreeningEvent
                },
                individualScreeningEvent,
                { new: true, upsert: true }
            ).exec();
            debug('individualScreeningEvent stored.');
        }));
    };
}

/**
 * 上映イベント検索
 * 空席状況情報がなかったバージョンに対して互換性を保つために
 * performanceStockStatusAdapterはundefinedでも使えるようになっている
 *
 * @param {SearchPerformancesConditions} conditions
 * @returns {PerformanceAndPerformanceStockStatusOperation<ISearchPerformancesResult[]>}
 *
 * @memberof service/master
 */
export function searchIndividualScreeningEvents(searchConditions: ISearchPerformancesConditions) {
    return async (
        eventAdapter: EventAdapter
        // performanceStockStatusAdapter?: PerformanceStockStatusAdapter
    ) => {
        // 検索条件を作成
        const conditions: any = {
            typeOf: EventType.IndividualScreeningEvent
        };

        if (searchConditions.day !== undefined) {
            conditions.startDate = {
                $gte: moment(searchConditions.day, 'YYYYMMDD').toDate(),
                $lt: moment(searchConditions.day, 'YYYYMMDD').add(1, 'day').toDate()
            };
        }

        if (searchConditions.theater !== undefined) {
            conditions['superEvent.location.branchCode'] = searchConditions.theater;
        }

        debug('finding individualScreeningEvents...', conditions);

        return <IndividualScreeningEventFactory.IEvent>await eventAdapter.eventModel.find(conditions)
            .setOptions({ maxTimeMS: 10000 })
            // .populate('film', '_id name minutes')
            // .populate('theater', '_id name')
            // .populate('screen', '_id name')
            .lean()
            .exec();

        // const performances: ISearchPerformancesResult[] = [];
        // await Promise.all(docs.map(async (doc) => {
        //     // 空席状況を追加
        //     let stockStatus = null;
        //     if (performanceStockStatusAdapter !== undefined) {
        //         stockStatus = await performanceStockStatusAdapter.findOne(doc.get('day'), doc.get('id'));
        //         debug('stockStatus:', stockStatus);
        //     }

        //     performances.push({
        //         id: doc.get('id'),
        //         theater: {
        //             id: doc.get('theater').id,
        //             name: doc.get('theater').name
        //         },
        //         screen: {
        //             id: doc.get('screen').id,
        //             name: doc.get('screen').name
        //         },
        //         film: {
        //             id: doc.get('film').id,
        //             name: doc.get('film').name,
        //             minutes: doc.get('film').minutes
        //         },
        //         day: doc.get('day'),
        //         time_start: doc.get('time_start'),
        //         time_end: doc.get('time_end'),
        //         canceled: doc.get('canceled'),
        //         stock_status: (stockStatus === null) ? null : stockStatus.expression
        //     });
        // }));

        // return performances;
    };
}

/**
 * IDで上映イベント検索
 */
export function findIndividualScreeningEventByIdentifier(identifier: string) {
    return async (eventAdapter: EventAdapter) => {
        const event = <IndividualScreeningEventFactory.IEvent>await eventAdapter.eventModel.findOne({
            typeOf: EventType.IndividualScreeningEvent,
            identifier: identifier
        }).lean().exec();

        return (event === null) ? monapt.None : monapt.Option(event);
    };
}
