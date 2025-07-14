// Uncomment these imports to begin using these cool features!

import {repository} from '@loopback/repository';
import {SalesRepository, UserRepository} from '../repositories';
import {get, param, post, requestBody} from '@loopback/rest';
import {Sales} from '../models';

// import {inject} from '@loopback/core';

export class DashboardController {
  constructor(
    @repository(SalesRepository)
    public salesRepository: SalesRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {}

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
      where: {},
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
}
