// tslint:disable:variable-name
import AssetGroup from './assetGroup';
import Authorization from './authorization';
import ObjectId from './objectId';
import Ownership from './ownership';

/**
 * 資産
 *
 * @class Asset
 *
 * @param {ObjectId} _id ID
 * @param {AssetGroup} group 資産グループ
 * @param {Ownership} ownership 所有権
 * @param {number} price 価格
 * @param {Array<Authorization>} authorizations 承認リスト
 */
class Asset {
    constructor(
        readonly _id: ObjectId,
        readonly group: AssetGroup,
        readonly ownership: Ownership,
        readonly price: number,
        readonly authorizations: Authorization[]
    ) {
        // todo validation
    }
}

namespace Asset {
    /**
     * 座席予約資産
     *
     * todo 座席予約資産の属性はこれでよいか
     *
     * @class SeatReservationAsset
     * @extends {Asset}
     *
     * @param {ObjectId} _id
     * @param {Ownership} ownership 所有権
     * @param {Array<Authorization>} authorizations 承認リスト
     * @param {string} performance パフォーマンス
     * @param {string} section スクリーンセクション
     * @param {string} seat_code 座席コード
     * @param {string} ticket_code 券種コード
     * @param {string} ticket_name_ja
     * @param {string} ticket_name_en
     * @param {string} ticket_name_kana
     * @param {number} std_price
     * @param {number} add_price
     * @param {number} dis_price
     * @param {number} sale_price
     */
    // tslint:disable-next-line:max-classes-per-file
    export class SeatReservationAsset extends Asset {
        constructor(
            readonly _id: ObjectId,
            readonly ownership: Ownership,
            readonly authorizations: Authorization[],
            readonly performance: string,
            readonly section: string,
            readonly seat_code: string,
            readonly ticket_code: string,
            readonly ticket_name_ja: string,
            readonly ticket_name_en: string,
            readonly ticket_name_kana: string,
            readonly std_price: number,
            readonly add_price: number,
            readonly dis_price: number,
            readonly sale_price: number
        ) {
            // todo validation

            super(
                _id,
                AssetGroup.SEAT_RESERVATION,
                ownership,
                sale_price,
                authorizations
            );
        }
    }

    export interface ISeatReservationAsset {
        _id?: ObjectId;
        ownership: Ownership;
        authorizations: Authorization[];
        performance: string;
        section: string;
        seat_code: string;
        ticket_code: string;
        ticket_name_ja: string;
        ticket_name_en: string;
        ticket_name_kana: string;
        std_price: number;
        add_price: number;
        dis_price: number;
        sale_price: number;
    }

    /**
     * 座席予約資産を作成する
     *
     * @returns {SeatReservationAsset}
     * @memberof Asset
     */
    export function createSeatReservation(args: ISeatReservationAsset) {
        return new SeatReservationAsset(
            (args._id) ? args._id : ObjectId(),
            args.ownership,
            args.authorizations,
            args.performance,
            args.section,
            args.seat_code,
            args.ticket_code,
            args.ticket_name_ja,
            args.ticket_name_en,
            args.ticket_name_kana,
            args.std_price,
            args.add_price,
            args.dis_price,
            args.sale_price
        );
    }
}

export default Asset;
