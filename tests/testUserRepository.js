const expect = require("unexpected");
const r = require("rethinkdb");
const UserRepository = require("../db/userRepository");

let users;

before(function() {
    return r.connect({ host:"172.17.0.2", port:28015 })
        .then(conn => {
            users = new UserRepository(conn);
        })
});

describe("UserRepository", function() {
    it("creates a user", function() {
      return users.createUser({ username:"john", password:1234 })
        .then(user => {
          expect(user, "to have key", "username");
          expect(user.username, "to be", "john");
          expect(user, "to have key", "password");
          expect(user.password, "to be", 1234);
          expect(user, "to have key", "id")
        })
    })

    it("finds a user based on username", function() {
        return users.findOne({username:"john"})
            .then(user => {
                expect(user, "to not have key", "password");
                expect(user.username, "to be", "john");
                expect(user.id, "to be", "36ecb365-bc76-41f7-b8ba-8ccd1d4993cc");
            })
    })

    it("returns correct error when username not found", function() {
        return users.findOne({username:"jane"})
            .catch(error => {
                expect(error.reason, "to be", "USER_NOT_FOUND");
        }   )
    })

    it("finds a user based on id", function() {
        return users.findOne({id:"36ecb365-bc76-41f7-b8ba-8ccd1d4993cc"})
            .then(user => {
                expect(user, "to not have key", "password");
                expect(user.username, "to be", "john");
                expect(user.id, "to be", "36ecb365-bc76-41f7-b8ba-8ccd1d4993cc");
            })
    })

    it("returns correct error when user id not found", function() {
        return users.findOne({id:"36ecb365-bc76-41f7-b8ba-8ccd1d4993cd"})
            .catch(error => {
                expect(error.reason, "to be", "USER_NOT_FOUND");
            })
    })

    it("verifies a password", function() {
        return users.verifyPassword("john", "1234")
            .then(user => {
                expect(user, "to not have key", "password");
                expect(user.username, "to be", "john");
                expect(user.id, "to be", "36ecb365-bc76-41f7-b8ba-8ccd1d4993cc");
            })
    })

    it("rejects a password", function() {
        return users.verifyPassword("john", "12345")
            .catch(error => {
                expect(error.reason, "to be", "INVALID_CREDENTIALS");
            })
    })
})