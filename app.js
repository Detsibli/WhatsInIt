const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const mime = require('mime');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/views', express.static(path.join(__dirname, 'views'), {
  setHeaders: function(res, path, stat) {
    res.setHeader('Content-Type', mime.getType(path));
  }
}));

// Set up the database
const db = new sqlite3.Database('./recipes.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the recipes database.');
});

// Create the recipes table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    ingredients TEXT,
    instructions TEXT,
    loveit INTEGER DEFAULT 0,
    is_alcoholic BOOLEAN DEFAULT 0
  )`);
});

// Define the routes
app.get('/', (req, res) => {
  const q = req.query.q || '';
  const nameFilter = req.query.nameFilter || '';
  const ingredientFilter = req.query.ingredientFilter || '';
  const alcoholicFilter = req.query.alcoholicFilter || '';

  db.all(`SELECT * FROM recipes WHERE name LIKE '%${nameFilter}%' AND ingredients LIKE '%${ingredientFilter}%'${alcoholicFilter ? ` AND alcoholic = ${alcoholicFilter}` : ''}`, (err, rows) => {
    if (err) {
      throw err;
    }
    res.render('index', { recipes: rows, q: q, nameFilter: nameFilter, ingredientFilter: ingredientFilter, alcoholicFilter: alcoholicFilter });
  });
});

app.get('/example', (req, res) => {
  res.render('example');
});

app.get('/create', (req, res) => {
  res.render('create');
});


app.post('/create', (req, res) => {
  const { name, ingredients, instructions, is_alcoholic } = req.body;
  db.run('INSERT INTO recipes (name, ingredients, instructions, is_alcoholic) VALUES (?, ?, ?, ?)', [name, ingredients, instructions, is_alcoholic ? 1 : 0], (err) => {
    if (err) {
      throw err;
    }
    res.redirect('/');
  });
});

app.get('/recipes/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM recipes WHERE id = ?', [id], (err, row) => {
    if (err) {
      throw err;
    }
    res.render('recipe', { recipe: row });
  });
});

// Assuming the recipe ID is passed in the request parameters as `recipeId`
app.post('/recipes/:recipeId/love', (req, res) => {
  const recipeId = req.params.recipeId;
  
  // Increment the loveit value of the recipe with the specified ID
  db.run('UPDATE recipes SET loveit = loveit + 1 WHERE id = ?', recipeId, (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error updating recipe');
    } else {
      db.get('SELECT loveit FROM recipes WHERE id = ?', recipeId, (err, row) => {
        if (err) {
          console.error(err.message);
          res.status(500).send('Error updating recipe');
        } else {
          res.json(row.loveit);
        }
      });
    }
  });
});

app.get('/search', (req, res) => {
  const { q, nameFilter, ingredientFilter, alcoholicFilter, offset = 0 } = req.query;
  const limit = 10;
  let query = `
    SELECT * FROM recipes
    WHERE 1=1
  `;
  if (q) {
    query += `
      AND (name LIKE '%${q}%' OR ingredients LIKE '%${q}%')
    `;
  }
  if (nameFilter && nameFilter.trim()) {
    query += `
      AND name LIKE '%${nameFilter}%'
    `;
  }
  if (ingredientFilter && ingredientFilter.trim()) {
    query += `
      AND ingredients LIKE '%${ingredientFilter}%'
    `;
  }
  if (alcoholicFilter) {
    query += `
      AND is_alcoholic = '${alcoholicFilter}'
    `;
  }
  query += `
    LIMIT ${limit} OFFSET ${offset}
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      throw err;
    }
    const recipes = rows;
    const hasMore = recipes.length === limit;
    res.render('search', { recipes, limit, offset, hasMore, query, q, nameFilter, ingredientFilter, alcoholicFilter });
  });
});


// Start the server
app.set('view engine', 'ejs');
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
