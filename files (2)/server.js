const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Base de datos SQLite
const db = new sqlite3.Database('./polla.db', (err) => {
  if (err) console.error(err);
  else console.log('Base de datos conectada');
});

// Crear tablas
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    verified BOOLEAN DEFAULT 0,
    verification_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    match_id INTEGER NOT NULL,
    team1_goals INTEGER NOT NULL,
    team2_goals INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, match_id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY,
    round TEXT,
    phase TEXT,
    date TEXT,
    time TEXT,
    team1 TEXT,
    name1 TEXT,
    team2 TEXT,
    name2 TEXT,
    stadium TEXT,
    result TEXT
  )
`);

// Configurar Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
});

// RUTAS

// 1. Registrar usuario (extrae nombre del email)
app.post('/api/register', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El email es requerido' });
  }

  // Extraer nombre del email
  // juan.garcia@gmail.com → juan garcia
  // jgarcia@empresa.com → jgarcia
  const username = email.split('@')[0].replace(/[._-]/g, ' ').trim();

  if (!username || !email) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const verificationCode = crypto.randomBytes(32).toString('hex');

  db.run(
    'INSERT INTO users (username, email, verification_code) VALUES (?, ?, ?)',
    [username, email, verificationCode],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Usuario o email ya existe' });
        }
        return res.status(500).json({ error: 'Error al registrar' });
      }

      // Enviar email
      const verificationLink = `${process.env.FRONTEND_URL}/verify?code=${verificationCode}&email=${email}`;
      
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: '🏆 Confirma tu email - Polla Mundial 2026',
        html: `
          <h2>¡Bienvenido a Polla Mundial 2026!</h2>
          <p>Hola ${username},</p>
          <p>Para completar tu registro, haz clic en el botón:</p>
          <a href="${verificationLink}" style="background: #fbbf24; color: #1e293b; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Confirmar Email
          </a>
          <p>O copia este código en la app: <code>${verificationCode}</code></p>
          <p>Este código expira en 24 horas.</p>
        `
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.error('Error al enviar email:', error);
          return res.status(500).json({ error: 'Error al enviar email' });
        }
        res.json({ 
          success: true, 
          message: 'Usuario registrado. Verifica tu email.',
          userId: this.lastID
        });
      });
    }
  );
});

// 2. Verificar email
app.post('/api/verify', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  db.run(
    'UPDATE users SET verified = 1 WHERE email = ? AND verification_code = ?',
    [email, code],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al verificar' });
      }

      if (this.changes === 0) {
        return res.status(400).json({ error: 'Código inválido o expirado' });
      }

      res.json({ success: true, message: 'Email verificado correctamente' });
    }
  );
});

// 3. Login (verificar que existe y está verificado)
app.post('/api/login', (req, res) => {
  const { email } = req.body;

  db.get(
    'SELECT id, username, email, verified FROM users WHERE email = ?',
    [email],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Error en servidor' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (!row.verified) {
        return res.status(403).json({ error: 'Email no verificado' });
      }

      res.json({ 
        success: true, 
        user: {
          id: row.id,
          username: row.username,
          email: row.email
        }
      });
    }
  );
});

// 4. Obtener todos los usuarios (para la lista de participantes)
app.get('/api/users', (req, res) => {
  db.all(
    'SELECT id, username, email, created_at FROM users WHERE verified = 1 ORDER BY created_at ASC',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener usuarios' });
      }
      res.json(rows || []);
    }
  );
});

// 5. Guardar predicción
app.post('/api/predictions', (req, res) => {
  const { user_id, match_id, team1_goals, team2_goals } = req.body;

  if (!user_id || !match_id || team1_goals === undefined || team2_goals === undefined) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  db.run(
    `INSERT INTO predictions (user_id, match_id, team1_goals, team2_goals) 
     VALUES (?, ?, ?, ?) 
     ON CONFLICT(user_id, match_id) DO UPDATE SET 
     team1_goals = excluded.team1_goals, 
     team2_goals = excluded.team2_goals`,
    [user_id, match_id, team1_goals, team2_goals],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al guardar predicción' });
      }
      res.json({ success: true, message: 'Predicción guardada' });
    }
  );
});

// 6. Obtener predicciones de un usuario
app.get('/api/predictions/:user_id', (req, res) => {
  const { user_id } = req.params;

  db.all(
    'SELECT match_id, team1_goals, team2_goals FROM predictions WHERE user_id = ?',
    [user_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener predicciones' });
      }
      res.json(rows || []);
    }
  );
});

// 7. Obtener todas las predicciones (para el tab "Todas las Predicciones")
app.get('/api/all-predictions', (req, res) => {
  const query = `
    SELECT 
      u.id, 
      u.username, 
      p.match_id, 
      p.team1_goals, 
      p.team2_goals,
      p.created_at
    FROM predictions p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.match_id, u.username
  `;

  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener predicciones' });
    }
    res.json(rows || []);
  });
});

// 8. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
