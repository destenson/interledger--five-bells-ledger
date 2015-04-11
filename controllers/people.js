/* @flow */
'use strict';

const db = require('../services/db');
const log = require('five-bells-shared/services/log')('people');
const request = require('five-bells-shared/utils/request');
const NotFoundError = require('five-bells-shared/errors/not-found-error');

exports.find = function *find() {
  const people = yield db.get(['people']);
  this.body = people;
};

/**
 * @api {get} /people/:id Fetch user info
 * @apiName GetPerson
 * @apiGroup Person
 * @apiVersion 1.0.0
 *
 * @apiDescription Get information about a user.
 *
 * @apiParam {String} id Person's unique identifier
 *
 * @apiUse NotFoundError
 * @apiUse InvalidUriParameterError
 *
 * @param {String} id Person identifier (i.e. username)
 * @returns {void}
 */
exports.fetch = function *fetch(id) {
  request.validateUriParameter('id', id, 'Identifier');
  id = id.toLowerCase();
  log.debug('fetching person ID ' + id);

  const person = yield db.get(['people', id]);
  if (!person) {
    throw new NotFoundError('Unknown person ID');
  }

  this.body = person;
};

/**
 * @api {put} /people/:id Update a user
 * @apiName PutPerson
 * @apiGroup Person
 * @apiVersion 1.0.0
 *
 * @apiDescription Create or update a user.
 *
 * @apiParam {String} id Person's unique identifier
 *
 * @apiUse InvalidUriParameterError
 * @apiUse InvalidBodyError
 *
 * @param {String} id Person identifier (i.e. username)
 * @return {void}
 */
exports.putResource = function *putResource(id) {
  request.validateUriParameter('id', id, 'Identifier');
  id = id.toLowerCase();
  const person = yield request.validateBody(this, 'Person');

  person.id = id;

  let created = false;
  yield db.transaction(function *(tr) {
    const existingPerson = yield tr.get(['people', id]);

    if (existingPerson) {
      created = true;
    }

    tr.put(['people', id], person);
  });
  log.debug((created ? 'created' : 'updated') + ' person ID ' + id);

  this.body = person;
  this.status = created ? 201 : 200;
};
