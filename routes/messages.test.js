"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const Message = require("../models/message");

let testUser1Token;
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

  testUser1Token = jwt.sign({ username: u1.username }, SECRET_KEY);
  testUser2Token = jwt.sign({ username: u2.username }, SECRET_KEY);

  m1 = await Message.create({
    from_username: u1.username,
    to_username: u2.username,
    body: 'hello'
  });

});


/** Return all users. */

describe("GET /messages/:id", function () {
  test("Returns specific message", async function () {
    const response = await request(app).get(`/messages/${m1.id}`)
      .query({ _token: testUser1Token });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      message:
      {
        id: m1.id,
        body: 'hello',
        sent_at: expect.any(String),
        read_at: null,
        from_user: {
          username: u1.username,
          first_name: 'Test1',
          last_name: 'Testy1',
          phone: "+14155550000"
        },
        to_user: {
          username: u2.username,
          first_name: "Test2",
          last_name: "Testy2",
          phone: "+14155550000"
        }
      }
    }
    );
  });

  /** Error to get message by id without token. */
  test("Bad request to get specific message", async function () {
    const response = await request(app).get(`/messages/${m1.id}`)
      .query({ _token: 'bad' });
    expect(response.statusCode).toEqual(401);
  });

  /** Error to get message by id without token. */
  test("Get nonexistent message", async function () {
    const response = await request(app).get(`/messages/0`)
      .query({ _token: testUser1Token });
    expect(response.statusCode).toEqual(404);
  });
});