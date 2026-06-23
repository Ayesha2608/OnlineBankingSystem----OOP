require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = Number(process.env.PORT) || 3003;
let oracleDriver;

const getOracleDb = () => {
  oracleDriver ||= require('oracledb');
  return oracleDriver;
};

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Oracle DB connection configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl'
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const searchTargets = {
  user: {
    query: 'SELECT user_id, username, email, full_name, cell_num FROM users WHERE user_id = :id'
  },
  event: {
    query: 'SELECT event_id, organizer_id, event_name, event_description, event_date, start_time, end_time, venue_id FROM events WHERE event_id = :id'
  },
  order: {
    query: 'SELECT order_id, user_id, order_date, total_amount, payment_status FROM orders WHERE order_id = :id'
  },
  ticket: {
    query: 'SELECT ticket_id, event_id, user_id, ticket_type, price, seat_number, status FROM tickets WHERE ticket_id = :id'
  }
};

app.get('/api/search', async (req, res) => {
  const { id, type } = req.query;
  const target = searchTargets[type];

  if (!target || !id) {
    return res.status(400).json({ error: 'A valid search type and ID are required.' });
  }

  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      target.query,
      { id },
      { outFormat: getOracleDb().OUT_FORMAT_OBJECT }
    );
    return res.json({ type, rows: result.rows });
  } catch (err) {
    console.error('Error searching records:', err);
    return res.status(500).json({ error: 'Unable to search records.' });
  } finally {
    await closeConnection(connection);
  }
});

// Helper function to close Oracle DB connection
const closeConnection = async (connection) => {
  if (connection) {
    try {
      await connection.close();
    } catch (err) {
      console.error('Error closing connection:', err);
    }
  }
};

