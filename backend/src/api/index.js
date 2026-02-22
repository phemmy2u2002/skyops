const { Router } = require('express');

const flightsRouter = require('./flights');
const weatherRouter = require('./weather');
const notamsRouter = require('./notams');
const dispatchRouter = require('./dispatch');

const router = Router();

router.use('/flights', flightsRouter);
router.use('/weather', weatherRouter);
router.use('/notams', notamsRouter);
router.use('/dispatch', dispatchRouter);

module.exports = router;
