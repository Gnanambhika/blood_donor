import express, { json, response } from 'express'
import mysql from 'mysql'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt, { hash } from 'bcrypt'
import jwt from 'jsonwebtoken'

const app = express();
app.use(cors(
    {
        origin: ["http://localhost:3000"],
        methods: ["POST", "GET", "PUT", "DELETE"],
        credentials: true
    }
));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bloodbank"
})

con.connect(function(err) {
    if(err) {
        console.log("Error in Connection");
    }else {
        console.log("Connected");
    }
})

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if(!token) {
        return res.json({Error: "You are no Authenticate"});
    } else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if(err) return res.json({Error: "Token wrong"});
            req.role = decoded.role;
            req.id = decoded.id;
            next();
        })
    }
}

app.get('/dashboard',verifyUser, (req,res) => {
    return res.json({Status: "Success", role: req.role, id: req.id})
})
app.get('/read', (req, res) => {
  const status = "Read";
  const sql = "SELECT COUNT(*) as count FROM contactus WHERE status = 'Read'";
  con.query(sql, [status], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'An error occurred while counting read\'s contactus entries.' });
    }
    const count = result[0].count;
    return res.json({ count });
  });
});
app.get('/unread', (req, res) => {
  const status = "Unread";
  const sql = "SELECT COUNT(*) as count FROM contactus WHERE status = 'Unread'";
  con.query(sql, [status], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'An error occurred while counting unread\'s contactus entries.' });
    }
    const count = result[0].count;
    return res.json({ count });
  });
});
app.get('/donorCount', (req, res) => {
  const sql = "Select count(id) as donor from donor";
  con.query(sql, (err, result) => {
      if(err) return res.json({Error: 'Error in running query'});
      return res.json(result);
  })
})
app.post('/addBlood', (req, res) => {
    const { name } = req.body;
  
    const sql = 'INSERT INTO blood (name) VALUES (?)';
    const values = [name];
  
    con.query(sql, values, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'An error occurred while creating the blood.' });
      }
  
      return res.status(200).json({ message: 'blood added successfully.' });
    });
  });

  app.get('/manageBlood', (req, res) => {
    const sql = "Select * FROM blood";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Get blood error in sql"});
        return res.json({Status: "Success", Result: result})
    })
})

app.get('/getBlood/:id', (req, res) => {
  const id = req.params.id;
  const sql = "Select * FROM blood where id = ?";
  con.query(sql, [id], (err, result) => {
      if(err) return res.json({Error: "Get blood error in sql"});
      return res.json({Status: "Success", Result: result})
  })
})

app.put('/updateBlood/:id', (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  const sql = "UPDATE blood SET name = ? WHERE id = ?";
  const params = [name, id];
  con.query(sql, params, (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ Error: "Update blood error in SQL" });
    }
    return res.json({ Status: "Success" });
  });
});

app.get('/getBlood', (req, res) => {
  const sql = "Select * FROM blood";
  con.query(sql, (err, result) => {
      if(err) return res.json({Error: "Get blood error in sql"});
      return res.json({Status: "Success", Result: result})
  })
})

app.delete('/deleteBlood/:id', (req, res) => {
    const id = req.params.id;
    const sql = "Delete FROM blood WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "Update blood error in sql"});
        return res.json({Status: "Success"})
    })
})
// End Blood Details ...

// Start Donor Details ...
app.get('/getBloods', (req, res) => {
  const sql = 'SELECT * FROM blood';
  con.query(sql, (err, result) => {
    if (err) {
      console.error('Get blood error in SQL:', err);
      return res.status(500).json({ error: 'An error occurred while fetching blood.' });
    }
    return res.status(200).json(result);
  });
});

app.post('/add_donor', (req, res) => {
  const { bloodId, donorname, contact, email, age, gender, address, message } = req.body;

  const sql = 'INSERT INTO donor (bloodId, donorname, contact, email, age, gender,address,message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [bloodId, donorname, contact, email, age, gender,address, message];
  con.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'An error occurred while creating the donor.' });
    }

    return res.status(200).json({ message: 'Donor added successfully.' });
  });
});

app.post('/contact', (req, res) => {
  const { fullname, email, mobile, message } = req.body;

  const sql = 'INSERT INTO contactus (fullname, email, mobile, message, status) VALUES (?,?,?,?,"Unread")';
  const values = [fullname, email, mobile, message];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'An error occurred while creating the contactus.' });
    }

    return res.status(200).json({ message: 'send message successfully.' });
  });
});

app.get('/unread_queries', (req, res) => {
  const action = req.query.action;

  let sql = 'SELECT * FROM contactus';

  if (action === 'Read') {
    sql += " WHERE status = 'Read'";
  } else if (action === 'Unread') {
    sql += " WHERE status = 'Unread'";
  }
  con.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'An error occurred while fetching the contact list.' });
    }

    return res.status(200).json({ Status: 'Success', Result: result });
  });
});

app.get('/getcontact/:id', (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM contactus WHERE id = ?"; // Changed the SQL query to retrieve the contact by id
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "Get contactus error in sql" });

    // Assuming there is only one row for the given id, so we directly take the first element of the result array
    const contact = result[0];
    
    if (!contact) {
      return res.json({ Error: "Contact not found" });
    }

    if (contact.status === 'Read') {
      return res.json({ Status: "AlreadyRead", Result: contact });
    }

    // Update the status to 'Read' in the database
    const updateSql = "UPDATE contactus SET status = 'Read' WHERE id = ?";
    con.query(updateSql, [id], (err, updateResult) => {
      if (err) return res.json({ Error: "Update status error in sql" });

      // Send the updated contact as a response
      contact.status = 'Read';
      return res.json({ Status: "Success", Result: contact });
    });
  });
});

