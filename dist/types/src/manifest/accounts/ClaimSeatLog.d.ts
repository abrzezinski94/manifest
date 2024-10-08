/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */
import * as web3 from '@solana/web3.js';
import * as beetSolana from '@metaplex-foundation/beet-solana';
import * as beet from '@metaplex-foundation/beet';
/**
 * Arguments used to create {@link ClaimSeatLog}
 * @category Accounts
 * @category generated
 */
export type ClaimSeatLogArgs = {
    market: web3.PublicKey;
    trader: web3.PublicKey;
};
/**
 * Holds the data for the {@link ClaimSeatLog} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export declare class ClaimSeatLog implements ClaimSeatLogArgs {
    readonly market: web3.PublicKey;
    readonly trader: web3.PublicKey;
    private constructor();
    /**
     * Creates a {@link ClaimSeatLog} instance from the provided args.
     */
    static fromArgs(args: ClaimSeatLogArgs): ClaimSeatLog;
    /**
     * Deserializes the {@link ClaimSeatLog} from the data of the provided {@link web3.AccountInfo}.
     * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
     */
    static fromAccountInfo(accountInfo: web3.AccountInfo<Buffer>, offset?: number): [ClaimSeatLog, number];
    /**
     * Retrieves the account info from the provided address and deserializes
     * the {@link ClaimSeatLog} from its data.
     *
     * @throws Error if no account info is found at the address or if deserialization fails
     */
    static fromAccountAddress(connection: web3.Connection, address: web3.PublicKey, commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig): Promise<ClaimSeatLog>;
    /**
     * Provides a {@link web3.Connection.getProgramAccounts} config builder,
     * to fetch accounts matching filters that can be specified via that builder.
     *
     * @param programId - the program that owns the accounts we are filtering
     */
    static gpaBuilder(programId?: web3.PublicKey): beetSolana.GpaBuilder<{
        market: any;
        trader: any;
    }>;
    /**
     * Deserializes the {@link ClaimSeatLog} from the provided data Buffer.
     * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
     */
    static deserialize(buf: Buffer, offset?: number): [ClaimSeatLog, number];
    /**
     * Serializes the {@link ClaimSeatLog} into a Buffer.
     * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
     */
    serialize(): [Buffer, number];
    /**
     * Returns the byteSize of a {@link Buffer} holding the serialized data of
     * {@link ClaimSeatLog}
     */
    static get byteSize(): number;
    /**
     * Fetches the minimum balance needed to exempt an account holding
     * {@link ClaimSeatLog} data from rent
     *
     * @param connection used to retrieve the rent exemption information
     */
    static getMinimumBalanceForRentExemption(connection: web3.Connection, commitment?: web3.Commitment): Promise<number>;
    /**
     * Determines if the provided {@link Buffer} has the correct byte size to
     * hold {@link ClaimSeatLog} data.
     */
    static hasCorrectByteSize(buf: Buffer, offset?: number): boolean;
    /**
     * Returns a readable version of {@link ClaimSeatLog} properties
     * and can be used to convert to JSON and/or logging
     */
    pretty(): {
        market: string;
        trader: string;
    };
}
/**
 * @category Accounts
 * @category generated
 */
export declare const claimSeatLogBeet: beet.BeetStruct<ClaimSeatLog, ClaimSeatLogArgs>;
//# sourceMappingURL=ClaimSeatLog.d.ts.map