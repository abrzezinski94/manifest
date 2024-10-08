/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet';
import {
  WrapperCancelOrderParams,
  wrapperCancelOrderParamsBeet,
} from './WrapperCancelOrderParams';
import {
  WrapperPlaceOrderParams,
  wrapperPlaceOrderParamsBeet,
} from './WrapperPlaceOrderParams';
export type WrapperBatchUpdateParams = {
  cancels: WrapperCancelOrderParams[];
  cancelAll: boolean;
  orders: WrapperPlaceOrderParams[];
  traderIndexHint: beet.COption<number>;
};

/**
 * @category userTypes
 * @category generated
 */
export const wrapperBatchUpdateParamsBeet =
  new beet.FixableBeetArgsStruct<WrapperBatchUpdateParams>(
    [
      ['cancels', beet.array(wrapperCancelOrderParamsBeet)],
      ['cancelAll', beet.bool],
      ['orders', beet.array(wrapperPlaceOrderParamsBeet)],
      ['traderIndexHint', beet.coption(beet.u32)],
    ],
    'WrapperBatchUpdateParams',
  );