app.get('/manage_donorlist', (req, res) => {
  const sql = "Select * FROM donor";
  con.query(sql, (err, result) => {
      if(err) return res.json({Error: "Get donor error in sql"});
      return res.json({Status: "Success", Result: result})
  })
})

app.get('/donor/:id', (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM donor WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error retrieving donor details: ', err);
      return res.status(500).json({ error: 'An error occurred while retrieving donor details.' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Donor not found.' });
    }

    return res.status(200).json({ Status: 'Success', Result: result });
  });
});

app.delete('/deleteDonor/:id', (req, res) => {
  const id = req.params.id;
  const sql = "Delete FROM donor WHERE id = ?";
  con.query(sql, [id], (err, result) => {
      if(err) return res.json({Error: "Update donor error in sql"});
      return res.json({Status: "Success"})
  })
})

app.get('/donor_search', (req, res) => {
  const donorname = req.query.donorname;
  const sql = "SELECT * FROM donor WHERE donorname LIKE ? OR contact LIKE ? OR id LIKE ?";
  const searchQuery = `%${donorname}%`;
  con.query(sql, [searchQuery,searchQuery,searchQuery], (err, result) => {
    if (err) {
      return res.status(500).json({ Error: "Search donor error in SQL" });
    }
    return res.status(200).json({ Status: "Success", Result: result });
  });
});

app.get('/contact_search', (req, res) => {
  const fullname = req.query.fullname;
  const sql = "SELECT * FROM contactus WHERE fullname LIKE ? OR mobile LIKE ?";
  const searchQuery = `%${fullname}%`;
  con.query(sql, [searchQuery, searchQuery], (err, result) => {
    if (err) {
      return res.status(500).json({ Error: "Search contactus error in SQL" });
    }
    return res.status(200).json({ Status: "Success", Result: result });
  });
});

app.get('/SearchBlood', (req, res) => {
  const address = req.query.address;
  const sql = "SELECT * FROM donor WHERE bloodId LIKE ? OR address LIKE ?";
  const searchQuery = `%${address}%`;
  con.query(sql, [searchQuery, searchQuery], (err, result) => {
    if (err) {
      return res.status(500).json({ Error: "Search donor error in SQL" });
    }
    return res.status(200).json({ Status: "Success", Result: result });
  });
});

app.post('/dates_report', (req, res) => {
  const { fromdate, todate } = req.body;
  const sql = "SELECT * FROM donor WHERE creationdate >= ? AND creationdate <= ?";
  const params = [fromdate, todate];
  con.query(sql, params, (err, result) => {
      if (err) {
          console.log(err);
          return res.status(500).json({ error: 'An error occurred while searching donor.' });
      }
      return res.status(200).json(result);
  });
});


app.post('/adminlogin', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
  
    con.query("SELECT * FROM admin WHERE username = ?", [username], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send({ Status: 'Error', Error: 'Something went wrong' });
      }
  
      if (!result.length) {
        return res.send({ Status: 'Error', Error: 'Invalid username or password' });
      }
  
      const hashedPassword = result[0].password;
      bcrypt.compare(password, hashedPassword, (err, response) => {
        if (err) {
          console.log(err);
          return res.status(500).send({ Status: 'Error', Error: 'Something went wrong' });
        }
  
        if (!response) {
          return res.send({ Status: 'Error', Error: 'Invalid username or password' });
        }
  
        const token = jwt.sign({ role: 'admin', id: result[0].id }, 'jwt-secret-key', { expiresIn: '1d' });
        res.cookie('token', token);
        res.send({ Status: 'Success', Data: result, id: result[0].id });
      });
    });
  });
  app.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({Status: "Success"});
})

app.put('/changePassword', verifyUser, (req, res) => {
  const id = req.id; // Accessing the user ID from the request object
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  // Fetch the user from the database
  const getUserQuery = 'SELECT * FROM admin WHERE id = ?';
  con.query(getUserQuery, [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ Status: 'Error', Error: 'Error in running query' });
    }

    if (result.length === 0) {
      return res.json({ Status: 'Error', Error: 'User not found' });
    }

    const user = result[0];

    // Compare the current password with the one stored in the database
    bcrypt.compare(currentPassword, user.password, (err, passwordMatch) => {
      if (err) {
        console.log(err);
        return res.json({ Status: 'Error', Error: 'Error in comparing passwords' });
      }

      if (!passwordMatch) {
        return res.json({ Status: 'Error', Error: 'Current password is incorrect' });
      }

      // Hash the new password
      bcrypt.hash(newPassword, 10, (err, hash) => {
        if (err) {
          console.log(err);
          return res.json({ Status: 'Error', Error: 'Error in hashing the new password' });
        }

        // Update the user's password in the database
        const updatePasswordQuery = 'UPDATE admin SET password = ? WHERE id = ?';
        con.query(updatePasswordQuery, [hash, id], (err, result) => {
          if (err) {
            console.log(err);
            return res.json({ Status: 'Error', Error: 'Error in updating the password' });
          }

          return res.json({ Status: 'Success', Message: 'Password changed successfully' });
        });
      });
    });
  });
});

app.listen(8081, ()=> {
    console.log("Running");
})
