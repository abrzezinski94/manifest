import { Connection, Keypair, Transaction, sendAndConfirmTransaction, } from '@solana/web3.js';
import { Market } from '../src/market';
import { createMarket } from './createMarket';
import { assert } from 'chai';
import { createGlobalCreateInstruction } from '../src/manifest';
import { UiWrapper } from '../src/uiWrapperObj';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, createMintToInstruction, getAssociatedTokenAddressSync, } from '@solana/spl-token';
import { getGlobalAddress, getGlobalVaultAddress } from '../src/utils/global';
async function testWrapper() {
    const startTs = Date.now();
    const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
    const payerKeypair = Keypair.generate();
    const marketAddress = await createMarket(connection, payerKeypair);
    const market = await Market.loadFromAddress({
        connection,
        address: marketAddress,
    });
    market.prettyPrint();
    assert(null ==
        (await UiWrapper.fetchFirstUserWrapper(connection, payerKeypair.publicKey)), 'doesnt find a wrapper yet');
    {
        const setup = await UiWrapper.setupIxs(connection, marketAddress, payerKeypair.publicKey, payerKeypair.publicKey);
        const tx = new Transaction();
        tx.add(...setup.ixs);
        const signature = await sendAndConfirmTransaction(connection, tx, [
            payerKeypair,
            ...setup.signers,
        ]);
        console.log(`created ui-wrapper at ${setup.signers[0].publicKey} in ${signature}`);
    }
    const wrapperAcc = await UiWrapper.fetchFirstUserWrapper(connection, payerKeypair.publicKey);
    assert(wrapperAcc != null, 'should find wrapper');
    const wrapper = UiWrapper.loadFromBuffer({
        address: wrapperAcc.pubkey,
        buffer: wrapperAcc.account.data,
    });
    assert(wrapper.marketInfoForMarket(marketAddress)?.orders.length == 0, 'no orders yet in market');
    {
        const tx = new Transaction();
        const baseGlobal = getGlobalAddress(market.baseMint());
        const baseGlobalVault = getGlobalVaultAddress(market.baseMint());
        const baseGlobalIx = createGlobalCreateInstruction({
            payer: payerKeypair.publicKey,
            global: baseGlobal,
            mint: market.baseMint(),
            globalVault: baseGlobalVault,
            tokenProgram: TOKEN_PROGRAM_ID,
        });
        tx.add(baseGlobalIx);
        const quoteGlobal = getGlobalAddress(market.quoteMint());
        const quoteGlobalVault = getGlobalVaultAddress(market.quoteMint());
        const quoteGlobalIx = createGlobalCreateInstruction({
            payer: payerKeypair.publicKey,
            global: quoteGlobal,
            mint: market.quoteMint(),
            globalVault: quoteGlobalVault,
            tokenProgram: TOKEN_PROGRAM_ID,
        });
        tx.add(quoteGlobalIx);
        tx.add(createAssociatedTokenAccountIdempotentInstruction(payerKeypair.publicKey, getAssociatedTokenAddressSync(market.baseMint(), payerKeypair.publicKey), payerKeypair.publicKey, market.baseMint()), createMintToInstruction(market.baseMint(), getAssociatedTokenAddressSync(market.baseMint(), payerKeypair.publicKey), payerKeypair.publicKey, 10_000_000_000), wrapper.placeOrderIx(market, {}, {
            isBid: false,
            amount: 10,
            price: 0.02,
        }));
        const signature = await sendAndConfirmTransaction(connection, tx, [
            payerKeypair,
        ]);
        console.log(`placed order in ${signature}`);
    }
    await wrapper.reload(connection);
    // wrapper.prettyPrint();
    const [wrapperOrder] = wrapper.openOrdersForMarket(marketAddress);
    const amount = wrapperOrder.numBaseAtoms.toString() / 10 ** market.baseDecimals();
    const price = wrapperOrder.price * 10 ** (market.baseDecimals() - market.quoteDecimals());
    console.log('Amount:', amount);
    console.log('Price:', price);
    assert(Date.now() > wrapperOrder.clientOrderId);
    assert(wrapperOrder.clientOrderId > startTs);
    assert(10 === amount, 'correct amount');
    assert(0.02 === price, 'correct price');
    const allMarketPks = wrapper.activeMarkets();
    const allMarketInfos = await connection.getMultipleAccountsInfo(allMarketPks);
    const allMarkets = allMarketPks.map((address, i) => Market.loadFromBuffer({ address, buffer: allMarketInfos[i].data }));
    const [marketOrder] = allMarkets.flatMap((m) => m.openOrders());
    console.log('marketOrder', marketOrder);
    assert(marketOrder.numBaseTokens === amount, 'correct amount');
    assert(marketOrder.tokenPrice === price, 'correct price');
}
describe('ui_wrapper test', () => {
    it('can place orders and read them back', async () => {
        await testWrapper();
    });
});
