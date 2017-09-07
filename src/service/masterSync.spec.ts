/**
 * masterSync service test
 * @ignore
 */

import * as assert from 'power-assert';
import * as sinon from 'sinon';
import * as sskts from '../index';

import { StubRepository as EventRepository } from '../repo/event';
import { StubRepository as PlaceRepository } from '../repo/place';

let sandbox: sinon.SinonSandbox;

before(() => {
    sandbox = sinon.sandbox.create();
});

describe('importMovies()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('repositoryの状態が正常であれば、エラーにならないはず', async () => {
        const numberOfWorks = 3;
        const creativeWorkRepo = new sskts.repository.CreativeWork(sskts.mongoose.connection);

        sandbox.mock(creativeWorkRepo).expects('saveMovie').exactly(numberOfWorks);
        sandbox.mock(sskts.COA.services.master).expects('title').once().returns(Promise.resolve(Array.from(Array(numberOfWorks))));
        sandbox.mock(sskts.factory.creativeWork.movie).expects('createFromCOA').exactly(numberOfWorks).returns({});

        const result = await sskts.service.masterSync.importMovies('123')(creativeWorkRepo);

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('importScreeningEvents()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('repositoryの状態が正常であれば、エラーにならないはず', async () => {
        const numberOfEvents = 3;
        const eventRepo = new EventRepository();
        const placeRepo = new PlaceRepository();

        sandbox.mock(eventRepo).expects('saveIndividualScreeningEvent').exactly(numberOfEvents);
        sandbox.mock(placeRepo).expects('findMovieTheaterByBranchCode').once().returns({ containsPlace: [] });
        sandbox.mock(sskts.COA.services.master).expects('title').once().returns(Promise.resolve([{}]));
        sandbox.mock(sskts.COA.services.master).expects('schedule').once().returns(Promise.resolve(
            Array.from(Array(numberOfEvents)).map(() => new Object())
        ));
        // tslint:disable-next-line:no-magic-numbers
        sandbox.mock(sskts.COA.services.master).expects('kubunName').exactly(6).returns(Promise.resolve([{}]));

        sandbox.stub(sskts.factory.event.screeningEvent, 'createFromCOA').returns({});
        sandbox.stub(sskts.factory.event.screeningEvent, 'createIdentifier').returns('');
        sandbox.stub(sskts.factory.event.individualScreeningEvent, 'createFromCOA').returns({});
        sandbox.stub(Array.prototype, 'find').returns({});

        const result = await sskts.service.masterSync.importScreeningEvents(
            '123', new Date(), new Date()
        )(eventRepo, placeRepo);

        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('importMovieTheater()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('repositoryの状態が正常であれば、エラーにならないはず', async () => {
        const placeRepo = new PlaceRepository();

        sandbox.mock(placeRepo).expects('saveMovieTheater').once();
        sandbox.stub(sskts.COA.services.master, 'theater').returns({});
        sandbox.stub(sskts.COA.services.master, 'screen').returns({});
        sandbox.stub(sskts.factory.place.movieTheater, 'createFromCOA').returns({});

        const result = await sskts.service.masterSync.importMovieTheater('123')(placeRepo);

        assert.equal(result, undefined);
        sandbox.verify();
    });
});
