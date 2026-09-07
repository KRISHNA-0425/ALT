import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const genToken = (userID, roles) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from environment variables');
  }

  const payload = roles ? { userID, roles } : { userID };

  return jwt.sign(
    payload, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
};