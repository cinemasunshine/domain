/**
 * 通知サービス
 *
 * @namespace NotificationService
 */

import * as createDebug from 'debug';
import * as SendGrid from 'sendgrid';
import Notification from '../model/notification';

export type SendGridOperation<T> = (sendgrid: typeof SendGrid) => Promise<T>;

const debug = createDebug('sskts-domain:service:notification');

/**
 * メール送信
 * https://sendgrid.com/docs/API_Reference/Web_API_v3/Mail/errors.html
 *
 * @param {EmailNotification} email
 * @returns {SendGridOperation<void>}
 *
 * @memberOf NotificationService
 */
export function sendEmail(email: Notification.EmailNotification): SendGridOperation<void> {
    return async (sendgrid: typeof SendGrid) => {
        const mail = new sendgrid.mail.Mail(
            new sendgrid.mail.Email(email.from),
            email.subject,
            new sendgrid.mail.Email(email.to),
            new sendgrid.mail.Content('text/html', email.content)
        );

        const sg = sendgrid(process.env.SENDGRID_API_KEY);

        const request = sg.emptyRequest({
            host: 'api.sendgrid.com',
            method: 'POST',
            path: '/v3/mail/send',
            headers: {},
            body: mail.toJSON(),
            queryParams: {},
            test: false,
            port: ''
        });

        debug('requesting sendgrid api...', request);
        await sg.API(request);
        // todo check the response.
        // const response = await sg.API(request);
    };
}
