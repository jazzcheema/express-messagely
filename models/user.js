"use strict";

const db = require("../db");
const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const { NotFoundError, BadRequestError, UnauthorizedError } = require('../expressError');

/** User of the site. */

class User {
  constructor({ username, password, first_name, last_name, phone, join_at, last_login_at }) {
    this.username = username;
    this.password = password;
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
    this.join_at = join_at;
    this.last_login_at = last_login_at;
  }

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   *
   *
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(
      password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
      VALUES
        ($1, $2, $3, $4, $5, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    return new User(result.rows[0]);
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    let user;
    try {
      user = await User.get(username);
    } catch {
      throw new UnauthorizedError();
    }
    if (user) {
      if (await bcrypt.compare(password, user.password) === true) {
        await user.updateLoginTimestamp();
        return true;
      }
    }
    return false;
  };

  /** Update last_login_at for user */

  async updateLoginTimestamp() {

    const result = await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING username`,
      [this.username]);
    const user = result.rows[0];

    if (!user) {
      throw new NotFoundError();
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name
      FROM users
      ORDER BY username`
    );
    return results.rows.map(u => new User(u));
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `SELECT username,
      first_name,
      last_name,
      phone,
      join_at,
      last_login_at
      FROM users
      WHERE username = $1`,
      [username]
    );
    const user = results.rows[0];

    if (!user) {
      throw new NotFoundError();
    }

    return new User(user);
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  async messagesFrom() {
    //check user with username exists
    User.get(this.username);

    const result = await db.query(
      `SELECT id,
      messages.to_username,
      users.first_name,
      users.last_name,
      users.phone,
      messages.body,
      messages.sent_at,
      messages.read_at
      FROM users JOIN messages on users.username = messages.to_username
      WHERE messages.from_username = $1`,
      [this.username]
    );

    return result.rows.map(msg => {
      return {
        id: msg.id,
        to_user: {
          username: msg.to_username,
          first_name: msg.first_name,
          last_name: msg.last_name,
          phone: msg.phone
        },
        body: msg.body,
        sent_at: msg.sent_at,
        read_at: msg.read_at
      };
    });
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  async messagesTo() {
    //check user with username exists
    User.get(this.username);

    const result = await db.query(
      `SELECT id,
      messages.from_username,
      users.first_name,
      users.last_name,
      users.phone,
      messages.body,
      messages.sent_at,
      messages.read_at
      FROM users JOIN messages on users.username = messages.from_username
      WHERE messages.to_username = $1`,
      [this.username]
    );

    return result.rows.map(msg => {
      return {
        id: msg.id,
        from_user: {
          username: msg.from_username,
          first_name: msg.first_name,
          last_name: msg.last_name,
          phone: msg.phone
        },
        body: msg.body,
        sent_at: msg.sent_at,
        read_at: msg.read_at
      };
    });
  }
}


module.exports = User;
