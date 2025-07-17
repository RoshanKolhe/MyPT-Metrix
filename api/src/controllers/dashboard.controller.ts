// Uncomment these imports to begin using these cool features!

import {repository} from '@loopback/repository';
import {SalesRepository, UserRepository} from '../repositories';
import {get, param, post, requestBody, response} from '@loopback/rest';
import {Sales} from '../models';
import {authenticate} from '@loopback/authentication';

// import {inject} from '@loopback/core';

export class DashboardController {
  constructor(
    @repository(SalesRepository)
    public salesRepository: SalesRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
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

  // @authenticate('jwt')
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
}
