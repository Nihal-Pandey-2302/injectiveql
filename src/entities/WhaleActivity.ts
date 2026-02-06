import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('whale_activity')
export class WhaleActivity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 66 })
  @Index()
  marketId!: string;

  @Column({ type: 'varchar', length: 66 })
  @Index()
  address!: string;

  @Column({ type: 'varchar', length: 20 })
  activityType!: string; // 'new_position', 'position_increase', 'position_decrease', 'large_trade'

  @Column({ type: 'decimal', precision: 30, scale: 18 })
  size!: string;

  @Column({ type: 'decimal', precision: 30, scale: 18 })
  usdValue!: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, nullable: true })
  price?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  side?: string; // 'long', 'short', 'buy', 'sell'

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  @Index()
  detectedAt!: Date;
}
