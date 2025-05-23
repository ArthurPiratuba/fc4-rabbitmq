import amqp from "amqplib";

async function consumerWithAcks() {
    const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
    const channel = await connection.createChannel();

    const queue = "nfe.queue";

    await channel.assertExchange("amq.direct", "direct");
    await channel.assertQueue(queue, {
        deadLetterExchange: "dlx.exchange",
    });
    await channel.bindQueue(queue, "amq.direct", 'order');

    await channel.assertExchange("dlx.exchange", "direct");
    await channel.assertQueue("dlx.queue");
    await channel.bindQueue("dlx.queue", "dlx.exchange", "order");

    console.log(`[*] Waiting for messages in ${queue}. To exit press CTRL+C`);
    channel.consume(
        queue,
        (msg) => {
            //setTimeout(() => {
            const content = msg?.content.toString();
            if (!msg || !content) {
                console.log("[!] Received empty message, ignoring...");
                msg && channel.reject(msg, false); //dispara o dead letter, por causa do requeue:false
                return;
            }
            console.log(`[x] Receiveid '${content}'`);
            try {
                if (parseInt(content) > 5) {
                    throw new Error("Processing failed");
                }
                console.log("[x] Done Processing");
                channel.ack(msg);
            } catch (error: any) {
                console.error("[!] Processing error:", error.message);
                channel.nack(msg, false, true);
            }
            //}, 2000);
        },
        { noAck: false }
    );
}

consumerWithAcks().catch(console.error);