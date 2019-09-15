"use strict";

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var fetch = require("node-fetch");

var queryString = require("query-string");

exports.sourceNodes = function (_ref, configOptions) {
  var actions = _ref.actions,
      createNodeId = _ref.createNodeId,
      createContentDigest = _ref.createContentDigest;
  var createNode = actions.createNode; // Gatsby adds a configOption that's not needed for this plugin, delete it

  delete configOptions.plugins; // Processes a Meetup Group

  var processGroup = function processGroup(group) {
    var nodeId = createNodeId(`meetup-group-${group.id}`);
    var nodeData = Object.assign({}, group, _objectSpread({}, group, {
      id: nodeId,
      parent: null,
      children: [],
      internal: {
        type: `MeetupGroup`,
        contentDigest: createContentDigest(group)
      }
    }));
    return nodeData;
  }; // Processes a Meetup Event as a child of a Meetup Group


  var processEvent = function processEvent(event, parent) {
    var nodeId = createNodeId(`meetup-event-${event.id}`);
    var nodeData = Object.assign({}, event, _objectSpread({}, event, {
      id: nodeId,
      meetupId: event.id,
      parent,
      children: [],
      internal: {
        type: `MeetupEvent`,
        contentDigest: createContentDigest(event)
      }
    }));
    return nodeData;
  };

  var groupUrlName = configOptions.groupUrlName,
      apiOptions = _objectWithoutProperties(configOptions, ["groupUrlName"]); // Convert the options object into a query string


  var queryStringOptions = queryString.stringify(apiOptions);
  var apiGroupUrl = `https://api.meetup.com/${groupUrlName}?${queryStringOptions}`;
  var apiEventsUrl = `https://api.meetup.com/${groupUrlName}/events?${queryStringOptions}`; // Gatsby expects sourceNodes to return a promise

  return (// Fetch a response from the apiUrl
    Promise.all([fetch(apiGroupUrl), fetch(apiEventsUrl)]) // Parse the response as JSON
    .then(function (responses) {
      return Promise.all(responses.map(function (response) {
        return response.json();
      }));
    }) // Process the JSON data into a node
    .then(function (dataArray) {
      var groupData = dataArray[0];
      var eventData = dataArray[1]; // For each query result (or 'hit')

      var groupNode = processGroup(groupData);
      groupNode.events___NODE = Object.values(eventData).map(function (event) {
        var nodeData = processEvent(event, groupNode.id);
        createNode(nodeData);
        return nodeData.id;
      });
      createNode(groupNode);
    })
  );
};