/**
 * 取引タスクエクスポートサンプル
 * @ignore
 */

const sskts = require('../');

async function main() {
    sskts.mongoose.connect(process.env.MONGOLAB_URI);

    await sskts.service.transaction.placeOrder.exportTasks(sskts.factory.transactionStatusType.Confirmed)(
        new sskts.repository.Task(sskts.mongoose.connection),
        new sskts.repository.Transaction(sskts.mongoose.connection)
    );

    sskts.mongoose.disconnect();
}

main().then(() => {
    console.log('success!');
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
