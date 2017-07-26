/**
 * マスタサービス
 *
 * @namespace service/creativeWork
 */

import * as COA from '@motionpicture/coa-service';
import * as createDebug from 'debug';

import * as MovieFactory from '../factory/creativeWork/movie';
import CreativeWorkType from '../factory/creativeWorkType';

import CreativeWorkAdapter from '../adapter/creativeWork';

const debug = createDebug('sskts-domain:service:creativeWork');

/**
 * 映画作品インポート
 */
export function importMovies(theaterCode: string) {
    return async (creativeWorkAdapter: CreativeWorkAdapter) => {
        // COAから作品取得
        const filmsFromCOA = await COA.services.master.title({ theaterCode: theaterCode });

        // 永続化
        await Promise.all(filmsFromCOA.map(async (filmFromCOA) => {
            const movie = MovieFactory.createFromCOA(filmFromCOA);
            debug('storing movie...', movie);
            await creativeWorkAdapter.creativeWorkModel.findOneAndUpdate(
                {
                    identifier: movie.identifier,
                    typeOf: CreativeWorkType.Movie
                },
                movie,
                { upsert: true }
            ).exec();
            debug('movie stored.');
        }));
    };
}
