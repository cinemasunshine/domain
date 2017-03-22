/**
 * 作品ファクトリー
 *
 * @namespace TheaterFactory
 *
 * @param {string} id
 * @param {string} coa_title_code COA作品コード
 * @param {string} coa_title_branch_num COA作品枝番
 * @param {Theater} theater 劇場
 * @param {MultilingualString} name 名称
 * @param {string} name_kana 作品タイトル名（カナ）
 * @param {string} name_short 作品タイトル名省略
 * @param {string} name_original 原題
 * @param {number} minutes 上映時間
 * @param {string} date_start 公演開始予定日※日付は西暦8桁 "YYYYMMDD"
 * @param {string} date_end 公演終了予定日※日付は西暦8桁 "YYYYMMDD"
 * @param {string} kbn_eirin 映倫区分
 * @param {string} kbn_eizou 映像区分
 * @param {string} kbn_joueihousiki 上映方式区分
 * @param {string} kbn_jimakufukikae 字幕吹替区分
 */
import * as COA from '@motionpicture/coa-service';
import MultilingualString from './multilingualString';
import * as TheaterFactory from './theater';
export interface IFilm {
    id: string;
    coa_title_code: string;
    coa_title_branch_num: string;
    theater: string;
    name: MultilingualString;
    name_kana: string;
    name_short: string;
    name_original: string;
    minutes: number;
    date_start: string;
    date_end: string;
    kbn_eirin?: string;
    kbn_eizou?: string;
    kbn_joueihousiki?: string;
    kbn_jimakufukikae?: string;
}
/**
 * COAの作品抽出結果からFilmオブジェクトを作成する
 *
 * @export
 * @param {COA.MasterService.TitleResult} filmFromCOA
 */
export declare function createFromCOA(filmFromCOA: COA.MasterService.TitleResult): (theater: TheaterFactory.ITheater) => IFilm;
