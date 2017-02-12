/**
 * 承認ファクトリー
 *
 * @namespace AuthorizationFactory
 */
"use strict";
const coaSeatReservation_1 = require("../model/authorization/coaSeatReservation");
const gmo_1 = require("../model/authorization/gmo");
const objectId_1 = require("../model/objectId");
function createGMO(args) {
    return new gmo_1.default((args._id) ? args._id : objectId_1.default(), args.price, args.owner_from, args.owner_to, args.gmo_shop_id, args.gmo_shop_pass, args.gmo_order_id, args.gmo_amount, args.gmo_access_id, args.gmo_access_pass, args.gmo_job_cd, args.gmo_pay_type);
}
exports.createGMO = createGMO;
function createCOASeatReservation(args) {
    return new coaSeatReservation_1.default((args._id) ? args._id : objectId_1.default(), args.coa_tmp_reserve_num, args.coa_theater_code, args.coa_date_jouei, args.coa_title_code, args.coa_title_branch_num, args.coa_time_begin, args.coa_screen_code, args.price, args.owner_from, args.owner_to, args.assets);
}
exports.createCOASeatReservation = createCOASeatReservation;
