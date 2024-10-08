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
exports.swapInstructionDiscriminator = exports.SwapStruct = void 0;
exports.createSwapInstruction = createSwapInstruction;
const beet = __importStar(require("@metaplex-foundation/beet"));
const web3 = __importStar(require("@solana/web3.js"));
const SwapParams_1 = require("../types/SwapParams");
/**
 * @category Instructions
 * @category Swap
 * @category generated
 */
exports.SwapStruct = new beet.BeetArgsStruct([
    ['instructionDiscriminator', beet.u8],
    ['params', SwapParams_1.swapParamsBeet],
], 'SwapInstructionArgs');
exports.swapInstructionDiscriminator = 4;
/**
 * Creates a _Swap_ instruction.
 *
 * Optional accounts that are not provided will be omitted from the accounts
 * array passed with the instruction.
 * An optional account that is set cannot follow an optional account that is unset.
 * Otherwise an Error is raised.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category Swap
 * @category generated
 */
function createSwapInstruction(accounts, args, programId = new web3.PublicKey('MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms')) {
    const [data] = exports.SwapStruct.serialize({
        instructionDiscriminator: exports.swapInstructionDiscriminator,
        ...args,
    });
    const keys = [
        {
            pubkey: accounts.payer,
            isWritable: true,
            isSigner: true,
        },
        {
            pubkey: accounts.market,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.traderBase,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.traderQuote,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.baseVault,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.quoteVault,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.tokenProgramBase,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.baseMint,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.tokenProgramQuote,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.quoteMint,
            isWritable: false,
            isSigner: false,
        },
    ];
    if (accounts.global != null) {
        keys.push({
            pubkey: accounts.global,
            isWritable: true,
            isSigner: false,
        });
    }
    if (accounts.globalVault != null) {
        if (accounts.global == null) {
            throw new Error("When providing 'globalVault' then 'accounts.global' need(s) to be provided as well.");
        }
        keys.push({
            pubkey: accounts.globalVault,
            isWritable: true,
            isSigner: false,
        });
    }
    const ix = new web3.TransactionInstruction({
        programId,
        keys,
        data,
    });
    return ix;
}
