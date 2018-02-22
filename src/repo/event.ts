
import * as factory from '@motionpicture/sskts-factory';
import { Connection } from 'mongoose';
import eventModel from './mongoose/model/event';

/**
 * イベント抽象リポジトリー
 */
export abstract class Repository {
    public abstract async saveScreeningEvent(screeningEvent: factory.event.screeningEvent.IEvent): Promise<void>;
    public abstract async saveIndividualScreeningEvent(
        individualScreeningEvent: factory.event.individualScreeningEvent.IEvent
    ): Promise<void>;
    public abstract async cancelIndividualScreeningEvent(identifier: string): Promise<void>;
    public abstract async searchIndividualScreeningEvents(
        searchConditions: factory.event.individualScreeningEvent.ISearchConditions
    ): Promise<factory.event.individualScreeningEvent.IEvent[]>;
    public abstract async findIndividualScreeningEventByIdentifier(
        identifier: string
    ): Promise<factory.event.individualScreeningEvent.IEvent>;
}

/**
 * イベントリポジトリー
 */
export class MongoRepository implements Repository {
    public readonly eventModel: typeof eventModel;

    constructor(connection: Connection) {
        this.eventModel = connection.model(eventModel.modelName);
    }

    /**
     * save a screening event
     * 上映イベントを保管する
     * @param screeningEvent screeningEvent object
     */
    public async saveScreeningEvent(screeningEvent: factory.event.screeningEvent.IEvent) {
        await this.eventModel.findOneAndUpdate(
            {
                identifier: screeningEvent.identifier,
                typeOf: factory.eventType.ScreeningEvent
            },
            screeningEvent,
            { upsert: true }
        ).exec();
    }

    /**
     * save a individual screening event
     * 個々の上映イベントを保管する
     * @param individualScreeningEvent individualScreeningEvent object
     */
    public async saveIndividualScreeningEvent(individualScreeningEvent: factory.event.individualScreeningEvent.IEvent) {
        await this.eventModel.findOneAndUpdate(
            {
                identifier: individualScreeningEvent.identifier,
                typeOf: factory.eventType.IndividualScreeningEvent
            },
            individualScreeningEvent,
            { new: true, upsert: true }
        ).exec();
    }

    /**
     * 上映イベントをキャンセルする
     * @param identifier イベント識別子
     */
    public async cancelIndividualScreeningEvent(identifier: string) {
        await this.eventModel.findOneAndUpdate(
            {
                identifier: identifier,
                typeOf: factory.eventType.IndividualScreeningEvent
            },
            { eventStatus: factory.eventStatusType.EventCancelled },
            { new: true }
        ).exec();
    }

    /**
     * 個々の上映イベントを検索する
     * @param searchConditions 検索条件
     */
    public async searchIndividualScreeningEvents(
        searchConditions: factory.event.individualScreeningEvent.ISearchConditions
    ): Promise<factory.event.individualScreeningEvent.IEvent[]> {
        // MongoDB検索条件
        const andConditions: any[] = [
            {
                typeOf: factory.eventType.IndividualScreeningEvent
            }
        ];

        // 場所の識別子条件
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (Array.isArray(searchConditions.superEventLocationIdentifiers)) {
            andConditions.push({
                'superEvent.location.identifier': {
                    $exists: true,
                    $in: searchConditions.superEventLocationIdentifiers
                }
            });
        }

        // イベントステータス条件
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (Array.isArray(searchConditions.eventStatuses)) {
            andConditions.push({
                eventStatus: { $in: searchConditions.eventStatuses }
            });
        }

        // 作品識別子条件
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (Array.isArray(searchConditions.workPerformedIdentifiers)) {
            andConditions.push({
                'workPerformed.identifier': { $in: searchConditions.workPerformedIdentifiers }
            });
        }

        // 開始日時条件
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchConditions.startFrom !== undefined) {
            andConditions.push({
                startDate: { $gte: searchConditions.startFrom }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchConditions.startThrough !== undefined) {
            andConditions.push({
                startDate: { $lt: searchConditions.startThrough }
            });
        }

        // 終了日時条件
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchConditions.endFrom !== undefined) {
            andConditions.push({
                endDate: { $gte: searchConditions.endFrom }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchConditions.endThrough !== undefined) {
            andConditions.push({
                endDate: { $lt: searchConditions.endThrough }
            });
        }

        return <factory.event.individualScreeningEvent.IEvent[]>await this.eventModel.find({ $and: andConditions })
            .sort({ startDate: 1 })
            .setOptions({ maxTimeMS: 10000 })
            .lean()
            .exec();
    }

    /**
     * identifierで上映イベントを取得する
     */
    public async findIndividualScreeningEventByIdentifier(identifier: string): Promise<factory.event.individualScreeningEvent.IEvent> {
        const event = await this.eventModel.findOne({
            typeOf: factory.eventType.IndividualScreeningEvent,
            identifier: identifier
        }).lean().exec();

        if (event === null) {
            throw new factory.errors.NotFound('individualScreeningEvent');
        }

        return <factory.event.individualScreeningEvent.IEvent>event;
    }
}
