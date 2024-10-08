/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */
import * as beet from '@metaplex-foundation/beet';
/**
 * @category enums
 * @category generated
 */
export var OrderType;
(function (OrderType) {
    OrderType[OrderType["Limit"] = 0] = "Limit";
    OrderType[OrderType["ImmediateOrCancel"] = 1] = "ImmediateOrCancel";
    OrderType[OrderType["PostOnly"] = 2] = "PostOnly";
})(OrderType || (OrderType = {}));
/**
 * @category userTypes
 * @category generated
 */
export const orderTypeBeet = beet.fixedScalarEnum(OrderType);
