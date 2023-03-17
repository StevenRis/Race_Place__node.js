import { db } from '../db.js';

// SHOW FAVOURITE SETUP
export const favSetups = async (req, res) => {
  const { model, location, setup_id } = req.params;

  try {
    const car_id = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM cars WHERE model=?', [model], (err, row) => {
        if (err) reject(err);
        resolve(row.id);
      });
    });

    const location_id = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM locations WHERE location_name=?',
        [location],
        (err, row) => {
          if (err) reject(err);
          resolve(row.id);
        }
      );
    });

    // const locationId = location_id[0].id;

    const car = await new Promise((resolve, reject) => {
      db.get(
        'SELECT brand, model, class FROM cars INNER JOIN setups ON cars.id=setups.cars_id WHERE setups.cars_id IN (SELECT id FROM cars WHERE id=?)',
        [car_id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    console.log(car);

    const locations = await new Promise((resolve, reject) => {
      db.get(
        'SELECT location_name FROM locations INNER JOIN setups ON locations.id=setups.locations_id WHERE setups.locations_id IN (SELECT id FROM locations WHERE id=?)',
        [location_id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    const car_setups = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM setups WHERE id=?', [setup_id], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    res.render('carSetup', {
      pageTitle: 'setup',
      user: req.session.user,
      car: car,
      locations: locations,
      model: model,
      setups: car_setups,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred.');
    res.redirect('/account');
  }
};
