import amqp from "amqplib";

async function consumerWithAcks() {
    const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
    const channel = await connection.createChannel();
    const queue = "manualack_queue";
    await channel.assertQueue(queue);
    console.log(`[*] Waiting for messages in ${queue}. To exit press CTRL+C`);
    channel.consume(
        queue,
        (msg) => {
            //setTimeout(() => {
                const content = msg?.content.toString();
                if (!msg || !content) {
                    console.log("[!] Received empty message, ignoring...");
                    msg && channel.reject(msg);
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