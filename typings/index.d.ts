import {MakeRouterDriver} from '../src/index'

declare module 'cycle-express' {
  export const makeRouterDriver: MakeRouterDriver
}
