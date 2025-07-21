// Uncomment these imports to begin using these cool features!

import {repository} from '@loopback/repository';
import {
  SalesRepository,
  TargetRepository,
  UserRepository,
} from '../repositories';
import {get, param, post, requestBody, response} from '@loopback/rest';
import {Sales} from '../models';
import {authenticate} from '@loopback/authentication';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

// import {inject} from '@loopback/core';

export class DashboardController {
  constructor(
    @repository(SalesRepository)
    public salesRepository: SalesRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(TargetRepository)
    public targetRepository: TargetRepository,
  ) {}

  @authenticate({
    strategy: 'jwt',
  })
  @get('/dashboard/summary')
  async getSummary(
    @param.query.string('kpiIds') kpiIdsStr?: string,
  ): Promise<any> {
    const kpiIds = kpiIdsStr
      ? kpiIdsStr
          .split(',')
          .map(id => parseInt(id.trim(), 10))
          .filter(Boolean)
      : [];

    const today = new Date(new Date().toDateString());
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);

    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 13);
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 7);

    const filter: any = {
      where: {
        isActive: true,
        type: 'sales',
      },
    };

    if (kpiIds.length > 0) {
      filter.where.kpiId = {inq: kpiIds};
    }

    const allSales = await this.salesRepository.find({
      ...filter,

      include: ['membershipDetails'],
    });
    const totalRevenue = allSales.reduce(
      (sum, s) => sum + (s.membershipDetails?.discountedPrice || 0),
      0,
    );
    const totalTickets = allSales.length;
    const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;

    const get7DaySeries = (sales: Sales[], start: Date): number[] => {
      const series = Array(7).fill(0);
      sales.forEach(s => {
        if (!s.createdAt) return;
        const d = new Date(s.createdAt);
        const dayDiff = Math.floor(
          (d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (dayDiff >= 0 && dayDiff < 7) {
          series[dayDiff] += s.membershipDetails?.discountedPrice || 0;
        }
      });
      return series;
    };

    const get7DayTicketsSeries = (sales: Sales[], start: Date): number[] => {
      const series = Array(7).fill(0);
      sales.forEach(s => {
        if (!s.createdAt) return;
        const d = new Date(s.createdAt);
        const dayDiff = Math.floor(
          (d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (dayDiff >= 0 && dayDiff < 7) {
          series[dayDiff] += 1;
        }
      });
      return series;
    };

    const thisWeekSales = await this.salesRepository.find({
      where: {
        ...filter.where,
        createdAt: {between: [startDate, today]},
      },
      include: ['membershipDetails'],
    });

    const lastWeekSales = await this.salesRepository.find({
      where: {
        ...filter.where,
        createdAt: {between: [lastWeekStart, lastWeekEnd]},
      },
      include: ['membershipDetails'],
    });

    const thisWeekRevenue = thisWeekSales.reduce(
      (s, v) => s + (v.membershipDetails?.discountedPrice || 0),
      0,
    );
    const lastWeekRevenue = lastWeekSales.reduce(
      (s, v) => s + (v.membershipDetails?.discountedPrice || 0),
      0,
    );

    const thisWeekTickets = thisWeekSales.length;
    const lastWeekTickets = lastWeekSales.length;

    const thisWeekAvgTicket =
      thisWeekTickets > 0 ? thisWeekRevenue / thisWeekTickets : 0;
    const lastWeekAvgTicket =
      lastWeekTickets > 0 ? lastWeekRevenue / lastWeekTickets : 0;

    const percentChange = (current: number, prev: number): number => {
      if (prev === 0 && current === 0) return 0;
      if (prev === 0) return 100;
      return ((current - prev) / prev) * 100;
    };

    return {
      revenue: {
        value: Math.round(thisWeekRevenue),
        percent: parseFloat(
          percentChange(thisWeekRevenue, lastWeekRevenue).toFixed(1),
        ),
        series: get7DaySeries(thisWeekSales, startDate),
      },
      tickets: {
        value: thisWeekTickets,
        percent: parseFloat(
          percentChange(thisWeekTickets, lastWeekTickets).toFixed(1),
        ),
        series: get7DayTicketsSeries(thisWeekSales, startDate),
      },
      averageTicket: {
        value: Math.round(thisWeekAvgTicket),
        percent: parseFloat(
          percentChange(thisWeekAvgTicket, lastWeekAvgTicket).toFixed(1),
        ),
        series: (() => {
          const revenueSeries = get7DaySeries(thisWeekSales, startDate);
          const ticketSeries = get7DayTicketsSeries(thisWeekSales, startDate);
          return revenueSeries.map((rev, i) =>
            ticketSeries[i] > 0
              ? parseFloat((rev / ticketSeries[i]).toFixed(2))
              : 0,
          );
        })(),
      },
    };
  }

  @authenticate('jwt')
  @get('/clients/chart-data')
  @response(200, {
    description: 'Chart data grouped by KPI',
  })
  async getClientChartData(
    @param.query.string('startDate') startDate: string,
    @param.query.string('endDate') endDate: string,
    @param.query.string('kpiIds') kpiIdsStr?: string,
  ): Promise<object> {
    const kpiIds = kpiIdsStr
      ? kpiIdsStr
          .split(',')
          .map(id => Number(id.trim()))
          .filter(id => !isNaN(id))
      : [];
    const sales: any = await this.salesRepository.find({
      where: {
        and: [
          {createdAt: {gte: new Date(startDate)}},
          {createdAt: {lte: new Date(endDate)}},
          {isDeleted: false},
          ...(kpiIds?.length ? [{kpiId: {inq: kpiIds}}] : []),
        ],
      },
      include: [{relation: 'kpi', scope: {fields: ['id', 'name']}}],
    });

    // Initialize date range
    const categories: string[] = [];
    const dateMap: {[date: string]: {[kpiName: string]: number}} = {};
    const kpiSet = new Set<string>();

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      categories.push(dateStr);
      dateMap[dateStr] = {};
    }

    for (const s of sales) {
      const dateStr = s.createdAt?.toISOString().split('T')[0];
      const kpiName = s.kpi?.name || 'Unknown KPI';
      if (!dateStr || !dateMap[dateStr]) continue;

      kpiSet.add(kpiName);
      if (!dateMap[dateStr][kpiName]) dateMap[dateStr][kpiName] = 0;
      dateMap[dateStr][kpiName]++;
    }

    const series = Array.from(kpiSet).map(kpiName => ({
      name: kpiName,
      data: categories.map(date => dateMap[date][kpiName] || 0),
    }));

    return {categories, series};
  }

  // @authenticate('jwt')
  @get('/dashboard/forecast')
  async forecastData(
    @param.query.string('interval')
    interval: 'weekly' | 'monthly' | 'yearly' = 'weekly',
  ): Promise<any> {
    const today = new Date(new Date().toDateString());
    let startDate = new Date(today);
    let endDate = new Date(today);

    if (interval === 'weekly') {
      const day = today.getDay(); // 0 = Sun, 1 = Mon, ...
      const mondayOffset = day === 0 ? -6 : 1 - day;
      startDate.setDate(today.getDate() + mondayOffset);
      endDate.setDate(startDate.getDate() + 6);
    } else if (interval === 'monthly') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (interval === 'yearly') {
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
    }

    // Fetch targets and sales data
    const targets = await this.targetRepository.find({
      where: {
        and: [
          {startDate: {lte: endDate.toISOString()}},
          {endDate: {gte: startDate.toISOString()}},
        ],
        isDeleted: false,
      },
    });

    const sales = await this.salesRepository.find({
      where: {
        createdAt: {between: [startDate, endDate]},
      },
      include: ['membershipDetails'],
    });

    // Prepare time buckets (labels)
    const labels: string[] = [];
    const days =
      Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      if (interval === 'weekly') {
        labels.push(d.toLocaleString('en-US', {weekday: 'short'}));
      } else {
        labels.push(d.toISOString().slice(0, 10));
      }
    }

    const targetTotal = targets.reduce(
      (sum, t) => sum + (t.targetValue || 0),
      0,
    );
    const targetSeries = Array(days).fill(Math.round(targetTotal / days));

    const actualSeries = Array(days).fill(0);
    for (const sale of sales) {
      if (!sale.createdAt) continue;
      const d = new Date(sale.createdAt);
      const idx = Math.floor(
        (d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (idx >= 0 && idx < days) {
        actualSeries[idx] += sale.membershipDetails?.discountedPrice || 0;
      }
    }

    const actualToDate = actualSeries.reduce((sum, val) => sum + val, 0);
    const daysWithData = actualSeries.filter(v => v > 0).length || 1;
    const projected = (actualToDate / daysWithData) * days;
    const varianceAmount = Math.round(projected - targetTotal);
    const variancePercent = parseFloat(
      ((varianceAmount / targetTotal) * 100).toFixed(1),
    );

    let status = 'On Track';
    let message = '';
    if (varianceAmount > 0) {
      status = 'Ahead of Pace';
      message = `Projected to exceed target by $${varianceAmount.toLocaleString()} (${variancePercent}%)`;
    } else if (varianceAmount < 0) {
      status = 'Behind Pace';
      message = `Projected to miss target by $${Math.abs(varianceAmount).toLocaleString()} (${variancePercent}%)`;
    }

    return {
      interval,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      labels,
      targetSeries,
      actualSeries,
      targetTotal,
      actualToDate,
      projected: Math.round(projected),
      varianceAmount,
      variancePercent,
      forecast: {
        status,
        message,
      },
    };
  }

  @get('/leaderboard/trainer-performance')
  async getTrainerLeaderboard(
    @param.query.string('startDate') startDateStr: string,
    @param.query.string('endDate') endDateStr: string,
    @param.query.number('branchId') branchId?: number,
    @param.query.number('departmentId') departmentId?: number,
  ): Promise<any[]> {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Last period
    const daysDiff =
      (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    const lastStart = new Date(startDate);
    lastStart.setDate(lastStart.getDate() - daysDiff);
    const lastEnd = new Date(startDate);
    lastEnd.setDate(lastEnd.getDate() - 1);

    // Fetch all targets in date range
    const targets = await this.targetRepository.find({
      where: {
        branchId,
        startDate: {lte: endDate.toISOString().split('T')[0]},
        endDate: {gte: startDate.toISOString().split('T')[0]},
        isDeleted: false,
      },
      include: [
        {
          relation: 'departmentTargets',
          scope: {
            where: {
              ...(departmentId ? {departmentId} : {}),
              isDeleted: false,
            },
            include: [
              {
                relation: 'trainerTargets',
                scope: {
                  where: {isDeleted: false},
                  include: ['trainer', 'kpi'],
                },
              },
            ],
          },
        },
      ],
    });

    console.log(targets);

    // Flatten all TrainerTargets
    const trainerTargets = targets.flatMap(t =>
      t.departmentTargets.flatMap((dt: any) =>
        dt.trainerTargets.map((tt: any) => ({
          trainerId: tt.trainerId,
          trainer: tt.trainer,
          kpiId: tt.kpiId,
          targetValue: tt.targetValue,
          departmentId: dt.departmentId,
        })),
      ),
    );

    const result: any[] = [];

    for (const tt of trainerTargets) {
      // Current period sales
      const sales = await this.salesRepository.find({
        where: {
          trainerId: tt.trainerId,
          createdAt: {between: [startDate, endDate]},
        },
      });

      const actual = sales.length;

      // Last period sales
      const lastSales = await this.salesRepository.find({
        where: {
          trainerId: tt.trainerId,
          createdAt: {between: [lastStart, lastEnd]},
        },
      });

      const previousActual = lastSales.length;
      const achieved = tt.targetValue ? (actual / tt.targetValue) * 100 : 0;
      const delta =
        previousActual === 0
          ? 100
          : ((actual - previousActual) / previousActual) * 100;

      // Status
      let status = 'Under Performer';
      if (achieved >= 100 && achieved < 110) status = 'Achiever';
      else if (achieved >= 110) status = 'Over Achiever';

      result.push({
        trainerId: tt.trainerId,
        name: tt.trainer?.name || 'Unknown',
        departmentId: tt.departmentId,
        role: tt.trainer?.role,
        target: tt.targetValue,
        actual,
        achieved: +achieved.toFixed(1),
        status,
        changeFromLastPeriod: {
          percent: +delta.toFixed(1),
          previousActual,
        },
      });
    }

    return result;
  }
}
