module.exports = {
  secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
  expiresIn: process.env.JWT_EXPIRE || '7d',
  
  // Token generation options
  options: {
    issuer: 'mpm-agile-tools',
    audience: 'mpm-users'
  }
};
