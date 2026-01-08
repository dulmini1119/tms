const Joi = require('joi');

const createTripLog = {
  body: Joi.object().keys({
    tripRequestId: Joi.string().uuid().required(),
    tripAssignmentId: Joi.string().uuid().required(),
    tripNumber: Joi.string().max(100).required(),
    tripDate: Joi.date().required(),
    fromLocation: Joi.string().max(500).required(),
    toLocation: Joi.string().max(500).required(),
    passengerName: Joi.string().max(255),
    passengerDepartment: Joi.string().max(255),
    plannedDistance: Joi.number().precision(2),
    plannedDeparture: Joi.date(),
    plannedArrival: Joi.date(),
    driverName: Joi.string().max(255),
    vehicleRegistration: Joi.string().max(100),
    tripStatus: Joi.string().valid('Not Started', 'Started', 'In Transit', 'Arrived', 'Completed', 'Cancelled'),
    // Add other fields as necessary
  }),
};

const getTripLogs = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    tripStatus: Joi.string(),
    startDate: Joi.date(),
    endDate: Joi.date(),
  }),
};

const getTripLog = {
  params: Joi.object().keys({
    logId: Joi.string().uuid().required(),
  }),
};

const updateTripLog = {
  params: Joi.object().keys({
    logId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      actualDistance: Joi.number().precision(2),
      actualDeparture: Joi.date(),
      actualArrival: Joi.date(),
      tripStatus: Joi.string().valid('Not Started', 'Started', 'In Transit', 'Arrived', 'Completed', 'Cancelled'),
      totalCost: Joi.number().precision(2),
      fuelCost: Joi.number().precision(2),
      driverBehaviorRating: Joi.number().max(5),
      comments: Joi.string(),
    })
    .min(1),
};

module.exports = {
  createTripLog,
  getTripLogs,
  getTripLog,
  updateTripLog,
};