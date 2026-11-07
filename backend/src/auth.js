const jwt = require('jsonwebtoken');
require('dotenv').config();
module.exports = (req,res,next) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/,'');
  if (!token) return res.status(401).json({message:'Inicia sesión para continuar.'});
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({message:'Sesión no válida.'}); }
};
