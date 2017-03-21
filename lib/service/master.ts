/**
 * マスタサービス
 *
 * @namespace MasterService
 */

import * as COA from '@motionpicture/coa-service';
import * as createDebug from 'debug';
import * as monapt from 'monapt';

import * as Film from '../factory/film';
import MultilingualString from '../factory/multilingualString';
import * as Performance from '../factory/performance';
import * as Screen from '../factory/screen';
import * as Theater from '../factory/theater';

import FilmAdapter from '../adapter/film';
import PerformanceAdapter from '../adapter/performance';
import ScreenAdapter from '../adapter/screen';
import TheaterAdapter from '../adapter/theater';

export type TheaterOperation<T> = (adapter: TheaterAdapter) => Promise<T>;
export type FilmOperation<T> = (adapter: FilmAdapter) => Promise<T>;
export type ScreenOperation<T> = (adapter: ScreenAdapter) => Promise<T>;
export type PerformanceOperation<T> = (adapter: PerformanceAdapter) => Promise<T>;
export type TheaterAndScreenOperation<T> =
    (theaterRepo: TheaterAdapter, screenRepo: ScreenAdapter) => Promise<T>;
export type TheaterAndFilmOperation<T> =
    (theaterRepo: TheaterAdapter, filmRepo: FilmAdapter) => Promise<T>;
export type FilmAndScreenAndPerformanceOperation<T> =
    (filmRepo: FilmAdapter, screenRepo: ScreenAdapter, performanceRepo: PerformanceAdapter) => Promise<T>;

export interface ISearchPerformancesConditions {
    day?: string;
    theater?: string;
}
export interface ISearchPerformancesResult {
    id: string;
    theater: {
        id: string;
        name: MultilingualString;
    };
    screen: {
        id: string;
        name: MultilingualString;
    };
    film: {
        id: string;
        name: MultilingualString;
    };
    day: string;
    time_start: string;
    time_end: string;
    canceled: boolean;
}

const debug = createDebug('sskts-domain:service:master');

/**
 * 劇場インポート
 *
 * @param {string} theaterCode
 * @returns {TheaterOperation<void>}
 *
 * @memberOf MasterService
 */
export function importTheater(theaterCode: string): TheaterOperation<void> {
    return async (adapter: TheaterAdapter) => {
        // COAから取得
        const theaterFromCOA = await COA.MasterService.theater({
            theater_code: theaterCode
        });

        // 永続化
        const theater = Theater.createFromCOA(theaterFromCOA);
        debug('storing theater...', theater);
        await adapter.model.findByIdAndUpdate(theater.id, theater, { new: true, upsert: true }).exec();
        debug('theater stored.');
    };
}

/**
 * 作品インポート
 *
 * @param {string} theaterCode
 * @returns {TheaterAndFilmOperation<void>}
 *
 * @memberOf MasterService
 */
export function importFilms(theaterCode: string): TheaterAndFilmOperation<void> {
    return async (theaterAdapter: TheaterAdapter, filmRepo: FilmAdapter) => {
        // 劇場取得
        const doc = await theaterAdapter.model.findById(theaterCode).exec();
        if (doc === null) {
            throw new Error('theater not found.');
        }
        const theater = <Theater.ITheater>doc.toObject();

        // COAから作品取得
        const films = await COA.MasterService.title({
            theater_code: theaterCode
        });

        // 永続化
        await Promise.all(films.map(async (filmFromCOA) => {
            const film = Film.createFromCOA(filmFromCOA)(theater);
            debug('storing film...', film);
            await filmRepo.model.findByIdAndUpdate(film.id, film, { new: true, upsert: true }).exec();
            debug('film stored.');
        }));
    };
}

/**
 * スクリーンインポート
 *
 * @param {string} theaterCode
 * @returns {TheaterAndScreenOperation<void>}
 *
 * @memberOf MasterService
 */
export function importScreens(theaterCode: string): TheaterAndScreenOperation<void> {
    return async (theaterAdapter: TheaterAdapter, screenRepo: ScreenAdapter) => {
        // 劇場取得
        const doc = await theaterAdapter.model.findById(theaterCode).exec();
        if (doc === null) {
            throw new Error('theater not found.');
        }
        const theater = <Theater.ITheater>doc.toObject();

        // COAからスクリーン取得
        const screens = await COA.MasterService.screen({
            theater_code: theaterCode
        });

        // 永続化
        await Promise.all(screens.map(async (screenFromCOA) => {
            const screen = Screen.createFromCOA(screenFromCOA)(theater);
            debug('storing screen...');
            await screenRepo.model.findByIdAndUpdate(screen.id, screen, { new: true, upsert: true }).exec();
            debug('screen stored.');
        }));
    };
}

/**
 * パフォーマンスインポート
 *
 * @param {string} theaterCode
 * @param {string} dayStart
 * @param {string} dayEnd
 * @returns {FilmAndScreenAndPerformanceOperation<void>}
 *
 * @memberOf MasterService
 */
