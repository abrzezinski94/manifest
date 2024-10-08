/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */
import * as beet from '@metaplex-foundation/beet';
import * as web3 from '@solana/web3.js';
import { WrapperSettleFundsParams } from '../types/WrapperSettleFundsParams';
/**
 * @category Instructions
 * @category SettleFunds
 * @category generated
 */
export type SettleFundsInstructionArgs = {
    params: WrapperSettleFundsParams;
};
/**
 * @category Instructions
 * @category SettleFunds
 * @category generated
 */
export declare const SettleFundsStruct: beet.BeetArgsStruct<SettleFundsInstructionArgs & {
    instructionDiscriminator: number;
}>;
/**
 * Accounts required by the _SettleFunds_ instruction
 *
 * @property [_writable_] wrapperState
 * @property [**signer**] owner
 * @property [_writable_] traderTokenAccountBase
 * @property [_writable_] traderTokenAccountQuote
 * @property [_writable_] market
 * @property [_writable_] vaultBase
 * @property [_writable_] vaultQuote
 * @property [_writable_] mintBase
 * @property [_writable_] mintQuote
 * @property [] tokenProgramBase
 * @property [] tokenProgramQuote
 * @property [] manifestProgram
 * @property [_writable_] platformTokenAccount
 * @property [_writable_] referrerTokenAccount
 * @category Instructions
 * @category SettleFunds
 * @category generated
 */
export type SettleFundsInstructionAccounts = {
    wrapperState: web3.PublicKey;
    owner: web3.PublicKey;
    traderTokenAccountBase: web3.PublicKey;
    traderTokenAccountQuote: web3.PublicKey;
    market: web3.PublicKey;
    vaultBase: web3.PublicKey;
    vaultQuote: web3.PublicKey;
    mintBase: web3.PublicKey;
    mintQuote: web3.PublicKey;
    tokenProgramBase: web3.PublicKey;
    tokenProgramQuote: web3.PublicKey;
    manifestProgram: web3.PublicKey;
    platformTokenAccount: web3.PublicKey;
    referrerTokenAccount: web3.PublicKey;
};
export declare const settleFundsInstructionDiscriminator = 5;
/**
 * Creates a _SettleFunds_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category SettleFunds
 * @category generated
 */
export declare function createSettleFundsInstruction(accounts: SettleFundsInstructionAccounts, args: SettleFundsInstructionArgs, programId?: web3.PublicKey): web3.TransactionInstruction;
