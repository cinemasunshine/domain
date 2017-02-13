/**
 * 取引照会キー
 *
 * @class TransactionInquiryKey
 *
 * @param {string} theater_code
 * @param {number} reserve_num
 * @param {string} tel
 */
export default class TransactionInquiryKey {
    constructor(
        readonly theater_code: string,
        readonly reserve_num: number,
        readonly tel: string
    ) {
        // todo validation
    }
}
