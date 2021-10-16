const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool ({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()])
  .then((result) => {
    return result.rows[0]
  })
  .catch((err) => {
    console.log(err.message);
  });
}  

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool.query(`SELECT * FROM users WHERE id = $1`, [id])
  .then((result) => {
    return result.rows[0]
  })
  .catch((err) => {
    console.log(err.message);
  });  
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  return pool.query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`, [user.name, user.email, user.password])
  .then((result) => {
    return result.rows
  })
  .catch((err) => {
    console.log(err.message);
  });  
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool.query(`SELECT reservations.*, properties.*
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()
  GROUP BY reservations.id, properties.id
  ORDER BY start_date ASC
  LIMIT $2`, [guest_id, limit])
  .then((result) => {
    return result.rows
  })
  .catch((err) => {
    console.log(err.message);
  });
}

exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = (options, limit = 10) => {

  const queryParams = [];

  queryString = `SELECT properties.*, avg(property_reviews.rating) AS average_rating
  FROM properties
  JOIN property_reviews ON property_id = properties.id 
  `;

  //3 city
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE properties.city LIKE $${queryParams.length}`;
  }
  
  //4 owner_id
  if (options.owner_id) {
    if (queryParams.length >= 1) {
      queryParams.push(`${options.owner_id}`);
      queryString += `AND properties.owner_id = $${queryParams.length}`;
    } else {
      queryParams.push(`${options.owner_id}`);
      queryString += `WHERE properties.owner_id = $${queryParams.length}`;
    }
  }

  //5 minimum_price
  if (options.minimum_price_per_night) {
    if (queryParams.length >= 1) {
      queryParams.push(`${options.minimum_price_per_night}`);
      queryString += `AND properties.cost_per_night >= $${queryParams.length}`;
    } else {
      queryParams.push(`${options.minimum_price_per_night}`);
      queryString += `WHERE properties.cost_per_night >= $${queryParams.length}`;
    }
  }

  //5 maximum_price
  if (options.maximum_price_per_night) {
    if (queryParams.length >= 1) {
      queryParams.push(`${options.maximum_price_per_night}`);
      queryString += `AND properties.cost_per_night <= $${queryParams.length}`;
    } else {
      queryParams.push(`${options.maximum_price_per_night}`);
      queryString += `WHERE properties.cost_per_night <= $${queryParams.length}`;
    }
  }
  
  queryString += `
  GROUP BY properties.id
  `;

  //6 minimum_rating
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length}`; 
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY properties.cost_per_night ASC
  LIMIT $${queryParams.length}
  `;

  return pool.query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};


exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {

  queryParams = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ];
  
  queryString = `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night,
    street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) VALUES
     ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;`;

  return pool.query(queryString, queryParams)
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
}

exports.addProperty = addProperty;


const addReservation = function(reservation) {

  console.log(reservation)
  /*
   * Adds a reservation from a specific user to the database
   */
  return pool.query(`
    INSERT INTO reservations (start_date, end_date, property_id, guest_id)
    VALUES ($1, $2, $3, $4) RETURNING *;
  `, [reservation.start_date, reservation.end_date, reservation.property_id, reservation.guest_id])
  .then(res => res.rows[0])
  .catch((err) => {
    console.log(err.message);
  });
}

exports.addReservation = addReservation;