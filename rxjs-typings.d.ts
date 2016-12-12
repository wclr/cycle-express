import {Observable} from 'rxjs'
import {Request} from './typings/index'
import {RouterStreamTemplate} from './typings/router-stream'

export interface RouterStream extends RouterStreamTemplate<Observable<Request>> { }
