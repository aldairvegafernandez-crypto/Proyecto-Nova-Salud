require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const auth = require('./auth');

const app = express();
app.use(cors({origin:'http://localhost:5173'}));
app.use(express.json());

app.get('/api/health',(req,res)=>res.json({status:'ok',app:'Nova Salud'}));

app.post('/api/auth/login', async (req,res) => {
  try {
    const {username,password} = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE username=?',[username]);
    if (!rows.length || !await bcrypt.compare(password,rows[0].password_hash))
      return res.status(401).json({message:'Usuario o contraseña incorrectos.'});
    const u=rows[0], token=jwt.sign({id:u.id,username:u.username,role:u.role},process.env.JWT_SECRET,{expiresIn:'8h'});
    res.json({token,user:{id:u.id,username:u.username,name:u.full_name,role:u.role}});
  } catch(e){res.status(500).json({message:'Error al iniciar sesión.'});}
});

app.use('/api',auth);

app.get('/api/dashboard',async(req,res)=>{
  try {
    const [[p]]=await db.query('SELECT COUNT(*) products, COALESCE(SUM(stock),0) units, SUM(stock <= min_stock) lowStock FROM products');
    const [[s]]=await db.query("SELECT COUNT(*) sales, COALESCE(SUM(total),0) revenue FROM sales WHERE DATE(created_at)=CURDATE()");
    res.json({...p,...s});
  }catch(e){res.status(500).json({message:'No se pudo cargar el resumen.'});}
});

app.get('/api/products',async(req,res)=>{
  try {
    const [rows]=await db.query('SELECT * FROM products ORDER BY name');
    res.json(rows);
  }catch(e){res.status(500).json({message:'Error al consultar productos.'});}
});
app.post('/api/products',async(req,res)=>{
  const {name,category,description,price,stock,min_stock,expiry_date}=req.body;
  if(!name || !category || Number(price)<0 || Number(stock)<0) return res.status(400).json({message:'Completa los campos obligatorios correctamente.'});
  try {
    const [r]=await db.query('INSERT INTO products(name,category,description,price,stock,min_stock,expiry_date) VALUES(?,?,?,?,?,?,?)',
      [name,category,description||'',price,stock,min_stock||5,expiry_date||null]);
    res.status(201).json({id:r.insertId,message:'Producto registrado.'});
  }catch(e){res.status(500).json({message:'No se pudo registrar el producto.'});}
});
app.put('/api/products/:id',async(req,res)=>{
  const {name,category,description,price,stock,min_stock,expiry_date}=req.body;
  try {
    await db.query('UPDATE products SET name=?,category=?,description=?,price=?,stock=?,min_stock=?,expiry_date=? WHERE id=?',
      [name,category,description||'',price,stock,min_stock||5,expiry_date||null,req.params.id]);
    res.json({message:'Producto actualizado.'});
  }catch(e){res.status(500).json({message:'No se pudo actualizar.'});}
});
app.delete('/api/products/:id',async(req,res)=>{
  try { await db.query('DELETE FROM products WHERE id=?',[req.params.id]); res.json({message:'Producto eliminado.'}); }
  catch(e){res.status(409).json({message:'No se puede eliminar: el producto tiene ventas asociadas.'});}
});

app.post('/api/sales',async(req,res)=>{
  const items=req.body.items;
  if(!Array.isArray(items)||!items.length) return res.status(400).json({message:'Agrega productos a la venta.'});
  const conn=await db.getConnection();
  try {
    await conn.beginTransaction();
    let total=0, lines=[];
    for(const item of items){
      const [rows]=await conn.query('SELECT * FROM products WHERE id=? FOR UPDATE',[item.product_id]);
      if(!rows.length || rows[0].stock < Number(item.quantity) || Number(item.quantity)<1) throw new Error('Stock insuficiente o producto inválido.');
      const p=rows[0], subtotal=Number(p.price)*Number(item.quantity);
      total+=subtotal; lines.push({p,quantity:Number(item.quantity),subtotal});
    }
    const [sale]=await conn.query('INSERT INTO sales(user_id,total) VALUES(?,?)',[req.user.id,total]);
    for(const l of lines){
      await conn.query('INSERT INTO sale_items(sale_id,product_id,quantity,unit_price,subtotal) VALUES(?,?,?,?,?)',
        [sale.insertId,l.p.id,l.quantity,l.p.price,l.subtotal]);
      await conn.query('UPDATE products SET stock=stock-? WHERE id=?',[l.quantity,l.p.id]);
    }
    await conn.commit(); res.status(201).json({id:sale.insertId,total,message:'Venta registrada.'});
  }catch(e){await conn.rollback();res.status(400).json({message:e.message||'No se pudo registrar la venta.'});}
  finally{conn.release();}
});

app.get('/api/sales',async(req,res)=>{
  try {
    const [rows]=await db.query(`SELECT s.id,s.total,s.created_at,u.full_name seller
      FROM sales s LEFT JOIN users u ON u.id=s.user_id ORDER BY s.created_at DESC LIMIT 100`);
    res.json(rows);
  }catch(e){res.status(500).json({message:'Error al consultar ventas.'});}
});
app.get('/api/reports',async(req,res)=>{
  try {
    const [[inventory]]=await db.query('SELECT COUNT(*) products,COALESCE(SUM(stock),0) units,COALESCE(SUM(stock*price),0) value, SUM(stock<=min_stock) lowStock FROM products');
    const [[sales]]=await db.query('SELECT COUNT(*) transactions,COALESCE(SUM(total),0) revenue FROM sales');
    res.json({inventory,sales});
  }catch(e){res.status(500).json({message:'Error al generar reportes.'});}
});

const port=process.env.PORT||4000;
app.listen(port,()=>console.log(`Nova Salud API activa en http://localhost:${port}`));
