/// <reference types="mongoose" />
import ObjectId from '../objectId';
import Owner from '../owner';
/**
 * 匿名所有者
 *
 *
 * @class AnonymousOwner
 * @extends {Owner}
 */
export default class AnonymousOwner extends Owner {
    readonly _id: ObjectId;
    readonly name_first: string;
    readonly name_last: string;
    readonly email: string;
    readonly tel: string;
    /**
     * Creates an instance of AnonymousOwner.
     *
     * @param {ObjectId} _id
     * @param {string} name_first
     * @param {string} name_last
     * @param {string} email
     * @param {string} tel
     *
     * @memberOf AnonymousOwner
     */
    constructor(_id: ObjectId, name_first: string, name_last: string, email: string, tel: string);
}
