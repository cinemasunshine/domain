/**
 * パフォーマンスファクトリー
 *
 * @namespace TheaterFactory
 *
 * @param {string} id
 * @param {Theater} theater 劇場
 * @param {Screen} screen スクリーン
 * @param {Film} film 作品
 * @param {string} day 上映日(※日付は西暦8桁 "YYYYMMDD")
 * @param {string} time_start 上映開始時刻
 * @param {string} time_end 上映終了時刻
 * @param {boolean} canceled 上映中止フラグ
 */
import * as COA from '@motionpicture/coa-service';
import * as FilmFactory from './film';
import MultilingualString from './multilingualString';
import * as ScreenFactory from './screen';
export interface IReferences {
    theater: string;
    screen: string;
    film: string;
}
export interface IReferencesWithDetails {
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
        name_kana: string;
        name_short: string;
        name_original: string;
        minutes: number;
    };
}
export interface ICOAFields {
    coa_trailer_time: number;
    coa_kbn_service: string;
    coa_kbn_acoustic: string;
    coa_name_service_day: string;
    coa_available_num: number;
    /**
     * 予約開始日
     * 予約可能になる日付(YYYYMMDD)
     */
    coa_rsv_start_date: string;
    /**
     * 予約終了日
     * 予約終了になる日付(YYYYMMDD)
     */
    coa_rsv_end_date: string;
    /**
     * 先行予約フラグ
     * 先行予約の場合は'1'、それ以外は'0'
     */
    coa_flg_early_booking: string;
}
export interface IPerformanceBase {
    id: string;
    day: string;
    time_start: string;
    time_end: string;
    canceled: boolean;
}
export declare type IPerformance = IPerformanceBase & ICOAFields & IReferences;
/**
 * 劇場、作品、スクリーンの詳細ありパフォーマンスインターフェース
 */
export declare type IPerformanceWithReferenceDetails = IPerformanceBase & ICOAFields & IReferencesWithDetails;
export declare function createFromCOA(performanceFromCOA: COA.MasterService.IScheduleResult): (screen: ScreenFactory.IScreen, film: FilmFactory.IFilm) => IPerformance;