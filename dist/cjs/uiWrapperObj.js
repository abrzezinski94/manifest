"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UiWrapper = void 0;
const beet_solana_1 = require("@metaplex-foundation/beet-solana");
const web3_js_1 = require("@solana/web3.js");
const ui_wrapper_1 = require("./ui_wrapper");
const beet_1 = require("./utils/beet");
const redBlackTree_1 = require("./utils/redBlackTree");
const constants_1 = require("./constants");
const manifest_1 = require("./manifest");
const market_1 = require("./market");
const market_2 = require("./utils/market");
const spl_token_1 = require("@solana/spl-token");
const numbers_1 = require("./utils/numbers");
const bn_js_1 = require("bn.js");
const global_1 = require("./utils/global");
/**
 * Wrapper object used for reading data from a wrapper for manifest markets.
 */
class UiWrapper {
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
        const traderTokenAccountBase = (0, spl_token_1.getAssociatedTokenAddressSync)(mintBase, owner);
        const traderTokenAccountQuote = (0, spl_token_1.getAssociatedTokenAddressSync)(mintQuote, owner);
        const vaultBase = (0, market_2.getVaultAddress)(market.address, mintBase);
        const vaultQuote = (0, market_2.getVaultAddress)(market.address, mintQuote);
        return (0, ui_wrapper_1.createSettleFundsInstruction)({
            wrapperState: this.address,
            owner,
            traderTokenAccountBase,
            traderTokenAccountQuote,
            market: market.address,
            vaultBase,
            vaultQuote,
            mintBase,
            mintQuote,
            tokenProgramBase: spl_token_1.TOKEN_PROGRAM_ID,
            tokenProgramQuote: spl_token_1.TOKEN_PROGRAM_ID,
            manifestProgram: manifest_1.PROGRAM_ID,
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
        const owner = beet_solana_1.publicKey.read(data, offset);
        offset += beet_solana_1.publicKey.byteSize;
        const _numBytesAllocated = data.readUInt32LE(offset);
        offset += 4;
        const _freeListHeadIndex = data.readUInt32LE(offset);
        offset += 4;
        const marketInfosRootIndex = data.readUInt32LE(offset);
        offset += 4;
        const _padding = data.readUInt32LE(offset);
        offset += 12;
        const marketInfos = marketInfosRootIndex != constants_1.NIL
            ? (0, redBlackTree_1.deserializeRedBlackTree)(data.subarray(constants_1.FIXED_WRAPPER_HEADER_SIZE), marketInfosRootIndex, beet_1.marketInfoBeet)
            : [];
        const parsedMarketInfos = marketInfos.map((marketInfoRaw) => {
            const rootIndex = marketInfoRaw.openOrdersRootIndex;
            const parsedOpenOrders = rootIndex != constants_1.NIL
                ? (0, redBlackTree_1.deserializeRedBlackTree)(data.subarray(constants_1.FIXED_WRAPPER_HEADER_SIZE), rootIndex, beet_1.openOrderBeet)
                : [];
            const parsedOpenOrdersWithPrice = parsedOpenOrders.map((openOrder) => {
                return {
                    ...openOrder,
                    price: (0, numbers_1.convertU128)(new bn_js_1.BN(openOrder.price, 10, 'le')),
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
        const traderTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(mint, owner);
        const vault = (0, market_2.getVaultAddress)(market.address, mint);
        const clientOrderId = args.orderId ?? Date.now();
        const baseAtoms = Math.round(args.amount * 10 ** market.baseDecimals());
        let priceMantissa = args.price;
        let priceExponent = market.quoteDecimals() - market.baseDecimals();
        while (priceMantissa < constants_1.U32_MAX / 10 &&
            priceExponent > constants_1.PRICE_MIN_EXP &&
            Math.round(priceMantissa) != priceMantissa) {
            priceMantissa *= 10;
            priceExponent -= 1;
        }
        while (priceMantissa > constants_1.U32_MAX && priceExponent < constants_1.PRICE_MAX_EXP) {
            priceMantissa = priceMantissa / 10;
            priceExponent += 1;
        }
        priceMantissa = Math.round(priceMantissa);
        const baseGlobal = (0, global_1.getGlobalAddress)(market.baseMint());
        const quoteGlobal = (0, global_1.getGlobalAddress)(market.quoteMint());
        const baseGlobalVault = (0, global_1.getGlobalVaultAddress)(market.baseMint());
        const quoteGlobalVault = (0, global_1.getGlobalVaultAddress)(market.quoteMint());
        return (0, ui_wrapper_1.createPlaceOrderInstruction)({
            wrapperState: this.address,
            owner,
            traderTokenAccount,
            market: market.address,
            vault,
            mint,
            manifestProgram: manifest_1.PROGRAM_ID,
            payer,
            baseMint: market.baseMint(),
            baseGlobal,
            baseGlobalVault,
            baseMarketVault: (0, market_2.getVaultAddress)(market.address, market.baseMint()),
            baseTokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            quoteMint: market.quoteMint(),
            quoteGlobal,
            quoteGlobalVault,
            quoteMarketVault: (0, market_2.getVaultAddress)(market.address, market.quoteMint()),
            quoteTokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        }, {
            params: {
                clientOrderId,
                baseAtoms,
                priceMantissa,
                priceExponent,
                isBid,
                lastValidSlot: constants_1.NO_EXPIRATION_LAST_VALID_SLOT,
                orderType: ui_wrapper_1.OrderType.Limit,
            },
        });
    }
    static async fetchFirstUserWrapper(connection, payer) {
        const existingWrappers = await connection.getProgramAccounts(ui_wrapper_1.PROGRAM_ID, {
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
        const markets = await market_1.Market.findByMints(connection, baseMint, quoteMint);
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
            const marketIxs = await market_1.Market.setupIxs(connection, baseMint, quoteMint, payer);
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
        const wrapperKeypair = web3_js_1.Keypair.generate();
        const createAccountIx = web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: wrapperKeypair.publicKey,
            space: constants_1.FIXED_WRAPPER_HEADER_SIZE,
            lamports: await connection.getMinimumBalanceForRentExemption(constants_1.FIXED_WRAPPER_HEADER_SIZE),
            programId: ui_wrapper_1.PROGRAM_ID,
        });
        const createWrapperIx = (0, ui_wrapper_1.createCreateWrapperInstruction)({
            payer,
            owner,
            wrapperState: wrapperKeypair.publicKey,
        });
        const claimSeatIx = (0, ui_wrapper_1.createClaimSeatInstruction)({
            manifestProgram: manifest_1.PROGRAM_ID,
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
        const traderTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(mint, owner);
        const vault = (0, market_2.getVaultAddress)(market.address, mint);
        const clientOrderId = args.orderId ?? Date.now();
        const baseAtoms = Math.round(args.amount * 10 ** market.baseDecimals());
        let priceMantissa = args.price;
        let priceExponent = market.quoteDecimals() - market.baseDecimals();
        while (priceMantissa < constants_1.U32_MAX / 10 &&
            priceExponent > constants_1.PRICE_MIN_EXP &&
            Math.round(priceMantissa) != priceMantissa) {
            priceMantissa *= 10;
            priceExponent -= 1;
        }
        while (priceMantissa > constants_1.U32_MAX && priceExponent < constants_1.PRICE_MAX_EXP) {
            priceMantissa = priceMantissa / 10;
            priceExponent += 1;
        }
        priceMantissa = Math.round(priceMantissa);
        const baseMarketVault = (0, market_2.getVaultAddress)(market.address, market.baseMint());
        const quoteMarketVault = (0, market_2.getVaultAddress)(market.address, market.quoteMint());
        const baseGlobal = (0, global_1.getGlobalAddress)(market.baseMint());
        const quoteGlobal = (0, global_1.getGlobalAddress)(market.quoteMint());
        const baseGlobalVault = (0, global_1.getGlobalVaultAddress)(market.baseMint());
        const quoteGlobalVault = (0, global_1.getGlobalVaultAddress)(market.quoteMint());
        const placeIx = (0, ui_wrapper_1.createPlaceOrderInstruction)({
            wrapperState: wrapper,
            owner,
            traderTokenAccount,
            market: market.address,
            vault,
            mint,
            manifestProgram: manifest_1.PROGRAM_ID,
            payer,
            baseMint: market.baseMint(),
            baseGlobal,
            baseGlobalVault,
            baseMarketVault,
            baseTokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            quoteMint: market.quoteMint(),
            quoteGlobal,
            quoteGlobalVault,
            quoteMarketVault,
            quoteTokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        }, {
            params: {
                clientOrderId,
                baseAtoms,
                priceMantissa,
                priceExponent,
                isBid,
                lastValidSlot: constants_1.NO_EXPIRATION_LAST_VALID_SLOT,
                orderType: ui_wrapper_1.OrderType.Limit,
            },
        });
        return { ixs: [placeIx], signers: [] };
    }
}
exports.UiWrapper = UiWrapper;
