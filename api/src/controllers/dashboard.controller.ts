// Uncomment these imports to begin using these cool features!

import {repository} from '@loopback/repository';
import {
  ConductionRepository,
  MembershipDetailsRepository,
  SalesRepository,
  TargetRepository,
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
        isDeleted: false,
      },
    };

    if (kpiIds.length > 0) filter.where.kpiId = {inq: kpiIds};
    if (branchId) filter.where.branchId = branchId;
    if (departmentId) filter.where.departmentId = departmentId;
    if (startDateStr && endDateStr) {
      filter.where.createdAt = {
        gte: new Date(new Date(startDateStr).setHours(0, 0, 0, 0)),
        lte: new Date(new Date(endDateStr).setHours(23, 59, 59, 999)),
      };
    }

    const allSales = await this.salesRepository.find({
      ...filter,
      include: ['membershipDetails'],
    });
    // Calculate total revenue from all sales
    const totalRevenue = allSales.reduce(
      (sum, s) => sum + (s.membershipDetails?.discountedPrice || 0),
      0,
    );
    const totalTickets = allSales.length;
    const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;

    // Get 7-day series for revenue
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

    // Get 7-day series for tickets count
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
        createdAt: {
          gte: new Date(startDate.setHours(0, 0, 0, 0)),
          lte: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
      include: ['membershipDetails'],
    });

    const lastWeekSales = await this.salesRepository.find({
      where: {
        ...filter.where,
        createdAt: {
          gte: new Date(lastWeekStart.setHours(0, 0, 0, 0)),
          lte: new Date(lastWeekEnd.setHours(23, 59, 59, 999)),
        },
      },
      include: ['membershipDetails'],
    });

    // Revenue for this week and last week
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

    // Calculate percent change
    const percentChange = (current: number, prev: number): number => {
      if (prev === 0 && current === 0) return 0;
      if (prev === 0) return 100;
      return ((current - prev) / prev) * 100;
    };

    // Calculate lifetime revenue and tickets
    // const lifetimeRevenue = totalRevenue;
    // const lifetimeTickets = totalTickets;

    // // Calculate lifetime average ticket price
    // const lifetimeAvgTicket =
    //   lifetimeTickets > 0 ? lifetimeRevenue / lifetimeTickets : 0;

    return {
      revenue: {
        value: Math.round(totalRevenue),
        percent: parseFloat(
          percentChange(thisWeekRevenue, lastWeekRevenue).toFixed(1),
        ),
        series: get7DaySeries(thisWeekSales, startDate),
      },
      tickets: {
        value: totalTickets, // Change to lifetime tickets
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
        month: 'long',
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
          gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
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

    for (
      let d = new Date(start.getTime());
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      categories.push(dateStr);
      dateMap[dateStr] = {};
    }

    for (const c of conductions) {
      const dateStr = c.createdAt
        ? new Date(c.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : null;
      const kpiName = c.kpi?.name || 'Unknown KPI';
      if (!dateStr || !dateMap[dateStr]) continue;

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
    @param.query.string('kpiId') kpiId?: string,
    @param.query.string('branchId') branchId?: string,
  ): Promise<object> {
    const where: any = {};

    // Apply date filter if both dates are provided
    if (startDate && endDate) {
      where.createdAt = {
        between: [new Date(startDate), new Date(endDate)],
      };
    }

    // Apply additional filters if provided
    if (departmentId) where.departmentId = departmentId;
    if (kpiId) where.kpiId = kpiId;
    if (branchId) where.branchId = branchId;

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

    return {
      maleCount,
      femaleCount,
      maleRatio: Number(maleRatio),
      femaleRatio: Number(femaleRatio),
      totalUniqueClients: total,
    };
  }

  @get('/member-statistics')
  async getMemberStats(
    @param.query.string('startDate') startDateStr: string,
    @param.query.string('endDate') endDateStr: string,
    @param.query.string('branchId') branchId?: string,
    @param.query.string('departmentId') departmentId?: string,
    @param.query.string('kpiId') kpiId?: string,
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
    if (kpiId) where.and.push({kpiId: parseInt(kpiId)});

    const sales = await this.salesRepository.find({
      where,
      include: [{relation: 'membershipDetails'}], // Include expiryDate
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
    let unclassifiedMemberCount = 0;

    for (const email in memberMap) {
      const records = memberMap[email];
      const hasRenewal = records.some(
        r => r.memberType?.toLowerCase() === 'rnl',
      );
      const hasNew = records.some(r => r.memberType?.toLowerCase() === 'new');
      let classified = false;

      if (hasRenewal) {
        renewedMemberCount++;
        classified = true;
      } else if (records.length === 1 && hasNew) {
        newMemberCount++;
        classified = true;
      } else if (records.length === 1) {
        const record = records[0];
        const expiryDate = record.membershipDetails?.expiryDate
          ? new Date(record.membershipDetails.expiryDate)
          : null;
        if (expiryDate && expiryDate < new Date() && !hasRenewal) {
          expiredMemberCount++;
          classified = true;
        }
      }

      if (!classified) {
        unclassifiedMemberCount++;
      }
    }

    const totalMemberCount = Object.keys(memberMap).length;
    const classifiedTotal =
      newMemberCount + renewedMemberCount + expiredMemberCount;

    const percent = (count: number, base: number) =>
      base > 0 ? parseFloat(((count / base) * 100).toFixed(2)) : 0;

    return {
      newMemberCount,
      renewedMemberCount,
      expiredMemberCount,
      unclassifiedMemberCount,
      totalMemberCount,
      newMemberPercent: percent(newMemberCount, classifiedTotal),
      renewedMemberPercent: percent(renewedMemberCount, classifiedTotal),
      expiredMemberPercent: percent(expiredMemberCount, classifiedTotal),
      unclassifiedPercent: percent(unclassifiedMemberCount, totalMemberCount),
    };
  }

  formatDate = (date: Date) =>
    date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
}
