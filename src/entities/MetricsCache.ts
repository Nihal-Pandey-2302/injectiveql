import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('metrics_cache')
export class MetricsCache {
  @PrimaryColumn({ type: 'varchar', length: 200 })
  key!: string;

  @Column({ type: 'varchar', length: 66, nullable: true })
  @Index()
  marketId?: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  metricType!: string; // 'liquidity', 'volatility', 'health', 'arbitrage', etc.

  @Column({ type: 'jsonb' })
  value!: any;

  @CreateDateColumn()
  computedAt!: Date;

  @Column({ type: 'timestamp' })
  @Index()
  expiresAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
