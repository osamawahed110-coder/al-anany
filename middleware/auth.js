const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'alanani-super-secret-key-2024';

module.exports = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'غير مصرح بالوصول' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'الجلسة منتهية، يرجى تسجيل الدخول مجدداً' });
  }
};
