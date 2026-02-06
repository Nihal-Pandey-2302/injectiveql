import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('markets')
export class Market {
  @PrimaryColumn({ type: 'varchar', length: 66 })
  marketId!: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  ticker!: string;

  @Column({ type: 'varchar', length: 20 })
  marketType!: string; // 'spot' or 'derivative'

  @Column({ type: 'varchar', length: 100 })
  baseDenom!: string;

  @Column({ type: 'varchar', length: 100 })
  quoteDenom!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  baseSymbol?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  quoteSymbol?: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, default: 0 })
  makerFeeRate!: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, default: 0 })
  takerFeeRate!: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, nullable: true })
  lastPrice?: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, nullable: true })
  volume24h?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  change24h?: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, nullable: true })
  high24h?: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, nullable: true })
  low24h?: string;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
