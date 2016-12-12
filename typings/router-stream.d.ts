import {RoutePath} from './index.d'

export interface RouterStreamTemplate<T> {
  route: (path: RoutePath) => RouterStreamTemplate<T>
  get: (path: RoutePath) => T
  post: (path: RoutePath) => T
  put: (path: RoutePath) => T
  delete: (path: RoutePath) => T
}
