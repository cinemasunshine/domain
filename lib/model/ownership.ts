import ObjectId from "./objectId";

/**
 * 所有権
 * 誰が、何を、所有するのか
 *
 * @export
 * @class Ownership
 */
export default class Ownership {
    /**
     * Creates an instance of Ownership.
     *
     * @param {ObjectId} _id
     * @param {ObjectId} owner 所有者
     * @param {boolean} authenticated 認証済みかどうか
     *
     * @memberOf Ownership
     */
    constructor(
        readonly _id: ObjectId,
        readonly owner: ObjectId,
        readonly authenticated: boolean,
    ) {
        // TODO validation
    }
}