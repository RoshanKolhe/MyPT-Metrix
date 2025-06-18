import {CronJob, cronJob} from '@loopback/cron';
import {repository} from '@loopback/repository';
import {UserRepository} from '../repositories';
import {generateUniqueId} from '../utils/constants';

@cronJob()
export class CheckDailyEntriesAtNoon extends CronJob {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {
    super({
      cronTime: '0 12 * * *', // Every 30 seconds
      onTick: async () => {
        await this.runJob();
      },
      start: true,
    });
  }

  async runJob() {
    console.log('Cron job everyday at 12 is running at', new Date());
  }
}

@cronJob()
export class CheckDailyEntriesAtEvening extends CronJob {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {
    super({
      cronTime: '0 18 * * *', // At 6 PM daily
      onTick: async () => {
        await this.runJob();
      },
      start: true,
    });
  }

  async runJob() {
    console.log('Cron job at 6 PM is running at', new Date());
  }
}
