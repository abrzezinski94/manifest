"use strict";
/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformFeeLogBeet = exports.PlatformFeeLog = void 0;
const web3 = __importStar(require("@solana/web3.js"));
const beet = __importStar(require("@metaplex-foundation/beet"));
const beetSolana = __importStar(require("@metaplex-foundation/beet-solana"));
/**
 * Holds the data for the {@link PlatformFeeLog} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
class PlatformFeeLog {
    market;
    user;
    platformTokenAccount;
    platformFee;
    constructor(market, user, platformTokenAccount, platformFee) {
        this.market = market;
        this.user = user;
        this.platformTokenAccount = platformTokenAccount;
        this.platformFee = platformFee;
    }
    /**
     * Creates a {@link PlatformFeeLog} instance from the provided args.
     */
    static fromArgs(args) {
        return new PlatformFeeLog(args.market, args.user, args.platformTokenAccount, args.platformFee);
    }
    /**
     * Deserializes the {@link PlatformFeeLog} from the data of the provided {@link web3.AccountInfo}.
     * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
     */
    static fromAccountInfo(accountInfo, offset = 0) {
        return PlatformFeeLog.deserialize(accountInfo.data, offset);
    }
    /**
     * Retrieves the account info from the provided address and deserializes
     * the {@link PlatformFeeLog} from its data.
     *
     * @throws Error if no account info is found at the address or if deserialization fails
     */
    static async fromAccountAddress(connection, address, commitmentOrConfig) {
        const accountInfo = await connection.getAccountInfo(address, commitmentOrConfig);
        if (accountInfo == null) {
            throw new Error(`Unable to find PlatformFeeLog account at ${address}`);
        }
        return PlatformFeeLog.fromAccountInfo(accountInfo, 0)[0];
    }
    /**
     * Provides a {@link web3.Connection.getProgramAccounts} config builder,
     * to fetch accounts matching filters that can be specified via that builder.
     *
     * @param programId - the program that owns the accounts we are filtering
     */
    static gpaBuilder(programId = new web3.PublicKey('UMnFStVeG1ecZFc2gc5K3vFy3sMpotq8C91mXBQDGwh')) {
        return beetSolana.GpaBuilder.fromStruct(programId, exports.platformFeeLogBeet);
    }
    /**
     * Deserializes the {@link PlatformFeeLog} from the provided data Buffer.
     * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
     */
    static deserialize(buf, offset = 0) {
        return exports.platformFeeLogBeet.deserialize(buf, offset);
    }
    /**
     * Serializes the {@link PlatformFeeLog} into a Buffer.
     * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
     */
    serialize() {
        return exports.platformFeeLogBeet.serialize(this);
    }
    /**
     * Returns the byteSize of a {@link Buffer} holding the serialized data of
     * {@link PlatformFeeLog}
     */
    static get byteSize() {
        return exports.platformFeeLogBeet.byteSize;
    }
    /**
     * Fetches the minimum balance needed to exempt an account holding
     * {@link PlatformFeeLog} data from rent
     *
     * @param connection used to retrieve the rent exemption information
     */
    static async getMinimumBalanceForRentExemption(connection, commitment) {
        return connection.getMinimumBalanceForRentExemption(PlatformFeeLog.byteSize, commitment);
    }
    /**
     * Determines if the provided {@link Buffer} has the correct byte size to
     * hold {@link PlatformFeeLog} data.
     */
    static hasCorrectByteSize(buf, offset = 0) {
        return buf.byteLength - offset === PlatformFeeLog.byteSize;
    }
    /**
     * Returns a readable version of {@link PlatformFeeLog} properties
     * and can be used to convert to JSON and/or logging
     */
    pretty() {
        return {
            market: this.market.toBase58(),
            user: this.user.toBase58(),
            platformTokenAccount: this.platformTokenAccount.toBase58(),
            platformFee: (() => {
                const x = this.platformFee;
                if (typeof x.toNumber === 'function') {
                    try {
                        return x.toNumber();
                    }
                    catch (_) {
                        return x;
                    }
                }
                return x;
            })(),
        };
    }
}
exports.PlatformFeeLog = PlatformFeeLog;
/**
 * @category Accounts
 * @category generated
 */
exports.platformFeeLogBeet = new beet.BeetStruct([
    ['market', beetSolana.publicKey],
    ['user', beetSolana.publicKey],
    ['platformTokenAccount', beetSolana.publicKey],
    ['platformFee', beet.u64],
], PlatformFeeLog.fromArgs, 'PlatformFeeLog');
