/// <reference types="mongoose" />
import { Connection } from 'mongoose';
import queueModel from './mongoose/model/queue';
/**
 * キューアダプター
 *
 * @export
 * @class QueueAdapter
 */
export default class QueueAdapter {
    readonly model: typeof queueModel;
    constructor(connection: Connection);
}