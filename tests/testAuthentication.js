const expect = require("unexpected");
const r = require('rethinkdb');
const hippie = require('hippie');

const app = require('../app');

let conn = null;

describe("UserRepository", function() {

  before(done => {
    r.connect({ host:"localhost", port:28015 })
      .then(connection => {
        conn = connection
        r.table("users")
          .insert({username: "jane", password: "$2a$10$iDDyT81m5yRpByxbBNXwo.eNA3lbMGUzp1QjceY2sMu8lLozmBszK"})
          .run(conn);
      })
      .then(res => { done(); })
      .catch(done)
  })

  after(done => {
    Promise.all([
      r.table("users")
        .getAll("john2", {index: "username"})
        .delete()
        .run(conn),
      r.table("users")
        .getAll("jane", {index: "username"})
        .delete()
        .run(conn)
    ])
      .then(res => { done(); })
      .catch(done);
  })

  it("creates a user", (done) => {
    hippie(app)
      .json()
      .post("/user")
      .send({ username:"john2", password:1234 })
      .expectStatus(200)
      .expect((res, body, next) => {
        expect(body, "to have key", 'username')
        next();
      })
      .end(done)
  })

  it("logs in", done => {
    hippie(app)
      .json()
      .post("/login")
      .send({ username:"jane", password:1234 })
      .expectStatus(200)
      .end(done)
  })

  it('fails to create user, when existing user with same name', done => {
    hippie(app)
      .json()
      .post("/user")
      .send({ username:"jane", password:1234 })
      .expectStatus(400)
      .end(done)
  })

  it("fails to log in, when given invalid password", done => {
    hippie(app)
      .json()
      .post("/login")
      .send({ username:"jane", password:12345 })
      .expectStatus(401)
      .end(done)
  })

})