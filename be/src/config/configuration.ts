export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/content_approval_system',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'conceps-media-content-approval-system-jwt-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
});
