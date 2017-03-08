import { Observable } from 'rxjs'

import { RouterSourceTemplate, Request } from './index.d'

export * from './index.d'
export type RouterSource = RouterSourceTemplate<Observable<Request>>
