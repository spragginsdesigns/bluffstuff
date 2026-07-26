/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as committeeAuth from "../committeeAuth.js";
import type * as contactMessages from "../contactMessages.js";
import type * as events from "../events.js";
import type * as feedback from "../feedback.js";
import type * as feedbackOptions from "../feedbackOptions.js";
import type * as ideas from "../ideas.js";
import type * as interest from "../interest.js";
import type * as payments from "../payments.js";
import type * as reminders from "../reminders.js";
import type * as rsvps from "../rsvps.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  committeeAuth: typeof committeeAuth;
  contactMessages: typeof contactMessages;
  events: typeof events;
  feedback: typeof feedback;
  feedbackOptions: typeof feedbackOptions;
  ideas: typeof ideas;
  interest: typeof interest;
  payments: typeof payments;
  reminders: typeof reminders;
  rsvps: typeof rsvps;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
