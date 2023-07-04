import sql from 'mssql';
import config from '../db/config.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const loginRequired = (req, res, next) => {
  if (req.user) {
    console.log(req.user);
      next();
  } else {    
      return res.status(401).json({ message: 'Unauthorized user!' });
  }
};

//get all users
export const getUsers = async (req, res) => {
    try {
        let pool = await sql.connect(config.sql);
        const result = await pool.request()
            .query('SELECT * FROM users');
        res.status(200).json(result.recordset);
    }
    catch (error) {
        res.status(500).json({ error: 'Something went wrong!' });
        console.log(error);
    }
    finally {
        sql.close();
    }
};


//get user by id
export const getUser = async (req, res) => {
    const { user_id } = req.params;
    try {
        let pool = await sql.connect(config.sql);
        const result = await pool.request()
            .input('id', sql.Int, user_id)
            .query("SELECT * FROM users WHERE user_id = @id");
        const user = result.recordset[0];
        if (user) {
            res.status(200).json(result.recordsets[0]);
        } else {
            res.status(404).json({ message: 'User not found!' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Something went wrong!' });
        console.log(error);
    }
    finally {
        sql.close();
    }
};



//Update a user
export const updateUser = async (req, res) => {
    try {
      const { user_id } = req.params;
      const { fullNname, email } = req.body; // Assuming the updated details are sent in the request body
  
      let pool = await sql.connect(config.sql);
      await pool
        .request()
        .input('id', sql.Int, user_id)
        .input('fullName', sql.VarChar, fullName)
        .input('email', sql.VarChar, email)
        
        .query('UPDATE users SET fullName = @fullName, email = @email WHERE user_id = @id');
  
      res.status(200).json({ message: `User with ID ${user_id} updated successfully` });
    } catch (error) {
      res.status(500).json({ error: 'Something went wrong!' });
    } finally {
      sql.close();
    }
  };

// Delete a user
export const deleteUser = async (req, res) => {
    try {
      const { user_id } = req.params;
      let pool = await sql.connect(config.sql);
      const result = await pool
        .request()
        .input('id', sql.Int, user_id)
        .query('DELETE FROM users WHERE user_id = @id');
  
      if (result.rowsAffected[0] === 0) {
        res.status(404).json({ message: 'User not found!' });
      } else {
        res.status(200).json({ message: `User with ID ${user_id} deleted successfully` });
      }
    } catch (error) {
      res.status(500).json({ error: 'Something went wrong!' });
    } finally {
      sql.close();
    }
  };
// Register a user

export const register = async (req, res) => {
    const { fullName, password, email} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Use asynchronous bcrypt.hash instead of bcrypt.hashSync
  
    try {
      let pool = await sql.connect(config.sql);
      const result = await pool
        .request()
        .input('fullName', sql.VarChar, fullName)
        .input('email', sql.VarChar, email)
        .query(
          'SELECT * FROM users WHERE fullName = @fullName OR email = @email'
        );
      const user = result.recordset[0];
      if (user) {
        res.status(409).json({ message: 'Username or email already exists!' });
      } else {
        await pool
          .request()
          .input('fullName', sql.VarChar, fullName)
          .input('password', sql.VarChar, hashedPassword)
          .input('email', sql.VarChar, email)
        
          .query(
            'INSERT INTO users (fullName, password, email) VALUES (@fullName, @password, @email )'
          );
        res.status(200).json({ message: 'User created successfully!' });
      }
    } catch (error) {
    //   res.status(500).json({ error: 'Something went wrong!' });
    res.json(error.message)
      console.log(error);
    } finally {
      sql.close();
    }
  
};

// Login a user
export const login = async (req, res) => {
    const { fullName, password } = req.body;
    try {
        let pool = await sql.connect(config.sql);
        const result = await pool.request()
            .input('fullName', sql.VarChar, fullName)
            .query('SELECT * FROM users WHERE fullName = @fullName');
        const user = result.recordset[0];
        if (!user) {
            res.status(401).json({ message: 'Authetication failed.  Wrong Credentials!' });
        } else {
            const isPasswordCorrect = bcrypt.compareSync(password, user.password);
            if (!isPasswordCorrect) {
                res.status(401).json({ message: ' Authetication failed Wrong Credentials!' });
            } else {
                const token = `JWT ${jwt.sign({ fullName: user.fullName, email: user.email }, config.jwt_secret, { expiresIn: '1h' })}`;
                res.status(200).json({ email: user.email,fullName: user.fullName,id: user.user_id , token: token });
            }
        }
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong!' });
        console.log(error);
    } finally {
        sql.close();
    }


};