"use strict";

const Router = require("express").Router;
const router = new Router();
const { UnauthorizedError, BadRequestError } = require("../expressError");
const Message = require('../models/message');
// TODO: middleware
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', async function (req, res, next) {
  const message = await Message.get(req.params.id);
  if (res.locals.user.username === message.from_user.username ||
    res.locals.user.username === message.to_user.username) {
    return res.json({ message });
  }
  throw new UnauthorizedError();
});





/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', async function (req, res, next) {
  if (!req.body || !req.body.to_username || !req.body.body) {
    throw new BadRequestError();
  }

  const username = req.body.to_username;
  const message = await Message.create({
    from_username: res.locals.user.username,
    to_username: username,
    body: req.body.body
  });

  return res.status(201).json({ message });
});



/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', async function (req, res, next) {
  const retrieveMessage = await Message.get(req.params.id);

  if (retrieveMessage.to_user.username === res.locals.user.username) {
    const message = await Message.markRead(req.params.id);
    return res.json({ message });
  }

  throw new UnauthorizedError();
});

module.exports = router;