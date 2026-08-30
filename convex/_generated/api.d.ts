/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alphabet from "../alphabet.js";
import type * as cron from "../cron.js";
import type * as daily from "../daily.js";
import type * as daily_Calendar from "../daily/Calendar.js";
import type * as daily_DaySummaryCard from "../daily/DaySummaryCard.js";
import type * as daily_PalabrasMagicasDelDia from "../daily/PalabrasMagicasDelDia.js";
import type * as daily_WordList from "../daily/WordList.js";
import type * as daily_WordListItem from "../daily/WordListItem.js";
import type * as data from "../data.js";
import type * as migrations from "../migrations.js";
import type * as palabrasMagicasDaily from "../palabrasMagicasDaily.js";
import type * as pasapalabraDaily from "../pasapalabraDaily.js";
import type * as pasapalabraPool from "../pasapalabraPool.js";
import type * as patch from "../patch.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alphabet: typeof alphabet;
  cron: typeof cron;
  daily: typeof daily;
  "daily/Calendar": typeof daily_Calendar;
  "daily/DaySummaryCard": typeof daily_DaySummaryCard;
  "daily/PalabrasMagicasDelDia": typeof daily_PalabrasMagicasDelDia;
  "daily/WordList": typeof daily_WordList;
  "daily/WordListItem": typeof daily_WordListItem;
  data: typeof data;
  migrations: typeof migrations;
  palabrasMagicasDaily: typeof palabrasMagicasDaily;
  pasapalabraDaily: typeof pasapalabraDaily;
  pasapalabraPool: typeof pasapalabraPool;
  patch: typeof patch;
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
