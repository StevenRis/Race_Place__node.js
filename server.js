import express from 'express';
import bodyParser from 'body-parser';
import flash from 'express-flash';
import session from 'express-session';
// import bcrypt from 'bcrypt';

import homeRoute from './routes/home.js';
import carsRoute from './routes/cars.js';
import authRoutes from './routes/auth.js';
import regRoutes from './routes/register.js';
import resetRoutes from './routes/passwordReset.js';
import favSetupsRoute from './routes/favSetups.js';
import locationsRoute from './routes/locations.js';
import addToFavRoute from './routes/addToFav.js';
import accountRoute from './routes/account.js';

import { db } from './db.js';

const app = express();
const port = process.env.PORT || 8080;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(flash());

// Session
app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 1 week
  })
);

// Routes
app.use('/', homeRoute);
app.use('/cars', carsRoute);
app.use('/locations', locationsRoute);
app.use('/register', regRoutes);
app.use('/login', authRoutes);
app.use('/logout', authRoutes);
app.use('/password_reset', resetRoutes);
app.use('/', favSetupsRoute); // route = '/account/favorite_setup/:setup_id/:model/:location'
app.use('/add-to-favorites', addToFavRoute);
app.use('/account', accountRoute);

// SHOW LOCATIONS FOR PARTICULAR CAR
app.get('/cars/:model', async (req, res) => {
  const carModel = req.params.model;
  let pageTitle = '';

  try {
    const car = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM cars WHERE model=?', [carModel], (err, row) => {
        if (err) reject(err);
        resolve(row[0]);
      });
    });

    const carId = car.id;

    const carLocations = await new Promise((resolve, reject) => {
      db.all(
        'SELECT DISTINCT locations.id AS location_id, location_name, location_image FROM locations INNER JOIN setups ON locations.id=setups.locations_id INNER JOIN cars ON cars.id=setups.cars_id WHERE cars_id IN (SELECT id FROM cars WHERE id=?)',
        [carId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    pageTitle = `${car.brand} ${car.model}`;

    res.render('carLocations', {
      pageTitle: pageTitle,
      user: req.session.user,
      car: car,
      carLocations: carLocations,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred.');
    res.redirect('/cars');
  }
});

// SHOW SETUPS FOR PARTICULAR CAR
app.get('/cars/:model/:location', async (req, res) => {
  const carModel = req.params.model;
  const carLocation = req.params.location;
  const user = req.session.user;

  try {
    const car = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM cars WHERE model=?', [carModel], (err, row) => {
        if (err) reject(err);
        resolve(row[0]);
      });
    });

    const location = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM locations WHERE location_name=?',
        [carLocation],
        (err, row) => {
          if (err) reject(err);
          resolve(row[0]);
        }
      );
    });

    const carId = car.id;
    const locationId = location.id;

    const carLocations = await new Promise((resolve, reject) => {
      db.all(
        'SELECT location_name FROM locations INNER JOIN setups ON locations.id=setups.locations_id WHERE setups.locations_id IN (SELECT id FROM locations WHERE id=?)',
        [locationId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows[0]);
        }
      );
    });

    const carSetups = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM setups WHERE cars_id=? and locations_id=?',
        [carId, locationId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    const pageTitle = `${car.brand} ${car.model} ${carLocations.location_name}`;

    res.render('carSetup', {
      pageTitle: pageTitle,
      user: user,
      car: car,
      setups: carSetups,
      locations: carLocations,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred.');
    res.redirect('/cars');
  }
});

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
