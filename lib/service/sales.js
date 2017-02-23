/**
 * 売上サービス
 *
 * @namespace SalesService
 */
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const GMO = require("@motionpicture/gmo-service");
const createDebug = require("debug");
const debug = createDebug('sskts-domain:service:sales');
/**
 * GMOオーソリ取消
 */
function cancelGMOAuth(authorization) {
    return () => __awaiter(this, void 0, void 0, function* () {
        debug('calling alterTran...');
        yield GMO.CreditService.alterTran({
            shopId: authorization.gmo_shop_id,
            shopPass: authorization.gmo_shop_pass,
            accessId: authorization.gmo_access_id,
            accessPass: authorization.gmo_access_pass,
            jobCd: GMO.Util.JOB_CD_VOID,
            amount: authorization.gmo_amount
        });
        // todo 失敗したら取引状態確認する?
    });
}
exports.cancelGMOAuth = cancelGMOAuth;
/**
 * GMO売上確定
 */
function settleGMOAuth(authorization) {
    return () => __awaiter(this, void 0, void 0, function* () {
        debug('calling alterTran...');
        yield GMO.CreditService.alterTran({
            shopId: authorization.gmo_shop_id,
            shopPass: authorization.gmo_shop_pass,
            accessId: authorization.gmo_access_id,
            accessPass: authorization.gmo_access_pass,
            jobCd: GMO.Util.JOB_CD_SALES,
            amount: authorization.gmo_amount
        });
        // todo 失敗したら取引状態確認する?
    });
}
exports.settleGMOAuth = settleGMOAuth;
