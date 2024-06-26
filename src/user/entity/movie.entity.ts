import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Movie {
  @PrimaryGeneratedColumn('uuid', { name: 'id_movie' })
  id: string;

  @Column({ length: 12, unique: true, name: 'id_tmdb' })
  tmdbId: string;

  @ManyToMany(() => User, (user) => user.watchlist)
  watchlistedBy: User[];
}
