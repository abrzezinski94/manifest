/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */
import * as beet from '@metaplex-foundation/beet';
import * as web3 from '@solana/web3.js';
/**
 * @category Instructions
 * @category GlobalAddTrader
 * @category generated
 */
export const GlobalAddTraderStruct = new beet.BeetArgsStruct([['instructionDiscriminator', beet.u8]], 'GlobalAddTraderInstructionArgs');
export const globalAddTraderInstructionDiscriminator = 8;
/**
 * Creates a _GlobalAddTrader_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category GlobalAddTrader
 * @category generated
 */
export function createGlobalAddTraderInstruction(accounts, programId = new web3.PublicKey('MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms')) {
    const [data] = GlobalAddTraderStruct.serialize({
        instructionDiscriminator: globalAddTraderInstructionDiscriminator,
    });
    const keys = [
        {
            pubkey: accounts.payer,
            isWritable: true,
            isSigner: true,
        },
        {
            pubkey: accounts.global,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
            isWritable: false,
            isSigner: false,
        },
    ];
    const ix = new web3.TransactionInstruction({
        programId,
        keys,
        data,
    });
    return ix;
}
