import WebSocket from 'ws';
import { Connection } from '@solana/web3.js';
import { FillLog } from './manifest/accounts/FillLog';
import { PROGRAM_ID } from './manifest';
import { convertU128 } from './utils/numbers';
import bs58 from 'bs58';
import keccak256 from 'keccak256';
/**
 * FillFeed example implementation.
 */
export class FillFeed {
    connection;
    wss;
    constructor(connection) {
        this.connection = connection;
        this.wss = new WebSocket.Server({ port: 1234 });
        this.wss.on('connection', (ws) => {
            console.log('New client connected');
            ws.on('message', (message) => {
                console.log(`Received message: ${message}`);
            });
            ws.on('close', () => {
                console.log('Client disconnected');
            });
        });
    }
    /**
     * Parse logs in an endless loop.
     */
    async parseLogs(endEarly) {
        // Start with a hopefully recent signature.
        let lastSignature = (await this.connection.getSignaturesForAddress(PROGRAM_ID))[0].signature;
        // End early is 30 seconds, used for testing.
        const endTime = endEarly
            ? new Date(Date.now() + 30_000)
            : new Date(Date.now() + 1_000_000_000_000);
        while (new Date(Date.now()) < endTime) {
            await new Promise((f) => setTimeout(f, 10_000));
            const signatures = await this.connection.getSignaturesForAddress(PROGRAM_ID, {
                until: lastSignature,
            });
            // Flip it so we do oldest first.
            signatures.reverse();
            if (signatures.length == 0) {
                continue;
            }
            lastSignature = signatures[signatures.length - 1].signature;
            for (const signature of signatures) {
                await this.handleSignature(signature);
            }
        }
        this.wss.close();
    }
    /**
     * Handle a signature by fetching the tx onchain and possibly sending a fill
     * notification.
     */
    async handleSignature(signature) {
        console.log('Handling', signature.signature);
        const tx = await this.connection.getTransaction(signature.signature);
        if (!tx?.meta?.logMessages) {
            console.log('No log messages');
            return;
        }
        if (tx.meta.err != null) {
            console.log('Skipping failed tx');
            return;
        }
        const messages = tx?.meta?.logMessages;
        const programDatas = messages.filter((message) => {
            return message.includes('Program data:');
        });
        if (programDatas.length == 0) {
            console.log('No program datas');
            return;
        }
        for (const programDataEntry of programDatas) {
            const programData = programDataEntry.split(' ')[2];
            const byteArray = Uint8Array.from(atob(programData), (c) => c.charCodeAt(0));
            const buffer = Buffer.from(byteArray);
            // Hack to fix the difference in caching on the CI action.
            if (!buffer.subarray(0, 8).equals(fillDiscriminant) &&
                !buffer
                    .subarray(0, 8)
                    .equals(Buffer.from([52, 81, 147, 82, 119, 191, 72, 172]))) {
                continue;
            }
            const deserializedFillLog = FillLog.deserialize(buffer.subarray(8))[0];
            console.log('Got a fill', JSON.stringify(toFillLogResult(deserializedFillLog, signature.slot)));
            this.wss.clients.forEach((client) => {
                client.send(JSON.stringify(toFillLogResult(deserializedFillLog, signature.slot)));
            });
        }
    }
}
/**
 * Run a fill feed as a websocket server that clients can connect to and get
 * notifications of fills for all manifest markets.
 */
export async function runFillFeed() {
    const connection = new Connection(process.env.RPC_URL || 'http://127.0.0.1:8899', 'confirmed');
    const fillFeed = new FillFeed(connection);
    await fillFeed.parseLogs();
}
/**
 * Helper function for getting account discriminator that matches how anchor
 * generates discriminators.
 */
function genAccDiscriminator(accName) {
    return keccak256(Buffer.concat([
        Buffer.from(bs58.decode(PROGRAM_ID.toBase58())),
        Buffer.from('manifest::logs::'),
        Buffer.from(accName),
    ])).subarray(0, 8);
}
const fillDiscriminant = genAccDiscriminator('FillLog');
function toFillLogResult(fillLog, slot) {
    return {
        market: fillLog.market.toBase58(),
        maker: fillLog.maker.toBase58(),
        taker: fillLog.taker.toBase58(),
        baseAtoms: fillLog.baseAtoms.inner.toString(),
        quoteAtoms: fillLog.quoteAtoms.inner.toString(),
        price: convertU128(fillLog.price.inner),
        takerIsBuy: fillLog.takerIsBuy,
        makerSequenceNumber: fillLog.makerSequenceNumber.toString(),
        takerSequenceNumber: fillLog.takerSequenceNumber.toString(),
        slot,
    };
}
