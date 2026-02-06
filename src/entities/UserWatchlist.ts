import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('user_watchlist')
export class UserWatchlist {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id!: string; // Composite: `${address}-${marketId}`

  @Column({ type: 'varchar', length: 66 })
  @Index()
  address!: string;

  @Column({ type: 'varchar', length: 66 })
  @Index()
  marketId!: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: {
    priceAlerts?: Array<{
      type: 'above' | 'below';
      price: string;
      enabled: boolean;
    }>;
    volumeAlert?: {
      threshold: string;
      enabled: boolean;
    };
  };

  @CreateDateColumn()
  addedAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
