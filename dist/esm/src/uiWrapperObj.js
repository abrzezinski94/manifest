import { publicKey as beetPublicKey } from '@metaplex-foundation/beet-solana';
import { Keypair, SystemProgram, } from '@solana/web3.js';
import { createClaimSeatInstruction, createCreateWrapperInstruction, createPlaceOrderInstruction, createSettleFundsInstruction, OrderType, PROGRAM_ID, } from './ui_wrapper';
import { marketInfoBeet, openOrderBeet } from './utils/beet';
import { deserializeRedBlackTree } from './utils/redBlackTree';
import { FIXED_WRAPPER_HEADER_SIZE, NIL, NO_EXPIRATION_LAST_VALID_SLOT, PRICE_MAX_EXP, PRICE_MIN_EXP, U32_MAX, } from './constants';
import { PROGRAM_ID as MANIFEST_PROGRAM_ID } from './manifest';
import { Market } from './market';
import { getVaultAddress } from './utils/market';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, } from '@solana/spl-token';
import { convertU128 } from './utils/numbers';
import { BN } from 'bn.js';
import { getGlobalAddress, getGlobalVaultAddress } from './utils/global';
/**
 * Wrapper object used for reading data from a wrapper for manifest markets.
 */
export class UiWrapper {
    /** Public key for the market account. */
    address;
    /** Deserialized data. */
    data;
    /**
     * Constructs a Wrapper object.
     *
     * @param address The `PublicKey` of the wrapper account
     * @param data Deserialized wrapper data
     */
    constructor({ address, data, }) {
        this.address = address;
        this.data = data;
    }
    /**
     * Returns a `Wrapper` for a given address, a data buffer
     *
     * @param marketAddress The `PublicKey` of the wrapper account
     * @param buffer The buffer holding the wrapper account data
     */
    static loadFromBuffer({ address, buffer, }) {
        const wrapperData = UiWrapper.deserializeWrapperBuffer(buffer);
        return new UiWrapper({ address, data: wrapperData });
    }
    /**
     * Updates the data in a Wrapper.
     *
     * @param connection The Solana `Connection` object
     */
    async reload(connection) {
        const buffer = await connection
            .getAccountInfo(this.address)
            .then((accountInfo) => accountInfo?.data);
        if (buffer === undefined) {
            throw new Error(`Failed to load ${this.address}`);
        }
        this.data = UiWrapper.deserializeWrapperBuffer(buffer);
    }
    /**
     * Get the parsed market info from the wrapper.
     *
     * @param marketPk PublicKey for the market
     *
     * @return MarketInfoParsed
     */
    marketInfoForMarket(marketPk) {
        const filtered = this.data.marketInfos.filter((marketInfo) => {
            return marketInfo.market.equals(marketPk);
        });
        if (filtered.length == 0) {
            return null;
        }
        return filtered[0];
    }
    /**
     * Get the open orders from the wrapper.
     *
     * @param marketPk PublicKey for the market
     *
     * @return OpenOrder[]
     */
    openOrdersForMarket(marketPk) {
        const filtered = this.data.marketInfos.filter((marketInfo) => {
            return marketInfo.market.equals(marketPk);
        });
        if (filtered.length == 0) {
            return null;
        }
        return filtered[0].orders;
    }
    activeMarkets() {
        return this.data.marketInfos.map((mi) => mi.market);
    }
    unsettledBalances(markets) {
        const { owner } = this.data;
        return markets.map((market) => {
            const numBaseTokens = market.getWithdrawableBalanceTokens(owner, true);
            const numQuoteTokens = market.getWithdrawableBalanceTokens(owner, false);
            return { market, numBaseTokens, numQuoteTokens };
        });
    }
    settleIx(market, platformTokenAccount, referrerTokenAccount, params) {
        const { owner } = this.data;
        const mintBase = market.baseMint();
        const mintQuote = market.quoteMint();
        const traderTokenAccountBase = getAssociatedTokenAddressSync(mintBase, owner);
        const traderTokenAccountQuote = getAssociatedTokenAddressSync(mintQuote, owner);
        const vaultBase = getVaultAddress(market.address, mintBase);
        const vaultQuote = getVaultAddress(market.address, mintQuote);
        return createSettleFundsInstruction({
            wrapperState: this.address,
            owner,
            traderTokenAccountBase,
            traderTokenAccountQuote,
            market: market.address,
            vaultBase,
            vaultQuote,
            mintBase,
            mintQuote,
            tokenProgramBase: TOKEN_PROGRAM_ID,
            tokenProgramQuote: TOKEN_PROGRAM_ID,
            manifestProgram: MANIFEST_PROGRAM_ID,
            platformTokenAccount,
            referrerTokenAccount,
        }, params);
    }
    // Do not include getters for the balances because those can be retrieved from
    // the market and that will be fresher data or the same always.
    /**
     * Print all information loaded about the wrapper in a human readable format.
     */
    prettyPrint() {
        console.log('');
        console.log(`Wrapper: ${this.address.toBase58()}`);
        console.log(`========================`);
        console.log(`Owner: ${this.data.owner.toBase58()}`);
        this.data.marketInfos.forEach((marketInfo) => {
            console.log(`------------------------`);
            console.log(`Market: ${marketInfo.market}`);
            console.log(`Last updated slot: ${marketInfo.lastUpdatedSlot}`);
            console.log(`BaseAtoms: ${marketInfo.baseBalanceAtoms} QuoteAtoms: ${marketInfo.quoteBalanceAtoms}`);
            marketInfo.orders.forEach((order) => {
                console.log(`OpenOrder: ClientOrderId: ${order.clientOrderId} ${order.numBaseAtoms}@${order.price} SeqNum: ${order.orderSequenceNumber} LastValidSlot: ${order.lastValidSlot} IsBid: ${order.isBid}`);
            });
        });
        console.log(`------------------------`);
    }
    /**
     * Deserializes wrapper data from a given buffer and returns a `Wrapper` object
     *
     * This includes both the fixed and dynamic parts of the market.
     * https://github.com/CKS-Systems/manifest/blob/main/programs/wrapper/src/wrapper_state.rs
     *
     * @param data The data buffer to deserialize
     *
     * @returns WrapperData
     */
    static deserializeWrapperBuffer(data) {
        let offset = 0;
        // Deserialize the market header
        const _discriminant = data.readBigUInt64LE(0);
        offset += 8;
        const owner = beetPublicKey.read(data, offset);
        offset += beetPublicKey.byteSize;
        const _numBytesAllocated = data.readUInt32LE(offset);
        offset += 4;
        const _freeListHeadIndex = data.readUInt32LE(offset);
        offset += 4;
        const marketInfosRootIndex = data.readUInt32LE(offset);
        offset += 4;
        const _padding = data.readUInt32LE(offset);
        offset += 12;
        const marketInfos = marketInfosRootIndex != NIL
            ? deserializeRedBlackTree(data.subarray(FIXED_WRAPPER_HEADER_SIZE), marketInfosRootIndex, marketInfoBeet)
            : [];
        const parsedMarketInfos = marketInfos.map((marketInfoRaw) => {
            const rootIndex = marketInfoRaw.openOrdersRootIndex;
            const parsedOpenOrders = rootIndex != NIL
                ? deserializeRedBlackTree(data.subarray(FIXED_WRAPPER_HEADER_SIZE), rootIndex, openOrderBeet)
                : [];
            const parsedOpenOrdersWithPrice = parsedOpenOrders.map((openOrder) => {
                return {
                    ...openOrder,
                    price: convertU128(new BN(openOrder.price, 10, 'le')),
                };
            });
            return {
                market: marketInfoRaw.market,
                baseBalanceAtoms: marketInfoRaw.baseBalanceAtoms,
                quoteBalanceAtoms: marketInfoRaw.quoteBalanceAtoms,
                orders: parsedOpenOrdersWithPrice,
                lastUpdatedSlot: marketInfoRaw.lastUpdatedSlot,
            };
        });
        return {
            owner,
            marketInfos: parsedMarketInfos,
        };
    }
    placeOrderIx(market, accounts, args) {
        const { owner } = this.data;
        const payer = accounts.payer ?? owner;
        const { isBid } = args;
        const mint = isBid ? market.quoteMint() : market.baseMint();
        const traderTokenAccount = getAssociatedTokenAddressSync(mint, owner);
        const vault = getVaultAddress(market.address, mint);
        const clientOrderId = args.orderId ?? Date.now();
        const baseAtoms = Math.round(args.amount * 10 ** market.baseDecimals());
        let priceMantissa = args.price;
        let priceExponent = market.quoteDecimals() - market.baseDecimals();
        while (priceMantissa < U32_MAX / 10 &&
            priceExponent > PRICE_MIN_EXP &&
            Math.round(priceMantissa) != priceMantissa) {
            priceMantissa *= 10;
            priceExponent -= 1;
        }
        while (priceMantissa > U32_MAX && priceExponent < PRICE_MAX_EXP) {
            priceMantissa = priceMantissa / 10;
            priceExponent += 1;
        }
        priceMantissa = Math.round(priceMantissa);
        const baseGlobal = getGlobalAddress(market.baseMint());
        const quoteGlobal = getGlobalAddress(market.quoteMint());
        const baseGlobalVault = getGlobalVaultAddress(market.baseMint());
        const quoteGlobalVault = getGlobalVaultAddress(market.quoteMint());
        return createPlaceOrderInstruction({
            wrapperState: this.address,
            owner,
            traderTokenAccount,
            market: market.address,
            vault,
            mint,
            manifestProgram: MANIFEST_PROGRAM_ID,
            payer,
            baseMint: market.baseMint(),
            baseGlobal,
            baseGlobalVault,
            baseMarketVault: getVaultAddress(market.address, market.baseMint()),
            baseTokenProgram: TOKEN_PROGRAM_ID,
            quoteMint: market.quoteMint(),
            quoteGlobal,
            quoteGlobalVault,
            quoteMarketVault: getVaultAddress(market.address, market.quoteMint()),
            quoteTokenProgram: TOKEN_PROGRAM_ID,
        }, {
            params: {
                clientOrderId,
                baseAtoms,
                priceMantissa,
                priceExponent,
                isBid,
                lastValidSlot: NO_EXPIRATION_LAST_VALID_SLOT,
                orderType: OrderType.Limit,
            },
        });
    }
    static async fetchFirstUserWrapper(connection, payer) {
        const existingWrappers = await connection.getProgramAccounts(PROGRAM_ID, {
            filters: [
                // Dont check discriminant since there is only one type of account.
                {
                    memcmp: {
                        offset: 8,
                        encoding: 'base58',
                        bytes: payer.toBase58(),
                    },
                },
            ],
        });
        return existingWrappers.length > 0 ? existingWrappers[0] : null;
    }
    static async placeOrderCreateIfNotExistsIxs(connection, baseMint, baseDecimals, quoteMint, quoteDecimals, owner, payer, args) {
        const markets = await Market.findByMints(connection, baseMint, quoteMint);
        const market = markets.length > 0 ? markets[0] : null;
        if (market != null) {
            const wrapper = await UiWrapper.fetchFirstUserWrapper(connection, owner);
            if (wrapper) {
                const placeIx = UiWrapper.loadFromBuffer({
                    address: wrapper.pubkey,
                    buffer: wrapper.account.data,
                }).placeOrderIx(market, { payer }, args);
                return { ixs: [placeIx], signers: [] };
            }
            else {
                const setup = await this.setupIxs(connection, market.address, owner, payer);
                const wrapper = setup.signers[0].publicKey;
                const place = await this.placeIx_(market, wrapper, owner, payer, args);
                return {
                    ixs: [...setup.ixs, ...place.ixs],
                    signers: [...setup.signers, ...place.signers],
                };
            }
        }
        else {
            const marketIxs = await Market.setupIxs(connection, baseMint, quoteMint, payer);
            const market = {
                address: marketIxs.signers[0].publicKey,
                baseMint: () => baseMint,
                quoteMint: () => quoteMint,
                baseDecimals: () => baseDecimals,
                quoteDecimals: () => quoteDecimals,
            };
            const wrapperIxs = await this.setupIxs(connection, market.address, owner, payer);
            const wrapper = wrapperIxs.signers[0].publicKey;
            const placeIx = await this.placeIx_(market, wrapper, owner, payer, args);
            return {
                ixs: [...marketIxs.ixs, ...wrapperIxs.ixs, ...placeIx.ixs],
                signers: [
                    ...marketIxs.signers,
                    ...wrapperIxs.signers,
                    ...placeIx.signers,
                ],
            };
        }
    }
    static async setupIxs(connection, market, owner, payer) {
        const wrapperKeypair = Keypair.generate();
        const createAccountIx = SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: wrapperKeypair.publicKey,
            space: FIXED_WRAPPER_HEADER_SIZE,
            lamports: await connection.getMinimumBalanceForRentExemption(FIXED_WRAPPER_HEADER_SIZE),
            programId: PROGRAM_ID,
        });
        const createWrapperIx = createCreateWrapperInstruction({
            payer,
            owner,
            wrapperState: wrapperKeypair.publicKey,
        });
        const claimSeatIx = createClaimSeatInstruction({
            manifestProgram: MANIFEST_PROGRAM_ID,
            payer,
            owner,
            market,
            wrapperState: wrapperKeypair.publicKey,
        });
        return {
            ixs: [createAccountIx, createWrapperIx, claimSeatIx],
            signers: [wrapperKeypair],
        };
    }
    static placeIx_(market, wrapper, owner, payer, args) {
        const { isBid } = args;
        const mint = isBid ? market.quoteMint() : market.baseMint();
        const traderTokenAccount = getAssociatedTokenAddressSync(mint, owner);
        const vault = getVaultAddress(market.address, mint);
        const clientOrderId = args.orderId ?? Date.now();
        const baseAtoms = Math.round(args.amount * 10 ** market.baseDecimals());
        let priceMantissa = args.price;
        let priceExponent = market.quoteDecimals() - market.baseDecimals();
        while (priceMantissa < U32_MAX / 10 &&
            priceExponent > PRICE_MIN_EXP &&
            Math.round(priceMantissa) != priceMantissa) {
            priceMantissa *= 10;
            priceExponent -= 1;
        }
        while (priceMantissa > U32_MAX && priceExponent < PRICE_MAX_EXP) {
            priceMantissa = priceMantissa / 10;
            priceExponent += 1;
        }
        priceMantissa = Math.round(priceMantissa);
        const baseMarketVault = getVaultAddress(market.address, market.baseMint());
        const quoteMarketVault = getVaultAddress(market.address, market.quoteMint());
        const baseGlobal = getGlobalAddress(market.baseMint());
        const quoteGlobal = getGlobalAddress(market.quoteMint());
        const baseGlobalVault = getGlobalVaultAddress(market.baseMint());
        const quoteGlobalVault = getGlobalVaultAddress(market.quoteMint());
        const placeIx = createPlaceOrderInstruction({
            wrapperState: wrapper,
            owner,
            traderTokenAccount,
            market: market.address,
            vault,
            mint,
            manifestProgram: MANIFEST_PROGRAM_ID,
            payer,
            baseMint: market.baseMint(),
            baseGlobal,
            baseGlobalVault,
            baseMarketVault,
            baseTokenProgram: TOKEN_PROGRAM_ID,
            quoteMint: market.quoteMint(),
            quoteGlobal,
            quoteGlobalVault,
            quoteMarketVault,
            quoteTokenProgram: TOKEN_PROGRAM_ID,
        }, {
            params: {
                clientOrderId,
                baseAtoms,
                priceMantissa,
                priceExponent,
                isBid,
                lastValidSlot: NO_EXPIRATION_LAST_VALID_SLOT,
                orderType: OrderType.Limit,
            },
        });
        return { ixs: [placeIx], signers: [] };
    }
}
