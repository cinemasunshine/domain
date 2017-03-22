/**
 * GMOオーソリファクトリー
 *
 * @namespace GMOAuthorizationFacroty
 */
import * as Authorization from '../authorization';
/**
 * GMOオーソリ
 *
 * @param {string} gmo_shop_id
 * @param {string} gmo_shop_pass
 * @param {string} gmo_order_id
 * @param {number} gmo_amount
 * @param {string} gmo_access_id
 * @param {string} gmo_access_pass
 * @param {string} gmo_job_cd
 * @param {string} gmo_pay_type
 */
export interface IGMOAuthorization extends Authorization.IAuthorization {
    gmo_shop_id: string;
    gmo_shop_pass: string;
    gmo_order_id: string;
    gmo_amount: number;
    gmo_access_id: string;
    gmo_access_pass: string;
    gmo_job_cd: string;
    gmo_pay_type: string;
}
export declare function create(args: {
    id?: string;
    price: number;
    owner_from: string;
    owner_to: string;
    gmo_shop_id: string;
    gmo_shop_pass: string;
    gmo_order_id: string;
    gmo_amount: number;
    gmo_access_id: string;
    gmo_access_pass: string;
    gmo_job_cd: string;
    gmo_pay_type: string;
}): IGMOAuthorization;
