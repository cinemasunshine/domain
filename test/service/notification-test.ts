/**
 * 通知サービステスト
 *
 * @ignore
 */
import * as sskts from '../../lib/index';

describe('notification service', () => {
    it('send an email', async () => {
        const notification = sskts.factory.notification.createEmail({
            from: 'noreply@localhost',
            to: 'hello@motionpicture.jp',
            subject: 'test subject',
            content: 'test content'
        });

        await sskts.service.notification.sendEmail(notification)();
    });

    it('report2developers ok', async () => {
        await sskts.service.notification.report2developers('test', 'test')();
    });
});
