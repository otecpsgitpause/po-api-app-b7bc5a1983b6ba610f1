'use strict'

var express = require('express');
var tokenController= require('../controllers/token-controller.js');
var api = express.Router();

//api urls

api.post('/euDMHl9oz9vb0aX6uteChNlShRVkyw8R9pmzAl6C7FQsUalBr',tokenController.authenticate);

module.exports = api;