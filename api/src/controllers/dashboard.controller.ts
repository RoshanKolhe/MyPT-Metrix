// Uncomment these imports to begin using these cool features!

import {repository} from '@loopback/repository';
import {
  ConductionRepository,
  MembershipDetailsRepository,
  SalesRepository,
  TargetRepository,
  TrainerRepository,
  UserRepository,
} from '../repositories';
import {
  get,
  HttpErrors,
  param,
  post,
  requestBody,
  response,
} from '@loopback/rest';
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
    @repository(TrainerRepository)
    public trainerRepository: TrainerRepository,
    @repository(MembershipDetailsRepository)
    public membershipDetailsRepository: MembershipDetailsRepository,

    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(TargetRepository)
    public targetRepository: TargetRepository,
    @repository(ConductionRepository)
    public conductionRepository: ConductionRepository,
  ) {}

  @authenticate({
    strategy: 'jwt',
  })
  @get('/dashboard/summary')
  async getSummary(
    @param.query.string('kpiIds') kpiIdsStr?: string,
    @param.query.number('branchId') branchId?: number,
    @param.query.number('departmentId') departmentId?: number,
    @param.query.string('startDate') startDateStr?: string,
    @param.query.string('endDate') endDateStr?: string,
    @param.query.string('country') country?: string,
  ): Promise<any> {
    // parse kpi ids
    const kpiIds = kpiIdsStr
      ? kpiIdsStr
          .split(',')
          .map(id => parseInt(id.trim(), 10))
          .filter(Boolean)
      : [];

    // prepare default date ranges (7-day window)
    const today = new Date(new Date().toDateString());
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);

    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 13);
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 7);

    // Step 1: If date filter is passed, fetch membershipDetails in that date range
    // and extract the linked sale ids (the FK is on membershipDetails).
    let saleIds: number[] = [];
    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0); // midnight UTC
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999); // end of day UTC
      console.log('summaryStart', start);
      console.log('summaryEnd', end);
      const memberships = await this.membershipDetailsRepository.find({
        where: {
          purchaseDate: {between: [start, end]},
        },
      });
      saleIds = memberships.map(m => m.salesId).filter(Boolean) as number[];
    }

    // Step 2: Build Sales filter but filter by sales.id (not membershipDetailsId)
    const filter: any = {
      where: {
        isDeleted: false,
        ...(kpiIds.length > 0 && {kpiId: {inq: kpiIds}}),
        ...(branchId && {branchId}),
        ...(departmentId && {departmentId}),
        ...(country && {country}),
        // use sale ids if provided by membership lookup
        ...(saleIds.length > 0 && {id: {inq: saleIds}}),
      },
      include: ['membershipDetails'], // still include membershipDetails for calculations
    };

    // Step 3: Fetch filtered sales
    const allSales = await this.salesRepository.find(filter);
    const totalTrainers = await this.trainerRepository.count({
      isDeleted: false,
      isActive: true,
    });

    // The rest of your calculations remain the same (but use membershipDetails.purchaseDate)
    const totalRevenue = allSales.reduce(
      (sum, s) => sum + (s.membershipDetails?.discountedPrice || 0),
      0,
    );
    const avgRevenuePerTrainer =
      totalTrainers.count > 0 ? totalRevenue / totalTrainers.count : 0;

    const totalTickets = allSales.length;
    const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;

    const get7DaySeries = (sales: any[], start: Date): number[] => {
      const series = Array(7).fill(0);
      sales.forEach(s => {
        const pd = s.membershipDetails?.purchaseDate;
        if (!pd) return;
        const d = new Date(pd);
        const dayDiff = Math.floor(
          (d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (dayDiff >= 0 && dayDiff < 7) {
          series[dayDiff] += s.membershipDetails?.discountedPrice || 0;
        }
      });
      return series;
    };

    const get7DayTicketsSeries = (sales: any[], start: Date): number[] => {
      const series = Array(7).fill(0);
      sales.forEach(s => {
        const pd = s.membershipDetails?.purchaseDate;
        if (!pd) return;
        const d = new Date(pd);
        const dayDiff = Math.floor(
          (d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (dayDiff >= 0 && dayDiff < 7) {
          series[dayDiff] += 1;
        }
      });
      return series;
    };

    // Select thisWeekSales / lastWeekSales using membershipDetails.purchaseDate
    const thisWeekSales = allSales.filter(s => {
      const pd = s.membershipDetails?.purchaseDate;
      if (!pd) return false;
      const d = new Date(pd);
      return (
        d >= new Date(startDate.setHours(0, 0, 0, 0)) &&
        d <= new Date(today.setHours(23, 59, 59, 999))
      );
    });

    const lastWeekSales = allSales.filter(s => {
      const pd = s.membershipDetails?.purchaseDate;
      if (!pd) return false;
      const d = new Date(pd);
      return (
        d >= new Date(lastWeekStart.setHours(0, 0, 0, 0)) &&
        d <= new Date(lastWeekEnd.setHours(23, 59, 59, 999))
      );
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
        value: Math.round(totalRevenue),
        percent: parseFloat(
          percentChange(thisWeekRevenue, lastWeekRevenue).toFixed(1),
        ),
        series: get7DaySeries(thisWeekSales, startDate),
      },
      tickets: {
        value: totalTickets,
        percent: parseFloat(
          percentChange(thisWeekTickets, lastWeekTickets).toFixed(1),
        ),
        series: get7DayTicketsSeries(thisWeekSales, startDate),
      },
      averageTicket: {
        value: Math.round(avgTicket),
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
      avgRevenuePerTrainer,
    };
  }

  @authenticate('jwt')
  @get('/clients/chart-data')
  @response(200, {
    description:
      'Chart data grouped by KPI (filtered by membershipDetails.purchaseDate)',
  })
  async getClientChartData(
    @param.query.string('startDate') startDate: string,
    @param.query.string('endDate') endDate: string,
    @param.query.string('kpiIds') kpiIdsStr?: string,
    @param.query.string('branchId') branchId?: string,
    @param.query.string('departmentId') departmentId?: string,
    @param.query.string('country') country?: string,
  ): Promise<object> {
    const kpiIds = kpiIdsStr
      ? kpiIdsStr
          .split(',')
          .map(id => Number(id.trim()))
          .filter(id => !isNaN(id))
      : [];

    // Step 1: Fetch membershipDetails within the date range (includes full end day)
    const membershipRecords = await this.membershipDetailsRepository.find({
      where: {
        purchaseDate: {
          gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        },
      },
      include: [
        {
          relation: 'sales',
          scope: {
            where: {
              isDeleted: false,
              ...(kpiIds.length ? {kpiId: {inq: kpiIds}} : {}),
              ...(branchId ? {branchId: Number(branchId)} : {}),
              ...(departmentId ? {departmentId: Number(departmentId)} : {}),
              ...(country ? {country: country} : {}),
            },
            include: [
              {
                relation: 'kpi',
                scope: {
                  fields: ['id', 'name'],
                },
              },
            ],
          },
        },
      ],
    });

    // Step 2: Flatten sales from memberships
    const filteredSales = membershipRecords
      .map((m: any) => {
        if (!m.sales) return null;
        return {
          sale: m.sales,
          purchaseDate: m.purchaseDate,
          discountedPrice: m.discountedPrice ?? 0,
        };
      })
      .filter(
        (
          item,
        ): item is {
          sale: any;
          purchaseDate: Date | string;
          discountedPrice: number;
        } => !!item,
      );

    // Step 3: Prepare categories (local date format)
    const categories: string[] = [];
    const dateMap: {[date: string]: {[kpiName: string]: number}} = {};
    const kpiSet = new Set<string>();

    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatLocalDate = (d: Date) =>
      d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

    for (
      let d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = formatLocalDate(new Date(d));
      categories.push(dateStr);
      dateMap[dateStr] = {};
    }

    // Step 4: Sum discountedPrice per day per KPI
    for (const {sale, purchaseDate, discountedPrice} of filteredSales) {
      const d = new Date(purchaseDate);
      const dateStr = formatLocalDate(d);

      if (!dateMap[dateStr]) continue; // skip if out of range

      const kpiName = sale.kpi?.name || 'Unknown KPI';
      kpiSet.add(kpiName);

      if (!dateMap[dateStr][kpiName]) dateMap[dateStr][kpiName] = 0;

      dateMap[dateStr][kpiName] += discountedPrice;
    }

    // Step 5: Construct series for chart
    const series = Array.from(kpiSet).map(kpiName => ({
      name: kpiName,
      data: categories.map(date => dateMap[date][kpiName] || 0),
    }));

    return {categories, series};
  }

  @authenticate('jwt')
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

    // Fetch targets and sales
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

    // Prepare time labels
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
        labels.push(this.formatDate(d));
      }
    }

    // === Target Series (Cumulative) ===
    const targetTotal = targets.reduce(
      (sum, t) => sum + (t.targetValue || 0),
      0,
    );
    const dailyTarget = targetTotal / days;
    const targetSeries: number[] = [];
    for (let i = 0; i < days; i++) {
      targetSeries[i] = Math.round(dailyTarget * (i + 1)); // cumulative
    }

    // === Actual Series (Cumulative) ===
    const actualDaily = Array(days).fill(0);
    for (const sale of sales) {
      if (!sale.createdAt) continue;
      const d = new Date(sale.createdAt);
      const idx = Math.floor(
        (d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (idx >= 0 && idx < days) {
        actualDaily[idx] += sale.membershipDetails?.discountedPrice || 0;
      }
    }

    const actualSeries: number[] = [];
    let runningTotal = 0;
    for (let i = 0; i < days; i++) {
      runningTotal += actualDaily[i];
      actualSeries.push(runningTotal);
    }

    // === Projection & Variance ===
    const actualToDate = actualSeries[actualSeries.length - 1] || 0;
    const daysWithData = actualDaily.filter(v => v > 0).length || 1;
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

    // === Response ===
    return {
      interval,
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
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

    // Fetch targets
    const targets = await this.targetRepository.find({
      where: {
        branchId,
        startDate: {lte: endDate.toISOString().split('T')[0]},
        endDate: {gte: startDate.toISOString().split('T')[0]},
        isDeleted: false,
      },
      include: [
        {
          relation: 'branch',
        },
        {
          relation: 'departmentTargets',
          scope: {
            where: {
              ...(departmentId ? {departmentId} : {}),
              isDeleted: false,
            },
            include: [
              {
                relation: 'department',
              },
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

    // Flatten TrainerTargets
    const trainerTargets = targets.flatMap((t: any) =>
      (t.departmentTargets ?? []).flatMap((dt: any) =>
        (dt.trainerTargets ?? []).map((tt: any) => ({
          trainerId: tt.trainerId,
          trainer: tt.trainer,
          kpiId: tt.kpiId,
          targetValue: tt.targetValue,
          departmentId: dt.departmentId,
          department: dt.department,
          branchId: t.branchId,
          branch: t.branch,
        })),
      ),
    );

    const result: any[] = [];

    for (const tt of trainerTargets) {
      // Current period actual value
      const sales = await this.salesRepository.find({
        where: {
          trainerId: tt.trainerId,
          createdAt: {between: [startDate, endDate]},
        },
        include: ['membershipDetails'],
      });

      const actual = sales.reduce((sum, sale) => {
        return sum + (sale.membershipDetails?.discountedPrice || 0);
      }, 0);

      // Last period actual value
      const lastSales = await this.salesRepository.find({
        where: {
          trainerId: tt.trainerId,
          createdAt: {between: [lastStart, lastEnd]},
        },
        include: ['membershipDetails'],
      });

      const previousActual = lastSales.reduce((sum, sale) => {
        return sum + (sale.membershipDetails?.discountedPrice || 0);
      }, 0);

      // Achievement % and delta
      const achieved = tt.targetValue ? (actual / tt.targetValue) * 100 : 0;
      let delta = 0;
      if (previousActual === 0 && actual > 0) {
        delta = 100;
      } else if (previousActual === 0 && actual === 0) {
        delta = 0;
      } else {
        delta = ((actual - previousActual) / previousActual) * 100;
      }

      // Performance Status
      let status = 'Under Performer';
      if (achieved >= 100 && achieved < 110) status = 'Achiever';
      else if (achieved >= 110) status = 'Over Achiever';

      result.push({
        trainerId: tt.trainerId,
        name: tt.trainer?.firstName || 'Unknown',
        departmentId: tt.departmentId,
        department: tt.department ?? null, // Include department details
        branchId: tt.branchId,
        branch: tt.branch ?? null, // Include branch details
        role: tt.trainer?.role,
        target: tt.targetValue,
        actual: Math.round(actual),
        achieved: +achieved.toFixed(1),
        status,
        changeFromLastPeriod: {
          percent: +delta.toFixed(1),
          previousActual: Math.round(previousActual),
        },
      });
    }

    // Sort and rank
    result.sort((a, b) => b.achieved - a.achieved);
    result.forEach((item, index) => {
      item.rank = index + 1;
    });

    return result;
  }

  @authenticate('jwt')
  @get('/conductions/chart-data')
  @response(200, {
    description: 'Conduction chart data grouped by KPI',
  })
  async getConductionChartData(
    @param.query.string('startDate') startDate: string,
    @param.query.string('endDate') endDate: string,
    @param.query.string('kpiIds') kpiIdsStr?: string,
    @param.query.number('branchId') branchId?: number,
    @param.query.number('departmentId') departmentId?: number,
  ): Promise<object> {
    const kpiIds = kpiIdsStr
      ? kpiIdsStr
          .split(',')
          .map(id => Number(id.trim()))
          .filter(id => !isNaN(id))
      : [];

    const whereConditions: any[] = [
      {
        conductionDate: {
          between: [
            new Date(new Date(startDate).setHours(0, 0, 0, 0)),
            new Date(new Date(endDate).setHours(23, 59, 59, 999)),
          ],
        },
      },
      {isDeleted: false},
    ];

    if (kpiIds.length) whereConditions.push({kpiId: {inq: kpiIds}});
    if (branchId) whereConditions.push({branchId});
    if (departmentId) whereConditions.push({departmentId});

    const conductions: any = await this.conductionRepository.find({
      where: {and: whereConditions},
      include: [{relation: 'kpi'}],
    });

    // Initialize date range
    const categories: string[] = [];
    const dateMap: {[date: string]: {[kpiName: string]: number}} = {};
    const kpiSet = new Set<string>();

    const start = new Date(startDate);
    const end = new Date(endDate);

    const totalDays = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(start.getTime());
      d.setDate(d.getDate() + i);

      const dateStr = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      categories.push(dateStr);
      dateMap[dateStr] = {};
    }

    for (const c of conductions) {
      if (!c.conductionDate) continue;

      const dateStr = new Date(c.conductionDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const kpiName = c.kpi?.name || 'Unknown KPI';
      if (!dateMap[dateStr]) continue;

      kpiSet.add(kpiName);
      if (!dateMap[dateStr][kpiName]) dateMap[dateStr][kpiName] = 0;

      dateMap[dateStr][kpiName] += c.conductions;
    }

    const series = Array.from(kpiSet).map(kpiName => ({
      name: kpiName,
      data: categories.map(date =>
        Number((dateMap[date][kpiName] || 0).toFixed(2)),
      ),
    }));

    return {categories, series};
  }

  @authenticate({
    strategy: 'jwt',
  })
  @get('/gender-ratio', {
    responses: {
      '200': {
        description: 'Male vs Female client ratio based on unique email',
        content: {'application/json': {schema: {type: 'object'}}},
      },
    },
  })
  async getGenderRatio(
    @param.query.string('startDate') startDate?: string,
    @param.query.string('endDate') endDate?: string,
    @param.query.string('departmentId') departmentId?: string,
    @param.query.string('kpiIds') kpiIdsStr?: string,
    @param.query.string('branchId') branchId?: string,
    @param.query.string('country') country?: string,
  ): Promise<object> {
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        between: [new Date(startDate), new Date(endDate)],
      };
    }

    if (departmentId) where.departmentId = departmentId;
    if (branchId) where.branchId = branchId;
    if (country) {
      where.country = country;
    }

    if (kpiIdsStr) {
      const kpiIds = kpiIdsStr
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));
      if (kpiIds.length > 0) {
        where.kpiId = {inq: kpiIds};
      }
    }

    const sales = await this.salesRepository.find({
      where,
      fields: {email: true, gender: true},
    });

    const uniqueClients = new Map<string, string>();

    for (const sale of sales) {
      const email = sale.email?.toLowerCase();
      const gender = sale.gender?.toLowerCase();

      if (email && gender && !uniqueClients.has(email)) {
        uniqueClients.set(email, gender);
      }
    }

    let maleCount = 0;
    let femaleCount = 0;

    for (const gender of uniqueClients.values()) {
      if (gender === 'male') maleCount++;
      else if (gender === 'female') femaleCount++;
    }

    const total = maleCount + femaleCount;
    const maleRatio = total ? ((maleCount / total) * 100).toFixed(2) : '0.00';
    const femaleRatio = total
      ? ((femaleCount / total) * 100).toFixed(2)
      : '0.00';

    // --- NEW: Calculate Male:Female ratio ---
    let ratioString = 'N/A';
    if (maleCount > 0 && femaleCount > 0) {
      // reduce to simplest form (e.g., 10:20 => 1:2)
      const gcd = (a: number, b: number): number =>
        b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(maleCount, femaleCount);
      ratioString = `${maleCount / divisor}:${femaleCount / divisor}`;
    } else if (maleCount > 0) {
      ratioString = `${maleCount}:0`;
    } else if (femaleCount > 0) {
      ratioString = `0:${femaleCount}`;
    }

    return {
      maleCount,
      femaleCount,
      maleRatio: Number(maleRatio),
      femaleRatio: Number(femaleRatio),
      totalUniqueClients: total,
      maleToFemaleRatio: ratioString,
    };
  }

  @authenticate({
    strategy: 'jwt',
  })
  @get('/member-statistics')
  async getMemberStats(
    @param.query.string('startDate') startDateStr: string,
    @param.query.string('endDate') endDateStr: string,
    @param.query.string('branchId') branchId?: string,
    @param.query.string('departmentId') departmentId?: string,
    @param.query.string('kpiIds') kpiIdsStr?: string,
    @param.query.string('country') country?: string,
  ): Promise<object> {
    if (!startDateStr || !endDateStr) {
      throw new HttpErrors.BadRequest('startDate and endDate are required.');
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new HttpErrors.BadRequest('Invalid date format.');
    }

    const where: any = {
      and: [{createdAt: {gte: startDate}}, {createdAt: {lte: endDate}}],
    };

    if (branchId) where.and.push({branchId: parseInt(branchId)});
    if (departmentId) where.and.push({departmentId: parseInt(departmentId)});
    if (country) {
      where.and.push({country: country});
    }
    if (kpiIdsStr) {
      const kpiIds = kpiIdsStr
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));
      if (kpiIds.length > 0) {
        where.and.push({kpiId: {inq: kpiIds}});
      }
    }

    const sales = await this.salesRepository.find({
      where,
      include: [{relation: 'membershipDetails'}],
    });

    const memberMap: {[email: string]: typeof sales} = {};
    for (const sale of sales) {
      if (!sale.email) continue;
      if (!memberMap[sale.email]) memberMap[sale.email] = [];
      memberMap[sale.email].push(sale);
    }

    let newMemberCount = 0;
    let renewedMemberCount = 0;
    let expiredMemberCount = 0;

    for (const email in memberMap) {
      const records = memberMap[email];
      const hasRenewal = records.some(
        r => r.memberType?.toLowerCase() === 'rnl',
      );
      const hasNew = records.some(r => r.memberType?.toLowerCase() === 'new');

      if (hasRenewal) {
        renewedMemberCount++;
      } else if (records.length === 1 && hasNew) {
        newMemberCount++;
      } else if (records.length === 1) {
        const record = records[0];
        const expiryDate = record.membershipDetails?.expiryDate
          ? new Date(record.membershipDetails.expiryDate)
          : null;
        if (expiryDate && expiryDate < new Date() && !hasRenewal) {
          expiredMemberCount++;
        }
      }
    }

    const totalMemberCount = Object.keys(memberMap).length;
    const classifiedTotal =
      newMemberCount + renewedMemberCount + expiredMemberCount;

    const percent = (count: number, base: number) =>
      base > 0 ? parseFloat(((count / base) * 100).toFixed(2)) : 0;

    // ✅ Calculate simplified ratio (only for classified members)
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const gcdAll = (nums: number[]): number =>
      nums.reduce((acc, num) => gcd(acc, num), nums[0] || 1);

    const ratioNums = [newMemberCount, renewedMemberCount, expiredMemberCount];
    const divisor = gcdAll(ratioNums.filter(n => n > 0));

    const ratioStr = `${ratioNums
      .map(n => (divisor > 0 ? n / divisor : n))
      .join(':')}`;

    return {
      newMemberCount,
      renewedMemberCount,
      expiredMemberCount,
      totalMemberCount,
      newMemberPercent: percent(newMemberCount, classifiedTotal),
      renewedMemberPercent: percent(renewedMemberCount, classifiedTotal),
      expiredMemberPercent: percent(expiredMemberCount, classifiedTotal),
      memberRatio: ratioStr, // ✅ no unclassified here
    };
  }

  @authenticate({
    strategy: 'jwt',
  })
  @get('/client-stats', {
    responses: {
      '200': {
        description:
          'PT and Membership client counts with gender breakdown (unique by email)',
        content: {'application/json': {schema: {type: 'object'}}},
      },
    },
  })
  async getClientStats(
    @param.query.string('startDate') startDate?: string,
    @param.query.string('endDate') endDate?: string,
    @param.query.string('departmentId') departmentId?: string,
    @param.query.string('branchId') branchId?: string,
    @param.query.string('country') country?: string,
  ): Promise<object> {
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        between: [new Date(startDate), new Date(endDate)],
      };
    }

    if (departmentId) where.departmentId = departmentId;
    if (branchId) where.branchId = branchId;
    if (country) where.country = country;

    // Get only relevant KPI IDs (16 for PT, 20/21 for Membership)
    where.kpiId = {inq: [16, 20, 21]};

    const sales = await this.salesRepository.find({
      where,
      fields: {email: true, gender: true, kpiId: true},
    });

    // Ensure uniqueness by email
    const uniqueClients = new Map<string, {gender: string; kpiId: number}>();

    for (const sale of sales) {
      const email = sale.email?.toLowerCase();
      const gender = sale.gender?.toLowerCase();
      const kpiId = sale.kpiId;

      if (email && gender && !uniqueClients.has(email)) {
        uniqueClients.set(email, {gender, kpiId});
      }
    }

    // Counters
    let ptTotal = 0,
      ptMale = 0,
      ptFemale = 0,
      membershipTotal = 0,
      membershipMale = 0,
      membershipFemale = 0;

    for (const {gender, kpiId} of uniqueClients.values()) {
      if (kpiId === 16) {
        ptTotal++;
        if (gender === 'male') ptMale++;
        else if (gender === 'female') ptFemale++;
      } else if ([20, 21].includes(kpiId)) {
        membershipTotal++;
        if (gender === 'male') membershipMale++;
        else if (gender === 'female') membershipFemale++;
      }
    }

    // ✅ Ratio calculation helper
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const simplifyRatio = (a: number, b: number): string => {
      if (a === 0 && b === 0) return '0:0';
      if (a === 0) return `0:1`;
      if (b === 0) return `1:0`;
      const divisor = gcd(a, b);
      return `${a / divisor}:${b / divisor}`;
    };

    // ✅ PT : Membership ratio
    const ptMembershipRatio = simplifyRatio(ptTotal, membershipTotal);

    return {
      pt: {
        total: ptTotal,
        male: ptMale,
        female: ptFemale,
      },
      membership: {
        total: membershipTotal,
        male: membershipMale,
        female: membershipFemale,
      },
      ratio: ptMembershipRatio,
    };
  }

  formatDate = (date: Date) =>
    date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  @authenticate({
    strategy: 'jwt',
  })
  @get('/member-conduction-stats')
  @response(200, {
    description: 'Overall conduction stats with filters',
  })
  async getStats(
    @param.query.string('startDate') startDateStr: string,
    @param.query.string('endDate') endDateStr: string,
    @param.query.string('branchId') branchId?: string,
    @param.query.string('departmentId') departmentId?: string,
  ): Promise<any> {
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);
    // 1. Build conduction filter
    const conductionFilter: any = {
      where: {
        conductionDate: {between: [startDate, endDate]},
        isDeleted: false,
      },
    };
    if (branchId) conductionFilter.where.branchId = branchId;
    if (departmentId) conductionFilter.where.departmentId = departmentId;

    // 2. Fetch conductions
    const conductions = await this.conductionRepository.find(conductionFilter);
    // return conductions;

    // 3. Total conductions = sum of conductions column
    const totalConductions = conductions.reduce(
      (sum, c) => sum + Number(c.conductions ?? 0),
      0,
    );

    // 4. Avg conduction per day
    const daysDiff =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const avgConductionsPerDay = daysDiff > 0 ? totalConductions / daysDiff : 0;

    // 5. Avg conduction per trainer
    const uniqueTrainerIds = [
      ...new Set(conductions.map(c => c.trainerId).filter(Boolean)),
    ];
    const totalTrainers = uniqueTrainerIds.length;
    const avgConductionsPerTrainer =
      totalTrainers > 0 ? totalConductions / totalTrainers : 0;

    return {
      totalConductions,
      avgConductionsPerDay,
      avgConductionsPerTrainer,
    };
  }

  @authenticate({
    strategy: 'jwt',
  })
  @get('/sales-by-country')
  async getSalesByCountry(
    @param.query.string('kpiIds') kpiIdsStr?: string,
    @param.query.string('startDate') startDateStr?: string,
    @param.query.string('endDate') endDateStr?: string,
  ): Promise<any> {
    // Parse KPI IDs
    const kpiIds = kpiIdsStr
      ? kpiIdsStr
          .split(',')
          .map(id => parseInt(id.trim(), 10))
          .filter(Boolean)
      : [];

    // Step 1: Filter MembershipDetails by purchaseDate if dates are provided
    let membershipIds: number[] = [];
    if (startDateStr && endDateStr) {
      const purchaseStartDate = new Date(startDateStr + 'T00:00:00Z');
      const purchaseEndDate = new Date(endDateStr + 'T23:59:59Z');

      const memberships = await this.salesRepository.dataSource.execute(
        `SELECT id FROM MembershipDetails WHERE purchaseDate BETWEEN ? AND ?`,
        [purchaseStartDate, purchaseEndDate],
      );

      membershipIds = memberships.map((m: any) => m.id);
    }

    // Step 2: Build Sales filter dynamically
    const whereClauses: string[] = ['s.isDeleted = false'];
    const params: any[] = [];

    if (kpiIds.length > 0) {
      whereClauses.push(`s.kpiId IN (${kpiIds.map(() => '?').join(',')})`);
      params.push(...kpiIds);
    }
    if (membershipIds.length > 0) {
      whereClauses.push(
        `s.id IN (SELECT salesId FROM MembershipDetails WHERE id IN (${membershipIds.map(() => '?').join(',')}))`,
      );
      params.push(...membershipIds);
    }

    const whereSQL = whereClauses.join(' AND ');

    // Step 3: Aggregate total sales per country
    const sql = `
      SELECT 
        s.country,
        SUM(m.discountedPrice) as totalSales
      FROM Sales s
      JOIN MembershipDetails m ON s.id = m.salesId
      WHERE ${whereSQL}
      GROUP BY s.country
      ORDER BY totalSales DESC
    `;

    const result = await this.salesRepository.dataSource.execute(sql, params);

    // Step 4: Add ranking
    let rank = 1;
    const rankedResult = result.map((row: any) => ({
      country: row.country,
      totalSales: parseFloat(row.totalSales),
      rank: rank++,
    }));

    return rankedResult;
  }

  @authenticate({
    strategy: 'jwt',
  })
  @get('/dashboard/forecast/monthly-series')
  async monthlyForecastSeries(): Promise<any> {
    const today = new Date(new Date().toDateString());

    const result: {
      labels: string[];
      targetSeries: number[];
      actualSeries: number[];
      deficitPercentSeries: number[];
    } = {
      labels: [],
      targetSeries: [],
      actualSeries: [],
      deficitPercentSeries: [],
    };

    for (let i = 11; i >= 0; i--) {
      const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const endDate = new Date(
        today.getFullYear(),
        today.getMonth() - i + 1,
        0,
      );
      endDate.setHours(23, 59, 59, 999);

      const label = startDate.toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      // Step 1: Sum all branch targets for this month
      const targetsForMonth = await this.targetRepository.find({
        where: {
          and: [
            {startDate: {lte: endDate.toISOString()}},
            {endDate: {gte: startDate.toISOString()}},
          ],
          isDeleted: false,
        },
      });

      const targetTotal = targetsForMonth.reduce(
        (sum, t) => sum + (t.targetValue || 0),
        0,
      );

      // Step 2: Memberships purchased in this month
      const memberships = await this.membershipDetailsRepository.find({
        where: {
          purchaseDate: {between: [startDate, endDate]},
        },
      });

      const saleIds = memberships
        .map(m => m.salesId)
        .filter(Boolean) as number[];

      let actualTotal = 0;
      if (saleIds.length > 0) {
        const sales = await this.salesRepository.find({
          where: {
            isDeleted: false,
            id: {inq: saleIds},
          },
          include: ['membershipDetails'],
        });

        actualTotal = sales.reduce(
          (sum, s) => sum + (s.membershipDetails?.discountedPrice || 0),
          0,
        );
      }

      const deficitPercent = targetTotal
        ? parseFloat(
            (((actualTotal - targetTotal) / targetTotal) * 100).toFixed(1),
          )
        : 0;

      result.labels.push(label);
      result.targetSeries.push(targetTotal);
      result.actualSeries.push(actualTotal);
      result.deficitPercentSeries.push(deficitPercent);
    }

    return result;
  }

  @authenticate({ strategy: 'jwt' })
  @get('/dashboard/monthly-revenue')
  async getMonthlyRevenue(
    @param.query.string('kpiIds') kpiIdsStr?: string,
    @param.query.number('branchId') branchId?: number,
    @param.query.number('departmentId') departmentId?: number,
    @param.query.string('country') country?: string,
    @param.query.string('startDate') startDateStr?: string,
    @param.query.string('endDate') endDateStr?: string,
    @param.query.number('day') day?: number,
  ): Promise<any> {
    // parse kpi ids
    const kpiIds = kpiIdsStr
      ? kpiIdsStr.split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean)
      : [];

    const labels: string[] = [];
    const revenueSeries: number[] = [];

    for (let i = 12; i >= 0; i--) {
      // Base month from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const start = new Date(today);
      start.setMonth(start.getMonth() - i);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      const lastDayOfMonth = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0
      ).getDate();
      const safeDay = Math.min(day || lastDayOfMonth, lastDayOfMonth);
      end.setDate(safeDay);
      end.setHours(23, 59, 59, 999);

      // ✅ Log to confirm IST handling
      console.log('IST Start:', start.toString());
      console.log('IST End  :', end.toString());

      // Step 1: Get membershipDetails in this window
      const memberships = await this.membershipDetailsRepository.find({
        where: { purchaseDate: { between: [start, end] } },
      });

      const saleIds = memberships.map(m => m.salesId).filter(Boolean) as number[];

      if (saleIds.length === 0) {
        labels.push(
          `${start.toLocaleString('default', { month: 'short' })} ${start.getFullYear()}`
        );
        revenueSeries.push(0);
        continue;
      }

      // Step 2: Get sales
      const sales = await this.salesRepository.find({
        where: {
          isDeleted: false,
          ...(kpiIds.length > 0 && { kpiId: { inq: kpiIds } }),
          ...(branchId && { branchId }),
          ...(departmentId && { departmentId }),
          ...(country && { country }),
          id: { inq: saleIds },
        },
        include: ['membershipDetails'],
      });

      // Step 3: Revenue calculation
      const totalRevenue = sales.reduce(
        (sum, s) => sum + (s.membershipDetails?.discountedPrice || 0),
        0
      );

      labels.push(
        `${start.toLocaleString('default', { month: 'short' })} ${start.getFullYear()}`
      );
      revenueSeries.push(totalRevenue);
    }

    return { labels, series: [{ name: 'revenue', data: revenueSeries }] };
  }


  @get('/leaderboard/trainer-performance/kpi')
  async getTrainerLeaderboardByKpi(
    @param.query.string('startDate') startDateStr: string,
    @param.query.string('endDate') endDateStr: string,
    @param.query.number('kpiId') kpiId: number,
    @param.query.number('branchId') branchId?: number,
    @param.query.number('departmentId') departmentId?: number,
  ): Promise<any[]> {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Last period calculation
    const daysDiff =
      (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    const lastStart = new Date(startDate);
    lastStart.setDate(lastStart.getDate() - daysDiff);
    const lastEnd = new Date(startDate);
    lastEnd.setDate(lastEnd.getDate() - 1);

    // Fetch targets including trainerTargets
    const targets = await this.targetRepository.find({
      where: {
        branchId,
        startDate: {lte: endDate.toISOString().split('T')[0]},
        endDate: {gte: startDate.toISOString().split('T')[0]},
        isDeleted: false,
      },
      include: [
        {relation: 'branch'},
        {
          relation: 'departmentTargets',
          scope: {
            where: {
              ...(departmentId ? {departmentId} : {}),
              isDeleted: false,
            },
            include: [
              {relation: 'department'},
              {
                relation: 'trainerTargets',
                scope: {
                  where: {isDeleted: false, ...(kpiId ? {kpiId} : {})},
                  include: ['trainer', 'kpi'],
                },
              },
            ],
          },
        },
      ],
    });

    // Flatten trainerTargets
    const trainerTargets = targets.flatMap((t: any) =>
      (t.departmentTargets ?? []).flatMap((dt: any) =>
        (dt.trainerTargets ?? []).map((tt: any) => ({
          trainerId: tt.trainerId,
          trainer: tt.trainer,
          kpiId: tt.kpiId,
          targetValue: tt.targetValue,
          departmentId: dt.departmentId,
          department: dt.department,
          branchId: t.branchId,
          branch: t.branch,
        })),
      ),
    );

    const result: any[] = [];

    for (const tt of trainerTargets) {
      // Current period sales filtered by KPI
      const sales = await this.salesRepository.find({
        where: {
          trainerId: tt.trainerId,
          kpiId, // filter by KPI
          createdAt: {between: [startDate, endDate]},
        },
        include: ['membershipDetails'],
      });

      const actual = sales.reduce(
        (sum, sale) => sum + (sale.membershipDetails?.discountedPrice || 0),
        0,
      );

      // Last period sales filtered by KPI
      const lastSales = await this.salesRepository.find({
        where: {
          trainerId: tt.trainerId,
          kpiId, // filter by KPI
          createdAt: {between: [lastStart, lastEnd]},
        },
        include: ['membershipDetails'],
      });

      const previousActual = lastSales.reduce(
        (sum, sale) => sum + (sale.membershipDetails?.discountedPrice || 0),
        0,
      );

      // Achievement % and delta
      const achieved = tt.targetValue ? (actual / tt.targetValue) * 100 : 0;
      let delta = 0;
      if (previousActual === 0 && actual > 0) delta = 100;
      else if (previousActual !== 0)
        delta = ((actual - previousActual) / previousActual) * 100;

      // Performance Status
      let status = 'Under Performer';
      if (achieved >= 100 && achieved < 110) status = 'Achiever';
      else if (achieved >= 110) status = 'Over Achiever';

      result.push({
        trainerId: tt.trainerId,
        name: tt.trainer?.firstName || 'Unknown',
        departmentId: tt.departmentId,
        department: tt.department ?? null,
        branchId: tt.branchId,
        branch: tt.branch ?? null,
        role: tt.trainer?.role,
        target: tt.targetValue,
        actual: Math.round(actual),
        achieved: +achieved.toFixed(1),
        status,
        kpiId: tt.kpiId,
        kpi: tt.kpi ?? null,
        changeFromLastPeriod: {
          percent: +delta.toFixed(1),
          previousActual: Math.round(previousActual),
        },
      });
    }

    // Sort by achieved %
    result.sort((a, b) => b.achieved - a.achieved);
    result.forEach((item, index) => (item.rank = index + 1));

    return result;
  }

  // @get('/leaderboard/top-sales')
  // async getTopSalesLeaderboard(
  //   @param.query.string('startDate') startDateStr: string,
  //   @param.query.string('endDate') endDateStr: string,
  //   @param.query.number('branchId') branchId?: number,
  //   @param.query.number('departmentId') departmentId?: number,
  // ): Promise<any[]> {
  //   const startDate = new Date(startDateStr);
  //   const endDate = new Date(endDateStr);

  //   // Fetch targets
  //   const targets = await this.targetRepository.find({
  //     where: {
  //       branchId,
  //       startDate: {lte: endDate.toISOString().split('T')[0]},
  //       endDate: {gte: startDate.toISOString().split('T')[0]},
  //       isDeleted: false,
  //     },
  //     include: [
  //       {
  //         relation: 'departmentTargets',
  //         scope: {
  //           where: {
  //             ...(departmentId ? {departmentId} : {}),
  //             isDeleted: false,
  //           },
  //           include: [
  //             {
  //               relation: 'trainerTargets',
  //               scope: {
  //                 where: {isDeleted: false},
  //                 include: ['trainer', 'kpi'],
  //               },
  //             },
  //           ],
  //         },
  //       },
  //     ],
  //   });

  //   // Flatten TrainerTargets
  //   const trainerTargets = targets.flatMap((t: any) =>
  //     (t.departmentTargets ?? []).flatMap((dt: any) =>
  //       (dt.trainerTargets ?? []).map((tt: any) => ({
  //         trainerId: tt.trainerId,
  //         trainer: tt.trainer,
  //         kpiId: tt.kpiId,
  //         targetValue: tt.targetValue,
  //         departmentId: dt.departmentId,
  //         branchId: t.branchId,
  //       })),
  //     ),
  //   );

  //   const result: any[] = [];

  //   for (const tt of trainerTargets) {
  //     console.log('trainerTargets', trainerTargets);
  //     // Actual sales for current period
  //     const sales = await this.salesRepository.find({
  //       where: {
  //         trainerId: tt.trainerId,
  //         createdAt: {between: [startDate, endDate]},
  //       },
  //       include: ['membershipDetails'],
  //     });
  //     console.log('sales', sales);

  //     const actual = sales.reduce(
  //       (sum, sale) => sum + (sale.membershipDetails?.discountedPrice || 0),
  //       0,
  //     );
  //     console.log('actual', actual);

  //     const achieved = tt.targetValue ? (actual / tt.targetValue) * 100 : 0;

  //     // Only push those who are near target (>= 0%) or have crossed it
  //     if (achieved >= 0) {
  //       result.push({
  //         trainerId: tt.trainerId,
  //         name: `${tt.trainer?.firstName} ${tt.trainer?.lastName}` || 'Unknown',
  //         target: tt.targetValue,
  //         actual: Math.round(actual),
  //         achieved: +achieved.toFixed(1),
  //       });
  //     }
  //   }

  //   // Sort by achieved % in desc order and take top 10
  //   result.sort((a, b) => b.achieved - a.achieved);
  //   const top10 = result.slice(0, 10);

  //   // Add ranks
  //   top10.forEach((item, index) => {
  //     item.rank = index + 1;
  //   });

  //   return top10;
  // }
  @get('/leaderboard/top-sales')
  async getTopSalesLeaderboard(
    @param.query.string('startDate') startDateStr: string,
    @param.query.string('endDate') endDateStr: string,
    @param.query.number('branchId') branchId?: number,
    @param.query.number('departmentId') departmentId?: number,
  ): Promise<any[]> {
    if (!startDateStr || !endDateStr) {
      throw new HttpErrors.BadRequest('startDate and endDate are required.');
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new HttpErrors.BadRequest('Invalid date format.');
    }

    // Fetch targets filtered by KPI
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
                  where: {isDeleted: false, kpiId: 16},
                  include: ['trainer', 'kpi'],
                },
              },
            ],
          },
        },
      ],
    });

    // Flatten TrainerTargets for selected KPI(s)
    const trainerTargets = targets.flatMap((t: any) =>
      (t.departmentTargets ?? []).flatMap((dt: any) =>
        (dt.trainerTargets ?? []).map((tt: any) => ({
          trainerId: tt.trainerId,
          trainer: tt.trainer,
          kpiId: tt.kpiId,
          targetValue: tt.targetValue,
          departmentId: dt.departmentId,
          branchId: t.branchId,
        })),
      ),
    );

    // Group by trainerId -> sum target values
    const trainerMap = new Map<number, any>();

    for (const tt of trainerTargets) {
      if (!trainerMap.has(tt.trainerId)) {
        trainerMap.set(tt.trainerId, {
          trainerId: tt.trainerId,
          name:
            `${tt.trainer?.firstName ?? ''} ${tt.trainer?.lastName ?? ''}`.trim() ||
            'Unknown',
          totalTarget: 0,
        });
      }

      const trainerData = trainerMap.get(tt.trainerId);
      trainerData.totalTarget += tt.targetValue || 0;
    }

    // Prepare results
    const result: any[] = [];

    for (const [trainerId, trainerData] of trainerMap) {
      // Fetch actual sales for this trainer in the period filtered by KPI
      const sales = await this.salesRepository.find({
        where: {
          trainerId,
          createdAt: {between: [startDate, endDate]},
          kpiId: 16,
          ...(branchId && {branchId}),
          ...(departmentId && {departmentId}),
        },
        include: ['membershipDetails'],
      });

      const actual = sales.reduce(
        (sum, sale) => sum + (sale.membershipDetails?.discountedPrice || 0),
        0,
      );

      const achieved = trainerData.totalTarget
        ? (actual / trainerData.totalTarget) * 100
        : 0;

      result.push({
        trainerId,
        name: trainerData.name,
        target: trainerData.totalTarget,
        actual: Math.round(actual),
        achieved: +achieved.toFixed(1),
      });
    }

    // Sort by actual sales (or achievement %) and take top 10
    result.sort((a, b) => b.actual - a.actual); // <-- Top sellers
    const top10 = result.slice(0, 10);

    // Add ranks
    top10.forEach((item, index) => {
      item.rank = index + 1;
    });

    return top10;
  }

  @get('/leaderboard/top-conductions')
  async getTopConductionsLeaderboard(
    @param.query.string('startDate') startDateStr: string,
    @param.query.string('endDate') endDateStr: string,
    @param.query.number('branchId') branchId?: number,
    @param.query.number('departmentId') departmentId?: number,
  ): Promise<any[]> {
    if (!startDateStr || !endDateStr) {
      throw new HttpErrors.BadRequest('startDate and endDate are required.');
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new HttpErrors.BadRequest('Invalid date format.');
    }

    // Fetch targets filtered by KPI
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
                  where: {isDeleted: false, kpiId: 17},
                  include: ['trainer', 'kpi'],
                },
              },
            ],
          },
        },
      ],
    });

    // Flatten TrainerTargets for selected KPI(s)
    const trainerTargets = targets.flatMap((t: any) =>
      (t.departmentTargets ?? []).flatMap((dt: any) =>
        (dt.trainerTargets ?? []).map((tt: any) => ({
          trainerId: tt.trainerId,
          trainer: tt.trainer,
          kpiId: tt.kpiId,
          targetValue: tt.targetValue,
          departmentId: dt.departmentId,
          branchId: t.branchId,
        })),
      ),
    );

    // Group by trainerId -> sum target values
    const trainerMap = new Map<number, any>();

    for (const tt of trainerTargets) {
      if (!trainerMap.has(tt.trainerId)) {
        trainerMap.set(tt.trainerId, {
          trainerId: tt.trainerId,
          name:
            `${tt.trainer?.firstName ?? ''} ${tt.trainer?.lastName ?? ''}`.trim() ||
            'Unknown',
          totalTarget: 0,
        });
      }

      const trainerData = trainerMap.get(tt.trainerId);
      trainerData.totalTarget += tt.targetValue || 0;
    }

    // Prepare results
    const result: any[] = [];

    for (const [trainerId, trainerData] of trainerMap) {
      // Fetch actual sales for this trainer in the period filtered by KPI
      const conductions = await this.conductionRepository.find({
        where: {
          trainerId,
          createdAt: {between: [startDate, endDate]},
          kpiId: 17,
          ...(branchId && {branchId}),
          ...(departmentId && {departmentId}),
        },
        // include: ['membershipDetails'],
      });

      const actual = conductions.reduce(
        (sum, conductions) => sum + (conductions.conductions || 0),
        0,
      );

      const achieved = trainerData.totalTarget
        ? (actual / trainerData.totalTarget) * 100
        : 0;

      result.push({
        trainerId,
        name: trainerData.name,
        target: trainerData.totalTarget,
        actual: Math.round(actual),
        achieved: +achieved.toFixed(1),
      });
    }

    // Sort by actual sales (or achievement %) and take top 10
    result.sort((a, b) => b.actual - a.actual); // <-- Top sellers
    const top10 = result.slice(0, 10);

    // Add ranks
    top10.forEach((item, index) => {
      item.rank = index + 1;
    });

    return top10;
  }

  @get('/leaderboard/top-ranks')
  async getTopRanksLeaderboard(
    @param.query.string('startDate') startDateStr: string,
    @param.query.string('endDate') endDateStr: string,
    @param.query.number('branchId') branchId?: number,
    @param.query.number('departmentId') departmentId?: number,
  ): Promise<any[]> {
    if (!startDateStr || !endDateStr) {
      throw new HttpErrors.BadRequest('startDate and endDate are required.');
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new HttpErrors.BadRequest('Invalid date format.');
    }

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
                  include: [
                    {
                      relation: 'trainer',
                      scope: {
                        include: [
                          {relation: 'branch'}, // keep only existing relations
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });

    const trainerTargets = targets.flatMap((t: any) =>
      (t.departmentTargets ?? []).flatMap((dt: any) =>
        (dt.trainerTargets ?? []).map((tt: any) => ({
          trainerId: tt.trainerId,
          trainer: tt.trainer,
          targetValue: tt.targetValue,
          departmentId: dt.departmentId,
          branchId: t.branchId,
        })),
      ),
    );

    const trainerMap = new Map<number, any>();

    for (const tt of trainerTargets) {
      if (!trainerMap.has(tt.trainerId)) {
        trainerMap.set(tt.trainerId, {
          trainerId: tt.trainerId,
          trainer: tt.trainer,
          totalTarget: 0,
        });
      }

      const trainerData = trainerMap.get(tt.trainerId);
      trainerData.totalTarget += tt.targetValue || 0;
    }

    const result: any[] = [];

    for (const [trainerId, trainerData] of trainerMap) {
      const sales = await this.salesRepository.find({
        where: {
          trainerId,
          createdAt: {between: [startDate, endDate]},
          ...(branchId && {branchId}),
          ...(departmentId && {departmentId}),
        },
        include: ['membershipDetails'],
      });

      const actual = sales.reduce(
        (sum, sale) => sum + (sale.membershipDetails?.discountedPrice || 0),
        0,
      );

      const achieved = trainerData.totalTarget
        ? (actual / trainerData.totalTarget) * 100
        : 0;

      result.push({
        trainerId,
        trainer: trainerData.trainer, // full trainer info (with branch)
        totalTarget: trainerData.totalTarget,
        actual,
        achieved: +achieved.toFixed(1),
      });
    }
    result.sort((a, b) => b.achieved - a.achieved);
    return result.slice(0, 10);
  }
}
