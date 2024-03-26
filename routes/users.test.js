"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
const { SECRET_KEY } = require("../config");

let testUserToken;
let testUser2Token;

let u1;
let u2;

let m1;


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
  u2 = await User.register({
    username: "test2",
    password: "password",
    first_name: "Test2",
    last_name: "Testy2",
    phone: "+14155550000",
  });
  testUserToken = jwt.sign({ username: u1.username }, SECRET_KEY);
  testUser2Token = jwt.sign({ username: u2.username }, SECRET_KEY);

  m1 = await Message.create({
    from_username: u1.username,
    to_username: u2.username,
    body: 'hello'
  });
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
        },
        {
          username: 'test2',
          first_name: 'Test2',
          last_name: 'Testy2'
        }
        ]
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

describe("GET /users/:username", function () {
  test("Returns a single user", async function () {
    const response = await request(app).get(`/users/${u1.username}`)
      .query({ _token: testUserToken });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      user:
      {
        username: "test1",
        first_name: "Test1",
        last_name: "Testy1",
        phone: "+14155550000",
        join_at: expect.any(String),
        last_login_at: null
      }
    }
    );
  });

  /** Missing token. */

  test("Bad request: Returns a single user", async function () {
    const response = await request(app).get(`/users/${u1.username}`)
      .query({ _token: 'bad' });
    expect(response.statusCode).toEqual(401);

  });
});




/** User's sent messages. */

describe("GET /users/:username/from", function () {
  test("Displays user's sent messages", async function () {
    const response = await request(app).get(`/users/${u2.username}/from`)
      .query({ _token: testUser2Token });
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

  /** One message in inbox. */

  test("Displays user's inbox messages", async function () {
    const response = await request(app).get(`/users/${u2.username}/to`)
      .query({ _token: testUser2Token });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(
      {
        messages: [{
          id: m1.id,
          body: m1.body,
          sent_at: expect.any(String),
          read_at: null,
          from_user: {
            username: u1.username,
            first_name: 'Test1',
            last_name: 'Testy1',
            phone: "+14155550000"
          }
        }]
      }
    );
  });


  /** Missing token. */

  test("Bad request: Display user inbox messages", async function () {
    const response = await request(app).get(`/users/${u1.username}/to`)
      .query({ _token: 'bad' });
    expect(response.statusCode).toEqual(401);
  });
});



