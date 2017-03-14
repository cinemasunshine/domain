/// <reference types="mongoose" />
/**
 * 劇場リポジトリ
 *
 * @class TheaterAdapter
 */
import { Connection } from 'mongoose';
import theaterModel from './mongoose/model/theater';
export default class TheaterAdapter {
    readonly connection: Connection;
    model: typeof theaterModel;
    constructor(connection: Connection);
}
