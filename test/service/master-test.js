"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:missing-jsdoc
const assert = require("assert");
const mongoose = require("mongoose");
const sskts = require("../../lib/index");
let connection;
before(() => {
    connection = mongoose.createConnection(process.env.MONGOLAB_URI);
});
describe('master service', () => {
    it('importTheater fail', (done) => {
        sskts.service.master.importTheater('000')(sskts.createTheaterRepository(connection))
            .then(() => {
            done(new Error('thenable.'));
        })
            .catch(() => {
            done();
        });
    });
    it('importTheater ok', (done) => {
        sskts.service.master.importTheater('118')(sskts.createTheaterRepository(connection))
            .then(() => {
            done();
        })
            .catch((err) => {
            done(err);
        });
    });
    it('importScreens fail', (done) => {
        sskts.service.master.importScreens('000')(sskts.createTheaterRepository(connection), sskts.createScreenRepository(connection))
            .then(() => {
            done(new Error('thenable.'));
        })
            .catch(() => {
            done();
        });
    });
    it('importScreens ok', (done) => {
        sskts.service.master.importScreens('118')(sskts.createTheaterRepository(connection), sskts.createScreenRepository(connection))
            .then(() => {
            done();
        })
            .catch((err) => {
            done(err);
        });
    });
    it('importFilms fail', (done) => {
        sskts.service.master.importFilms('000')(sskts.createTheaterRepository(connection), sskts.createFilmRepository(connection))
            .then(() => {
            done(new Error('thenable.'));
        })
            .catch(() => {
            done();
        });
    });
    it('importFilms ok', (done) => {
        sskts.service.master.importFilms('118')(sskts.createTheaterRepository(connection), sskts.createFilmRepository(connection))
            .then(() => {
            done();
        })
            .catch((err) => {
            done(err);
        });
    });
    it('importPerformances fail', (done) => {
        sskts.service.master.importPerformances('000', '20170101', '20170331')(sskts.createFilmRepository(connection), sskts.createScreenRepository(connection), sskts.createPerformanceRepository(connection))
            .then(() => {
            done(new Error('thenable.'));
        })
            .catch(() => {
            done();
        });
    });
    it('importPerformances ok', (done) => {
        sskts.service.master.importPerformances('118', '20170101', '20170331')(sskts.createFilmRepository(connection), sskts.createScreenRepository(connection), sskts.createPerformanceRepository(connection))
            .then(() => {
            done();
        })
            .catch((err) => {
            done(err);
        });
    });
    it('findTheater ok', (done) => {
        sskts.service.master.findTheater('118')(sskts.createTheaterRepository(connection))
            .then((theaterOption) => {
            assert(theaterOption.isDefined);
            done();
        })
            .catch((err) => {
            done(err);
        });
    });
    it('findTheater not found', (done) => {
        sskts.service.master.findTheater('000')(sskts.createTheaterRepository(connection))
            .then((theaterOption) => {
            assert(theaterOption.isEmpty);
            done();
        })
            .catch((err) => {
            done(err);
        });
    });
    it('findPerformance not found', (done) => {
        sskts.service.master.findPerformance('000')(sskts.createPerformanceRepository(connection))
            .then((performanceOption) => {
            assert(performanceOption.isEmpty);
            done();
        })
            .catch((err) => {
            done(err);
        });
    });
});
