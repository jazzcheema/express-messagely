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


/** Return message by id. */

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

  /** Error to get message by id as wrong user. */
  test("Get nonexistent message", async function () {
    const response = await request(app).get(`/messages/0`)
      .query({ _token: testUser1Token });
    expect(response.statusCode).toEqual(404);
  });
});


/* Test message creation */

describe("POST /messages", function () {
  test("Create new message", async function () {
    const response = await request(app).post(`/messages`)
      .send({
        _token: testUser2Token,
        to_username: 'test1',
        body: 'hi'
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      message: {
        id: expect.any(Number),
        from_username: 'test2',
        to_username: 'test1',
        body: 'hi',
        sent_at: expect.any(String)
      }
    })
  });

/* Should be able to send messages to self. */
  test("Create new message to self", async function () {
    const response = await request(app).post(`/messages`)
      .send({
        _token: testUser2Token,
        to_username: 'test2',
        body: 'hi'
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      message: {
        id: expect.any(Number),
        from_username: 'test2',
        to_username: 'test2',
        body: 'hi',
        sent_at: expect.any(String)
      }
    })
  });


  /* Unsuccessful message creation. No token */
  test("Bad request: Create new message w/o token", async function () {
    const response = await request(app).post(`/messages`)
      .send({
        to_username: 'test1',
        body: 'hi'
      });
    expect(response.statusCode).toEqual(401);
  });


  /* Unsuccessful message creation. Sending to nonexistent user */
  test("Bad request: Create new message to nonexistent user", async function () {
    const response = await request(app).post(`/messages`)
      .send({
        _token: testUser2Token,
        to_username: 'bad_user',
        body: 'hi'
      });
    expect(response.statusCode).toEqual(404);
  });


  /* Unsuccessful message creation. Missing data */
  test("Bad request: Create new message w/o all required data", async function () {
    const response = await request(app).post(`/messages`)
      .send({
        _token: testUser2Token,
        body: 'hi'
      });
    expect(response.statusCode).toEqual(400);
  });
});



/* Mark messages as read */
describe("POST /messages/:id/read", function () {
  test("Mark message as read", async function () {
    const response = await request(app).post(`/messages/${m1.id}/read`)
      .query({ _token: testUser2Token });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      message:
      {
        id: m1.id,
        read_at: expect.any(String)
      }
    }
    );
  });


  /* Only to_user should be able mark as read */
  test("From_user cannot mark as read", async function () {
    const response = await request(app).post(`/messages/${m1.id}/read`)
      .query({ _token: testUser1Token });
    expect(response.statusCode).toEqual(401);
  });


  /** Error to mark message as read without token. */
  test("Bad request to mark message as read", async function () {
    const response = await request(app).post(`/messages/${m1.id}/read`)
      .query({ _token: 'bad' });
    expect(response.statusCode).toEqual(401);
  });

  /** Error to mark nonexistent message as read. */
  test("Get nonexistent message", async function () {
    const response = await request(app).post(`/messages/0/read`)
      .query({ _token: testUser1Token });
    expect(response.statusCode).toEqual(404);
  });
});