// Route to get all users
app.get('/api/users', async (req, res) => {
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(`SELECT * FROM users`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to add a user
app.post('/api/users', async (req, res) => {
  const { user_id, username, password, email, full_name, cell_num } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO users (user_id, username, password, email, full_name, cell_num) VALUES (:user_id, :username, :password, :email, :full_name, :cell_num)`,
      { user_id, username, password, email, full_name, cell_num },
      { autoCommit: true }
    );
    res.json({ message: 'User added successfully' });
  } catch (err) {
    console.error('Error adding user:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to update a user
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, email, full_name, cell_num } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `UPDATE users SET username = :username, password = :password, email = :email, full_name = :full_name, cell_num = :cell_num WHERE user_id = :id`,
      { id, username, password, email, full_name, cell_num },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json({ message: 'User updated successfully' });
    }
  } catch (err) {
    console.error('Error updating user:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to delete a user
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `DELETE FROM users WHERE user_id = :id`,
      { id },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json({ message: 'User deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting user:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to get all venues
app.get('/api/venues', async (req, res) => {
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(`SELECT * FROM venues`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting venues:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to add a venue
app.post('/api/venues', async (req, res) => {
  const { venue_id, venue_name, address, city, state, zip_code, capacity } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO venues (venue_id, venue_name, address, city, state, zip_code, capacity) VALUES (:venue_id, :venue_name, :address, :city, :state, :zip_code, :capacity)`,
      { venue_id, venue_name, address, city, state, zip_code, capacity },
      { autoCommit: true }
    );
    res.json({ message: 'Venue added successfully' });
  } catch (err) {
    console.error('Error adding venue:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to update a venue
app.put('/api/venues/:id', async (req, res) => {
  const venueId = req.params.id;
  const { venue_name, address, city, state, zip_code, capacity } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `UPDATE venues SET venue_name = :venue_name, address = :address, city = :city, state = :state, zip_code = :zip_code, capacity = :capacity WHERE venue_id = :venue_id`,
      { venue_name, address, city, state, zip_code, capacity, venue_id: venueId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Venue not found' });
    } else {
      res.json({ message: 'Venue updated successfully' });
    }
  } catch (err) {
    console.error('Error updating venue:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to delete a venue
app.delete('/api/venues/:id', async (req, res) => {
  const venueId = req.params.id;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `DELETE FROM venues WHERE venue_id = :venue_id`,
      { venue_id: venueId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Venue not found' });
    } else {
      res.json({ message: 'Venue deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting venue:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to get all events
app.get('/api/events', async (req, res) => {
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(`SELECT * FROM events`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting events:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to add an event
app.post('/api/events', async (req, res) => {
  const { event_id, organizer_id, event_name, event_description, event_date, start_time, end_time, venue_id } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO events (event_id, organizer_id, event_name, event_description, event_date, start_time, end_time, venue_id) 
       VALUES (:event_id, :organizer_id, :event_name, :event_description, TO_DATE(:event_date, 'YYYY-MM-DD'), TO_TIMESTAMP(:start_time, 'YYYY-MM-DD HH24:MI:SS'), TO_TIMESTAMP(:end_time, 'YYYY-MM-DD HH24:MI:SS'), :venue_id)`,
      { event_id, organizer_id, event_name, event_description, event_date, start_time, end_time, venue_id },
      { autoCommit: true }
    );
    res.json({ message: 'Event added successfully' });
  } catch (err) {
    console.error('Error adding event:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to update an event
app.put('/api/events/:id', async (req, res) => {
  const eventId = req.params.id;
  const { organizer_id, event_name, event_description, event_date, start_time, end_time, venue_id } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `UPDATE events SET organizer_id = :organizer_id, event_name = :event_name, event_description = :event_description, event_date = TO_DATE(:event_date, 'YYYY-MM-DD'), start_time = TO_TIMESTAMP(:start_time, 'YYYY-MM-DD HH24:MI:SS'), end_time = TO_TIMESTAMP(:end_time, 'YYYY-MM-DD HH24:MI:SS'), venue_id = :venue_id WHERE event_id = :event_id`,
      { organizer_id, event_name, event_description, event_date, start_time, end_time, venue_id, event_id: eventId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Event not found' });
    } else {
      res.json({ message: 'Event updated successfully' });
    }
  } catch (err) {
    console.error('Error updating event:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to delete an event
app.delete('/api/events/:id', async (req, res) => {
  const eventId = req.params.id;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `DELETE FROM events WHERE event_id = :event_id`,
      { event_id: eventId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Event not found' });
    } else {
      res.json({ message: 'Event deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting event:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to get all tickets
app.get('/api/tickets', async (req, res) => {
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(`SELECT * FROM tickets`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting tickets:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to add a ticket
app.post('/api/tickets', async (req, res) => {
  const { ticket_id, event_id, user_id, ticket_type, price, seat_number, status } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO tickets (ticket_id, event_id, user_id, ticket_type, price, seat_number, status) 
       VALUES (:ticket_id, :event_id, :user_id, :ticket_type, :price, :seat_number, :status)`,
      { ticket_id, event_id, user_id, ticket_type, price, seat_number, status },
      { autoCommit: true }
    );
    res.json({ message: 'Ticket added successfully' });
  } catch (err) {
    console.error('Error adding ticket:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to update a ticket
app.put('/api/tickets/:id', async (req, res) => {
  const ticketId = req.params.id;
  const { event_id, user_id, ticket_type, price, seat_number, status } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `UPDATE tickets SET event_id = :event_id, user_id = :user_id, ticket_type = :ticket_type, price = :price, seat_number = :seat_number, status = :status WHERE ticket_id = :ticket_id`,
      { event_id, user_id, ticket_type, price, seat_number, status, ticket_id: ticketId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Ticket not found' });
    } else {
      res.json({ message: 'Ticket updated successfully' });
    }
  } catch (err) {
    console.error('Error updating ticket:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to delete a ticket
app.delete('/api/tickets/:id', async (req, res) => {
  const ticketId = req.params.id;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `DELETE FROM tickets WHERE ticket_id = :ticket_id`,
      { ticket_id: ticketId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Ticket not found' });
    } else {
      res.json({ message: 'Ticket deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting ticket:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to get all ticket types
app.get('/api/ticket_types', async (req, res) => {
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(`SELECT * FROM ticket_types`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting ticket types:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to add a ticket type
app.post('/api/ticket_types', async (req, res) => {
  const { ticket_type_id, event_id, type_name, price, quantity_available } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO ticket_types (ticket_type_id, event_id, type_name, price, quantity_available) 
       VALUES (:ticket_type_id, :event_id, :type_name, :price, :quantity_available)`,
      { ticket_type_id, event_id, type_name, price, quantity_available },
      { autoCommit: true }
    );
    res.json({ message: 'Ticket type added successfully' });
  } catch (err) {
    console.error('Error adding ticket type:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to update a ticket type
app.put('/api/ticket_types/:id', async (req, res) => {
  const ticketTypeId = req.params.id;
  const { event_id, type_name, price, quantity_available } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `UPDATE ticket_types SET event_id = :event_id, type_name = :type_name, price = :price, quantity_available = :quantity_available WHERE ticket_type_id = :ticket_type_id`,
      { event_id, type_name, price, quantity_available, ticket_type_id: ticketTypeId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Ticket type not found' });
    } else {
      res.json({ message: 'Ticket type updated successfully' });
    }
  } catch (err) {
    console.error('Error updating ticket type:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to delete a ticket type
app.delete('/api/ticket_types/:id', async (req, res) => {
  const ticketTypeId = req.params.id;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `DELETE FROM ticket_types WHERE ticket_type_id = :ticket_type_id`,
      { ticket_type_id: ticketTypeId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Ticket type not found' });
    } else {
      res.json({ message: 'Ticket type deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting ticket type:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to get all orders
app.get('/api/orders', async (req, res) => {
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(`SELECT * FROM orders`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting orders:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to add an order
app.post('/api/orders', async (req, res) => {
  const { order_id, user_id, order_date, total_amount, payment_status } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO orders (order_id, user_id, order_date, total_amount, payment_status) 
       VALUES (:order_id, :user_id, TO_TIMESTAMP(:order_date, 'YYYY-MM-DD HH24:MI:SS'), :total_amount, :payment_status)`,
      { order_id, user_id, order_date, total_amount, payment_status },
      { autoCommit: true }
    );
    res.json({ message: 'Order added successfully' });
  } catch (err) {
    console.error('Error adding order:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to update an order
app.put('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  const { user_id, order_date, total_amount, payment_status } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `UPDATE orders SET user_id = :user_id, order_date = TO_TIMESTAMP(:order_date, 'YYYY-MM-DD HH24:MI:SS'), total_amount = :total_amount, payment_status = :payment_status WHERE order_id = :order_id`,
      { user_id, order_date, total_amount, payment_status, order_id: orderId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Order not found' });
    } else {
      res.json({ message: 'Order updated successfully' });
    }
  } catch (err) {
    console.error('Error updating order:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Route to delete an order
app.delete('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `DELETE FROM orders WHERE order_id = :order_id`,
      { order_id: orderId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Order not found' });
    } else {
      res.json({ message: 'Order deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting order:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});
// Routes for Order_Details
app.get('/api/order_details', async (req, res) => {
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(`SELECT * FROM order_details`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting order details:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

app.post('/api/order_details', async (req, res) => {
  const { order_detail_id, order_id, ticket_id, quantity, price } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO order_details (order_detail_id, order_id, ticket_id, quantity, price) VALUES (:order_detail_id, :order_id, :ticket_id, :quantity, :price)`,
      { order_detail_id, order_id, ticket_id, quantity, price },
      { autoCommit: true }
    );
    res.json({ message: 'Order detail added successfully' });
  } catch (err) {
    console.error('Error adding order detail:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

app.put('/api/order_details/:id', async (req, res) => {
  const orderDetailId = req.params.id;
  const { order_id, ticket_id, quantity, price } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `UPDATE order_details SET order_id = :order_id, ticket_id = :ticket_id, quantity = :quantity, price = :price WHERE order_detail_id = :order_detail_id`,
      { order_id, ticket_id, quantity, price, order_detail_id: orderDetailId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Order detail not found' });
    } else {
      res.json({ message: 'Order detail updated successfully' });
    }
  } catch (err) {
    console.error('Error updating order detail:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

app.delete('/api/order_details/:id', async (req, res) => {
  const orderDetailId = req.params.id;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `DELETE FROM order_details WHERE order_detail_id = :order_detail_id`,
      { order_detail_id: orderDetailId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Order detail not found' });
    } else {
      res.json({ message: 'Order detail deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting order detail:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

// Routes for Payments
app.get('/api/payments', async (req, res) => {
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(`SELECT * FROM payments`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting payments:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

app.post('/api/payments', async (req, res) => {
  const { payment_id, order_id, payment_date, payment_method, amount, transaction_id } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO payments (payment_id, order_id, payment_date, payment_method, amount, transaction_id) 
       VALUES (:payment_id, :order_id, TO_TIMESTAMP(:payment_date, 'YYYY-MM-DD HH24:MI:SS'), :payment_method, :amount, :transaction_id)`,
      { payment_id, order_id, payment_date, payment_method, amount, transaction_id },
      { autoCommit: true }
    );
    res.json({ message: 'Payment added successfully' });
  } catch (err) {
    console.error('Error adding payment:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

app.put('/api/payments/:id', async (req, res) => {
  const paymentId = req.params.id;
  const { order_id, payment_date, payment_method, amount, transaction_id } = req.body;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `UPDATE payments SET order_id = :order_id, payment_date = TO_TIMESTAMP(:payment_date, 'YYYY-MM-DD HH24:MI:SS'), payment_method = :payment_method, amount = :amount, transaction_id = :transaction_id WHERE payment_id = :payment_id`,
      { order_id, payment_date, payment_method, amount, transaction_id, payment_id: paymentId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Payment not found' });
    } else {
      res.json({ message: 'Payment updated successfully' });
    }
  } catch (err) {
    console.error('Error updating payment:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  const paymentId = req.params.id;
  let connection;
  try {
    connection = await getOracleDb().getConnection(dbConfig);
    const result = await connection.execute(
      `DELETE FROM payments WHERE payment_id = :payment_id`,
      { payment_id: paymentId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Payment not found' });
    } else {
      res.json({ message: 'Payment deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting payment:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await closeConnection(connection);
  }
});


const startServer = () => app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

if (require.main === module) {
  startServer();
}

module.exports = { app, dbConfig, searchTargets, startServer };
