import * as COA from '@motionpicture/coa-service';
import MultilingualString from './multilingualString';
import Theater from './theater';
/**
 * スクリーン
 *
 * @class Screen
 *
 * @param {string} _id
 * @param {Theater} theater 劇場
 * @param {string} coa_screen_code COAスクリーンコード
 * @param {MultilingualString} name スクリーン名称
 * @param {Screen.ISection[]} sections スクリーンセクションリスト
 */
declare class Screen {
    readonly _id: string;
    readonly theater: Theater;
    readonly coa_screen_code: string;
    readonly name: MultilingualString;
    readonly sections: Screen.ISection[];
    constructor(_id: string, theater: Theater, coa_screen_code: string, name: MultilingualString, sections: Screen.ISection[]);
}
declare namespace Screen {
    /**
     * スクリーン座席
     *
     *
     * @interface Seat
     */
    interface ISeat {
        /**
         * 座席コード
         *
         * @type {string}
         * @memberOf Seat
         */
        code: string;
    }
    /**
     * スクリーンセクション
     *
     *
     * @interface Section
     */
    interface ISection {
        /**
         * セクションコード
         *
         * @type {string}
         * @memberOf Section
         */
        code: string;
        /**
         * セクション名称
         *
         * @type {MultilingualString}
         * @memberOf Section
         */
        name: MultilingualString;
        /**
         * 座席リスト
         *
         * @type {Array<Seat>}
         * @memberOf Section
         */
        seats: ISeat[];
    }
    interface IScreen {
        _id: string;
        theater: Theater;
        coa_screen_code: string;
        name: MultilingualString;
        sections: ISection[];
    }
    function create(args: IScreen): Screen;
    function createFromCOA(screenFromCOA: COA.findScreensByTheaterCodeInterface.Result): (theater: Theater) => Promise<Screen>;
}
export default Screen;
