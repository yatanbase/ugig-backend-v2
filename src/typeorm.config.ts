import { DataSource } from 'typeorm';
import { Player } from './player/player.entity'; // We'll create this entity shortly

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true, // Only for development; set to false in production
  entities: [Player],
  ssl: {
    rejectUnauthorized: false, // Only for Neon's free tier.  Disable in other environments.
  },
});
