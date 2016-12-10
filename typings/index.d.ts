/// <reference path="./cuid.d.ts" />
/// <reference path="./methods.d.ts" />

import {MakeRouterDriver} from '../src/index'

declare module 'cycle-express' {
  export const makeRouterDriver: MakeRouterDriver
}
