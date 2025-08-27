/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as conversations from "../conversations.js";
import type * as documentTemplates from "../documentTemplates.js";
import type * as documents from "../documents.js";
import type * as messages from "../messages.js";
import type * as payments from "../payments.js";
import type * as products from "../products.js";
import type * as quoteRequests from "../quoteRequests.js";
import type * as quoteTemplates from "../quoteTemplates.js";
import type * as seedData from "../seedData.js";
import type * as shipmentPayments from "../shipmentPayments.js";
import type * as shipments from "../shipments.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  conversations: typeof conversations;
  documentTemplates: typeof documentTemplates;
  documents: typeof documents;
  messages: typeof messages;
  payments: typeof payments;
  products: typeof products;
  quoteRequests: typeof quoteRequests;
  quoteTemplates: typeof quoteTemplates;
  seedData: typeof seedData;
  shipmentPayments: typeof shipmentPayments;
  shipments: typeof shipments;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
