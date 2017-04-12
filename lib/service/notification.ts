/**
 * 通知サービス
 *
 * @namespace NotificationService
 */
import * as createDebug from 'debug';
import * as httpStatus from 'http-status';
import * as request from 'request-promise-native';
import * as sendgrid from 'sendgrid';
import * as util from 'util';

import * as EmailNotificationFactory from '../factory/notification/email';

export type Operation<T> = () => Promise<T>;

const debug = createDebug('sskts-domain:service:notification');

/**
 * メール送信
 * https://sendgrid.com/docs/API_Reference/Web_API_v3/Mail/errors.html
 *
 * @param {EmailNotification} email
 * @returns {Operation<void>}
 * @see https://sendgrid.com/docs/API_Reference/Web_API_v3/Mail/errors.html
 *
 * @memberOf NotificationService
 */
export function sendEmail(email: EmailNotificationFactory.IEmailNotification): Operation<void> {
    return async () => {
        debug('sending email...', email.content);
        const mail = new sendgrid.mail.Mail(
            new sendgrid.mail.Email(email.from),
            email.subject,
            new sendgrid.mail.Email(email.to),
            new sendgrid.mail.Content('text/plain', email.content)
        );

        // 追跡用に通知IDをカスタムフィールドとしてセットする
        mail.addCustomArg(new sendgrid.mail.CustomArgs('notification', email.id));

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
        const response = await sg.API(request);
        debug('response is', response);

        // check the response.
        if (response.statusCode !== httpStatus.ACCEPTED) {
            throw new Error(`sendgrid request not accepted. response is ${util.inspect(response)}`);
        }
    };
}

/**
 * 開発者に報告する
 *
 * @param {string} subject
 * @param {string} content
 * @see https://notify-bot.line.me/doc/ja/
 */
export function report2developers(subject: string, content: string) {
    return async () => {
        if (process.env.SSKTS_DEVELOPER_LINE_NOTIFY_ACCESS_TOKEN === undefined) {
            throw new Error('access token for LINE Notify undefined');
        }

        const message = `
sskts-domain[${process.env.NODE_ENV}]:開発者へ報告があります
--------
${subject}
--------
${content}`
            ;

        // LINE通知APIにPOST
        const response = await request.post(
            {
                url: 'https://notify-api.line.me/api/notify',
                auth: { bearer: process.env.SSKTS_DEVELOPER_LINE_NOTIFY_ACCESS_TOKEN },
                form: {
                    message: message,
                    stickerPackageId: '1',
                    stickerId: '4'
                },
                json: true,
                simple: false,
                resolveWithFullResponse: true
            }
        ).promise();

        if (response.statusCode !== httpStatus.OK) {
            throw new Error(response.body.message);
        }
    };
}
