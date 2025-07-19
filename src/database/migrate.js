const { pgPool } = require('../config/database');
const logger = require('../config/logger');

const runMigrations = async () => {
  try {
    logger.info('í´„ Running database migrations...');
    
    // Create user_analytics table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS user_analytics (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT
      );
    `);
    
    // Create indexes
    await pgPool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_action ON user_analytics(action);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_timestamp ON user_analytics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_metadata ON user_analytics USING GIN(metadata);
    `);
    
    // Create API usage tracking table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id SERIAL PRIMARY KEY,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code INTEGER NOT NULL,
        response_time INTEGER NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(255),
        ip_address INET
      );
    `);
    
    await pgPool.query(`
      CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
      CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);
      CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
    `);
    
    logger.info('âœ… Database migrations completed successfully');
  } catch (error) {
    logger.error('âŒ Database migration failed:', error);
    process.exit(1);
  }
};

// Run migrations if called directly
if (require.main === module) {
  runMigrations().then(() => {
    process.exit(0);
  });
}

module.exports = { runMigrations };
