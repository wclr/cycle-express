import express from 'express'
import request from 'supertest'

import {run} from '@cycle/core'
import {Observable as O} from 'rx'
import {makeRouterDriver} from '../lib'

import 'rx-log'
import test from 'tape'

// simple DB driver with isolation
const makeDBDriver = () => {
  const USERS = [
    {id: '1', name: 'Charles Dickens', friends: [2]},
    {id: '2', name: 'Theodore Dreiser', friends: [1, 4]},
    {id: '3', name: 'Gabriel Marquez', friends: [2, 1]},
    {id: '4', name: 'Lewis Carroll', friends: []},
    {id: '5', name: 'Leo Tolstoy', friends: [1, 3, 4]}
  ]
  
  return function dbDriver (query$) {
    var res$ = query$.log('dbDriver')
      .map(query => query.id
          ? {query, data: USERS.filter(u => u.id === query.id)[0]}
          : query.ids
            ? {query, data: USERS.filter(u => query.ids.indexOf(u.id) >= 0)}
            : {query, data: USERS}
      ).replay(null, 1)
    res$.connect()
    return res$
  }
}

let router = express.Router()
let dbDriver = makeDBDriver()

let app = express()
app.use(router)



const Main = ({router, db}) => {
  return {
    router: db.mergeAll(),
    db: O.merge([

    ])
  }
}

run(Main, {
  router: makeRouterDriver(),
  db: makeDBDriver()
})

test.skip('GET /user/13', t => {
  request(app)
    .get('/user/13')
    //.expect(200)
    .expect(res => {
      console.log('13 status', res.status)
      t.is(res.body.id, '1')
      t.end()
    })
    .end(output)
})

test.skip('GET /user/12', t => {
  request(app)
    .get('/user/13')
    //.expect(200)
    .expect(res => {
      console.log('13 status', res.status)
      t.is(res.body.id, '1')
      t.end()
    })   
})


test('GET /user/1', t => {
  request(app)
    .get('/user/1')
    .expect(200)
    .expect(res => {
      t.is(res.body.id, '1')
      t.end()
    })   
})

test('GET /user/2', t => {
  request(app)
    .get('/user/2')
    .expect(200)
    .expect(res => {
      t.is(res.body.id, '2')
      t.end()
    })   
})