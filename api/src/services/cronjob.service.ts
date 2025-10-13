import {CronJob, cronJob} from '@loopback/cron';
import {repository} from '@loopback/repository';
import {
  startOfDay,
  endOfDay,
  subDays,
  format,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import {
  KpiRepository,
  MembershipDetailsRepository,
  TargetRepository,
  UserRepository,
} from '../repositories';
import {generateUniqueId} from '../utils/constants';

@cronJob()
export class CheckDailyEntriesAtNoon extends CronJob {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {
    super({
      cronTime: '*/30 * * * * *', // Every 30 seconds
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

@cronJob()
export class DailyLeaderboardJob extends CronJob {
  constructor(
    @repository(TargetRepository)
    private targetRepository: TargetRepository,
    @repository(MembershipDetailsRepository)
    private membershipDetailsRepository: MembershipDetailsRepository,
    @repository(KpiRepository)
    private kpiRepository: KpiRepository,
  ) {
    super({
      cronTime: '*/30 * * * * *', // every 30 sec for testing; use '0 0 * * *' for daily
      onTick: async () => {
        await this.runJob();
      },
      start: true,
    });
  }

  async runJob() {
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    console.log(
      `📅 Running Leaderboard for ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`,
    );

    // ----------------------------
    // 1️⃣ Fetch targets
    // ----------------------------
    const targets = await this.targetRepository.find({
      where: {
        startDate: {lte: format(endDate, 'yyyy-MM-dd')},
        endDate: {gte: format(startDate, 'yyyy-MM-dd')},
        isDeleted: false,
      },
      include: [
        {
          relation: 'departmentTargets',
          scope: {
            where: {isDeleted: false},
            include: [
              {
                relation: 'trainerTargets',
                scope: {
                  where: {isDeleted: false},
                  include: ['trainer'],
                },
              },
            ],
          },
        },
      ],
    });
    console.log({targets});

    // Flatten trainer targets including KPI IDs
    const trainerTargets = targets.flatMap((t: any) =>
      (t.departmentTargets ?? []).flatMap((dt: any) =>
        (dt.trainerTargets ?? []).map((tt: any) => ({
          trainerId: tt.trainerId,
          trainer: tt.trainer,
          kpiId: tt.kpiId || dt.kpiId || null, // ✅ use trainerTarget.kpiId first, else departmentTarget.kpiId
          targetValue: tt.targetValue,
          departmentId: dt.departmentId,
          branchId: t.branchId,
        })),
      ),
    );

    // Group total target per trainer
    const trainerMap = new Map<number, {trainer: any; totalTarget: number}>();
    for (const tt of trainerTargets) {
      if (!trainerMap.has(tt.trainerId)) {
        trainerMap.set(tt.trainerId, {trainer: tt.trainer, totalTarget: 0});
      }
      trainerMap.get(tt.trainerId)!.totalTarget += tt.targetValue || 0;
    }

    // ----------------------------
    // 2️⃣ Group target by KPI per trainer
    // ----------------------------
    const trainerKpiMap = new Map<
      number,
      Map<number, {target: number; actual: number}>
    >();

    for (const tt of trainerTargets) {
      if (!trainerKpiMap.has(tt.trainerId)) {
        trainerKpiMap.set(tt.trainerId, new Map());
      }

      const kpiMap = trainerKpiMap.get(tt.trainerId)!;
      const kpiId = tt.kpiId || 0;

      if (!kpiMap.has(kpiId)) {
        kpiMap.set(kpiId, {target: 0, actual: 0});
      }

      kpiMap.get(kpiId)!.target += tt.targetValue || 0;
    }

    // ----------------------------
    // 3️⃣ Fetch memberships (actual sales)
    // ----------------------------
    const memberships = await this.membershipDetailsRepository.find({
      where: {purchaseDate: {gte: startDate, lte: endDate}},
      include: ['sales'],
    });

    const filteredMemberships = (memberships as any[]).filter(m => m.sales);

    const trainerActualMap = new Map<number, number>();

    for (const m of filteredMemberships) {
      const trainerId = m.sales.trainerId;
      const kpiId = m.kpiId || m.sales.kpiId || 0; // ensure correct KPI
      const discountedPrice = m.discountedPrice || 0; // ✅ actual = discountedPrice

      // Total actual per trainer
      trainerActualMap.set(
        trainerId,
        (trainerActualMap.get(trainerId) || 0) + discountedPrice,
      );

      // KPI-specific actual
      if (!trainerKpiMap.has(trainerId)) {
        trainerKpiMap.set(trainerId, new Map());
      }

      const kpiMap = trainerKpiMap.get(trainerId)!;

      if (!kpiMap.has(kpiId)) {
        kpiMap.set(kpiId, {target: 0, actual: 0});
      }

      // ✅ add discountedPrice to that specific KPI actual
      kpiMap.get(kpiId)!.actual += discountedPrice;
    }

    const allKpis = await this.kpiRepository.find({where: {isDeleted: false}});
    const kpiNameMap = new Map(allKpis.map(k => [k.id, k.name]));

    // ----------------------------
    // 4️⃣ Prepare leaderboard
    // ----------------------------
    const result: any[] = [];
    for (const [trainerId, trainerData] of trainerMap) {
      const actual = trainerActualMap.get(trainerId) || 0;
      const achieved = trainerData.totalTarget
        ? (actual / trainerData.totalTarget) * 100
        : 0;
      const salesDeficit = trainerData.totalTarget - actual;

      // Build KPI-wise target breakdown
      // const kpiDataArray = Array.from(
      //   trainerKpiMap.get(trainerId)?.entries() || [],
      // )
      //   .map(([kpiId, kpiData]) => ({
      //     kpiId,
      //     // kpiName: kpiData.name,
      //     target: kpiData.target,
      //     actual: kpiData.actual,
      //   }))
      //   .filter(kpi => !(kpi.target === 0 && kpi.actual === 0));
      const kpiDataArray = Array.from(
        trainerKpiMap.get(trainerId)?.entries() || [],
      )
        .map(([kpiId, kpiData]) => {
          const kpiName = kpiNameMap.get(kpiId) || 'Unknown KPI';
          const achieved = kpiData.target
            ? (kpiData.actual / kpiData.target) * 100
            : 0;
          const salesDeficit = kpiData.target - kpiData.actual;

          return {
            kpiId,
            kpiName,
            target: kpiData.target,
            actual: kpiData.actual,
            achieved: +achieved.toFixed(1),
            salesDeficit,
          };
        })
        // Remove if both target & actual are zero
        .filter(kpi => !(kpi.target === 0 && kpi.actual === 0));

      result.push({
        trainerId,
        trainer: trainerData.trainer,
        target: trainerData.totalTarget,
        actual: Math.round(actual),
        achieved: +achieved.toFixed(1),
        salesDeficit,
        targetByKpi: kpiDataArray, // ✅ KPI breakdown added here
      });
    }

    // Sort and rank
    result.sort((a, b) => b.achieved - a.achieved);
    result.forEach((item, index) => (item.rank = index + 1));

    console.log(JSON.stringify(result));
    console.log(JSON.stringify(result.length));
  }
}