export function importPerformances(theaterCode: string, dayStart: string, dayEnd: string):
    FilmAndScreenAndPerformanceOperation<void> {
    return async (
        filmRepo: FilmAdapter,
        screenRepo: ScreenAdapter,
        performanceRepo: PerformanceAdapter
    ) => {
        // スクリーン取得
        const docs = await screenRepo.model.find({ theater: theaterCode })
            .setOptions({ maxTimeMS: 10000 })
            .exec();
        const screens = docs.map((doc) => <Screen.IScreen>doc.toObject());
        debug('screens:', screens);

        // COAからパフォーマンス取得
        const performances = await COA.MasterService.schedule({
            theater_code: theaterCode,
            begin: dayStart,
            end: dayEnd
        });

        // パフォーマンスごとに永続化トライ
        await Promise.all(performances.map(async (performanceFromCOA) => {
            const screenId = `${theaterCode}${performanceFromCOA.screen_code}`;
            const filmId = `${theaterCode}${performanceFromCOA.title_code}${performanceFromCOA.title_branch_num}`;

            // スクリーン存在チェック
            const screenOfPerformance = screens.find((screen) => (screen.id === screenId));
            if (screenOfPerformance === undefined) {
                console.error('screen not found.', screenId);
                return;
            }

            // 作品取得
            const doc = await filmRepo.model.findById(filmId).exec();
            if (doc === null) {
                console.error('film not found.', filmId);
                return;
            }
            const film = <Film.IFilm>doc.toObject();

            // 永続化
            const performance = Performance.createFromCOA(performanceFromCOA)(screenOfPerformance, film);
            debug('storing performance', performance);
            await performanceRepo.model.findByIdAndUpdate(performance.id, performance, { new: true, upsert: true }).exec();
            debug('performance stored.');
        }));
    };
}

/**
 * パフォーマンス検索
 *
 * @param {SearchPerformancesConditions} conditions
 * @returns {PerformanceOperation<Array<SearchPerformancesResult>>}
 *
 * @memberOf MasterService
 */
export function searchPerformances(conditions: ISearchPerformancesConditions):
    PerformanceOperation<ISearchPerformancesResult[]> {
    return async (performanceRepo: PerformanceAdapter): Promise<ISearchPerformancesResult[]> => {
        // 検索条件を作成
        const andConditions: any[] = [
            { _id: { $ne: null } }
        ];

        if (conditions.day !== undefined) {
            andConditions.push({ day: conditions.day });
        }

        if (conditions.theater !== undefined) {
            andConditions.push({ theater: conditions.theater });
        }

        debug('finding performances...', andConditions);
        const docs = await performanceRepo.model.find({ $and: andConditions })
            .setOptions({ maxTimeMS: 10000 })
            .populate('film')
            .populate('theater')
            .populate('screen')
            .exec();

        // todo 空席状況を追加

        return docs.map((doc) => {
            return {
                id: doc.get('id'),
                theater: {
                    id: doc.get('theater').id,
                    name: doc.get('theater').name
                },
                screen: {
                    id: doc.get('screen').id,
                    name: doc.get('screen').name
                },
                film: {
                    id: doc.get('film').id,
                    name: doc.get('film').name
                },
                day: doc.get('day'),
                time_start: doc.get('time_start'),
                time_end: doc.get('time_end'),
                canceled: doc.get('canceled')
            };
        });
    };
}

/**
 * IDで劇場検索
 *
 * @param {string} theaterId
 * @returns {TheaterOperation<monapt.Option<Theater>>}
 *
 * @memberOf MasterService
 */
export function findTheater(theaterId: string): TheaterOperation<monapt.Option<Theater.ITheater>> {
    debug('finding a theater...', theaterId);
    return async (adapter: TheaterAdapter) => {
        const doc = await adapter.model.findById(theaterId).exec();
        return (doc === null) ? monapt.None : monapt.Option(<Theater.ITheater>doc.toObject());
    };
}

/**
 * IDで作品検索
 *
 * @param {string} filmId
 * @returns {FilmOperation<monapt.Option<Film>>}
 *
 * @memberOf MasterService
 */
export function findFilm(filmId: string): FilmOperation<monapt.Option<Film.IFilm>> {
    debug('finding a film...', filmId);
    return async (adapter: FilmAdapter) => {
        const doc = await adapter.model.findById(filmId).exec();
        return (doc === null) ? monapt.None : monapt.Option(<Film.IFilm>doc.toObject());
    };
}

/**
 *
 *
 * @param {string} screenId
 * @returns {ScreenOperation<monapt.Option<Screen>>}
 *
 * @memberOf MasterService
 */
export function findScreen(screenId: string): ScreenOperation<monapt.Option<Screen.IScreen>> {
    debug('finding a screen...', screenId);
    return async (adapter: ScreenAdapter) => {
        const doc = await adapter.model.findById(screenId).exec();
        return (doc === null) ? monapt.None : monapt.Option(<Screen.IScreen>doc.toObject());
    };
}

/**
 * IDでパフォーマンス検索
 *
 * @param {string} performanceId
 * @returns {PerformanceOperation<monapt.Option<Performance>>}
 *
 * @memberOf MasterService
 */
export function findPerformance(performanceId: string): PerformanceOperation<monapt.Option<Performance.IPerformanceWithFilmAndScreen>> {
    debug('finding a performance...', performanceId);
    return async (adapter: PerformanceAdapter) => {
        const doc = await adapter.model.findById(performanceId)
            .populate('film')
            .populate('theater')
            .populate('screen')
            .exec();

        if (doc === null) {
            return monapt.None;
        } else {
            return monapt.Option(
                {
                    id: doc.get('id'),
                    theater: {
                        id: doc.get('theater').id,
                        name: doc.get('theater').name
                    },
                    screen: {
                        id: doc.get('screen').id,
                        name: doc.get('screen').name
                    },
                    film: {
                        id: doc.get('film').id,
                        name: doc.get('film').name,
                        name_kana: doc.get('film').name_kana,
                        name_short: doc.get('film').name_short,
                        name_original: doc.get('film').name_original,
                        minutes: doc.get('film').minutes
                    },
                    day: doc.get('day'),
                    time_start: doc.get('time_start'),
                    time_end: doc.get('time_end'),
                    canceled: doc.get('canceled')
                }
            );
        }
    };
}
