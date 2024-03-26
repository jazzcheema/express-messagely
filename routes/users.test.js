"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");

let testUserToken;
let u1;



/** Register new user. */
beforeEach(async function () {
  await db.query("DELETE FROM messages");
  await db.query("DELETE FROM users");

  u1 = await User.register({
    username: "test1",
    password: "password",
    first_name: "Test1",
    last_name: "Testy1",
    phone: "+14155550000",
  });
  testUserToken = jwt.sign({ username: u1.username }, SECRET_KEY);
});





/** Return all users. */

describe("GET /users", function () {
  test("Returns all users", async function () {
    const response = await request(app).get('/users')
      .query({ _token: testUserToken });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      users:
        [{
          username: 'test1',
          first_name: 'Test1',
          last_name: 'Testy1',
        }]
    }
    );
  });
  /** Error to return all users without token. */
  test("Bad request to return all users", async function () {
    const response = await request(app).get('/users')
      .query({ _token: 'bad' });
    expect(response.statusCode).toEqual(401);
  });
});



/** Returns a information on a single user. */
//FIXME: come back to fixing join_at date/time

// describe("GET /users/:username", function () {
//   test("Returns a single user", async function () {
//     const response = await request(app).get(`/users/${u1.username}`)
//       .query({ _token: testUserToken });
//     expect(response.statusCode).toEqual(200);
//     expect(response.body).toEqual({
//       user:
//       {
//         username: "test1",
//         first_name: "Test1",
//         last_name: "Testy1",
//         phone: "+14155550000",
//         join_at: ,
//         last_login_at: null
//       }
//     }
//     );
//   });

//   /** Missing token. */
//   test("Bad request: Returns a single user", async function () {
//     const response = await request(app).get(`/users/${u1.username}`)
//       .query({ _token: 'bad' });
//     expect(response.statusCode).toEqual(401);

//   });
// });




/** User's sent messages. */

describe("GET /users/:username/from", function () {
  test("Displays user's sent messages", async function () {
    const response = await request(app).get(`/users/${u1.username}/from`)
      .query({ _token: testUserToken });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(
      { messages: [] }
    );
  });

  /** Missing token. */
  test("Bad request: Display user sent messages", async function () {
    const response = await request(app).get(`/users/${u1.username}/from`)
      .query({ _token: 'bad' });
    expect(response.statusCode).toEqual(401);
  });
});



/** User's received messages. */

describe("GET /:username/to", function () {
  test("Displays user's inbox messages", async function () {
    const response = await request(app).get(`/users/${u1.username}/to`)
      .query({ _token: testUserToken });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(
      { messages: [] }
    );
  });

  /** Missing token. */
  test("Bad request: Display user inbox messages", async function () {
    const response = await request(app).get(`/users/${u1.username}/to`)
      .query({ _token: 'bad' });
    expect(response.statusCode).toEqual(401);
  });
});



