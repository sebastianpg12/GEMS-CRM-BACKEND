const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const FixedExpense = require('../models/FixedExpense');
const Client = require('../models/Client');
const Activity = require('../models/Activity');
const Case = require('../models/Case');
const Team = require('../models/Team');

// Dashboard general stats
router.get('/dashboard', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const firstDayOfYear = new Date(currentYear, 0, 1);

    // Stats básicas
    const totalClients = await Client.countDocuments();
    const totalActivities = await Activity.countDocuments();
    const totalCases = await Case.countDocuments();
    const totalTeamMembers = await Team.countDocuments();

    // Stats del mes actual
    const monthlyStats = {
      newClients: await Client.countDocuments({ createdAt: { $gte: firstDayOfMonth } }),
      completedActivities: await Activity.countDocuments({ 
        status: 'completed',
        updatedAt: { $gte: firstDayOfMonth }
      }),
      newCases: await Case.countDocuments({ fechaCreacion: { $gte: firstDayOfMonth } }),
      monthlyRevenue: 0,
      monthlyExpenses: 0
    };

    // Ingresos y gastos del mes
    const monthlyTransactions = await Transaction.find({
      fecha: { $gte: firstDayOfMonth }
    });

    monthlyStats.monthlyRevenue = monthlyTransactions
      .filter(t => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + t.monto, 0);

    monthlyStats.monthlyExpenses = monthlyTransactions
      .filter(t => t.tipo === 'egreso')
      .reduce((sum, t) => sum + t.monto, 0);

    res.json({
      success: true,
      data: {
        totals: {
          clients: totalClients,
          activities: totalActivities,
          cases: totalCases,
          teamMembers: totalTeamMembers
        },
        monthly: monthlyStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Estadísticas financieras por período
router.get('/financial/:period', async (req, res) => {
  try {
    const { period } = req.params; // 'month', 'quarter', 'year'
    const currentDate = new Date();
    
    let startDate, endDate, groupBy;
    
    switch (period) {
      case 'year':
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        endDate = new Date(currentDate.getFullYear() + 1, 0, 1);
        groupBy = { 
          year: { $year: "$fecha" }, 
          month: { $month: "$fecha" } 
        };
        break;
      case 'quarter':
        const quarter = Math.floor(currentDate.getMonth() / 3);
        startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
        endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 1);
        groupBy = { 
          year: { $year: "$fecha" }, 
          month: { $month: "$fecha" } 
        };
        break;
      default: // month
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        groupBy = { 
          year: { $year: "$fecha" }, 
          month: { $month: "$fecha" }, 
          day: { $dayOfMonth: "$fecha" } 
        };
    }

    const financialData = await Transaction.aggregate([
      {
        $match: {
          fecha: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: {
            ...groupBy,
            tipo: "$tipo"
          },
          total: { $sum: "$monto" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
      }
    ]);

    // Gastos fijos del período
    const fixedExpenses = await FixedExpense.find({ activo: true });
    const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + expense.monto, 0);

    res.json({
      success: true,
      data: {
        transactions: financialData,
        fixedExpenses: totalFixedExpenses,
        period: period,
        startDate,
        endDate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Estadísticas de actividades
router.get('/activities/stats', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const last3Months = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);

    // Estadísticas por estado
    const statusStats = await Activity.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Actividades completadas por mes (últimos 6 meses)
    const completedByMonth = await Activity.aggregate([
      {
        $match: {
          status: 'completed',
          updatedAt: { $gte: new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Productividad del equipo (actividades completadas por cliente)
    const productivityByClient = await Activity.aggregate([
      {
        $match: {
          status: 'completed',
          updatedAt: { $gte: last3Months }
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $unwind: { path: "$client", preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: "$client.name",
          completedActivities: { $sum: 1 }
        }
      },
      {
        $sort: { completedActivities: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Tiempo promedio de resolución (estimado basado en fecha de creación vs actualización)
    const resolutionTimeStats = await Activity.aggregate([
      {
        $match: {
          status: 'completed',
          updatedAt: { $gte: currentMonth }
        }
      },
      {
        $project: {
          resolutionDays: {
            $divide: [
              { $subtract: ["$updatedAt", "$createdAt"] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResolutionTime: { $avg: "$resolutionDays" },
          minResolutionTime: { $min: "$resolutionDays" },
          maxResolutionTime: { $max: "$resolutionDays" }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statusDistribution: statusStats,
        completedByMonth,
        productivityByClient,
        resolutionTime: resolutionTimeStats[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Estadísticas de clientes
router.get('/clients/stats', async (req, res) => {
  try {
    const currentDate = new Date();
    const last6Months = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);

    // Crecimiento de clientes por mes
    const clientGrowth = await Client.aggregate([
      {
        $match: {
          createdAt: { $gte: last6Months }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          newClients: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Clientes más activos (con más actividades)
    const topActiveClients = await Activity.aggregate([
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $unwind: { path: "$client", preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: "$client._id",
          clientName: { $first: "$client.name" },
          clientEmail: { $first: "$client.email" },
          totalActivities: { $sum: 1 },
          completedActivities: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $divide: ["$completedActivities", "$totalActivities"]
          }
        }
      },
      {
        $sort: { totalActivities: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Distribución geográfica (si hay campo de ubicación)
    const clientsByLocation = await Client.aggregate([
      {
        $group: {
          _id: "$ubicacion",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        growth: clientGrowth,
        topActive: topActiveClients,
        locationDistribution: clientsByLocation
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Estadísticas del equipo
router.get('/team/performance', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Actividades por miembro del equipo
    const teamPerformance = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: "$assignedTo", // Asumiendo que existe este campo
          totalActivities: { $sum: 1 },
          completedActivities: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          pendingActivities: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: '_id',
          foreignField: '_id',
          as: 'teamMember'
        }
      },
      {
        $unwind: { path: "$teamMember", preserveNullAndEmptyArrays: true }
      },
      {
        $addFields: {
          completionRate: {
            $divide: ["$completedActivities", "$totalActivities"]
          }
        }
      },
      {
        $sort: { completionRate: -1 }
      }
    ]);

    // Carga de trabajo actual
    const workload = await Activity.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'in_progress'] }
        }
      },
      {
        $group: {
          _id: "$assignedTo",
          activeWorkload: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: '_id',
          foreignField: '_id',
          as: 'teamMember'
        }
      },
      {
        $unwind: { path: "$teamMember", preserveNullAndEmptyArrays: true }
      },
      {
        $sort: { activeWorkload: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        performance: teamPerformance,
        currentWorkload: workload
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Resumen ejecutivo
router.get('/executive-summary', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const currentYear = new Date(currentDate.getFullYear(), 0, 1);

    // KPIs principales
    const kpis = {
      // Clientes
      totalClients: await Client.countDocuments(),
      newClientsThisMonth: await Client.countDocuments({ 
        createdAt: { $gte: currentMonth } 
      }),
      newClientsLastMonth: await Client.countDocuments({ 
        createdAt: { $gte: lastMonth, $lt: currentMonth } 
      }),

      // Actividades
      totalActivities: await Activity.countDocuments(),
      completedThisMonth: await Activity.countDocuments({
        status: 'completed',
        updatedAt: { $gte: currentMonth }
      }),
      completedLastMonth: await Activity.countDocuments({
        status: 'completed',
        updatedAt: { $gte: lastMonth, $lt: currentMonth }
      }),

      // Financiero
      revenueThisYear: 0,
      revenueThisMonth: 0,
      revenueLastMonth: 0,
      expensesThisMonth: 0
    };

    // Cálculos financieros
    const yearlyRevenue = await Transaction.find({
      tipo: 'ingreso',
      fecha: { $gte: currentYear }
    });
    kpis.revenueThisYear = yearlyRevenue.reduce((sum, t) => sum + t.monto, 0);

    const monthlyRevenue = await Transaction.find({
      tipo: 'ingreso',
      fecha: { $gte: currentMonth }
    });
    kpis.revenueThisMonth = monthlyRevenue.reduce((sum, t) => sum + t.monto, 0);

    const lastMonthRevenue = await Transaction.find({
      tipo: 'ingreso',
      fecha: { $gte: lastMonth, $lt: currentMonth }
    });
    kpis.revenueLastMonth = lastMonthRevenue.reduce((sum, t) => sum + t.monto, 0);

    const monthlyExpenses = await Transaction.find({
      tipo: 'egreso',
      fecha: { $gte: currentMonth }
    });
    kpis.expensesThisMonth = monthlyExpenses.reduce((sum, t) => sum + t.monto, 0);

    // Calcular porcentajes de crecimiento
    const growth = {
      clients: kpis.newClientsLastMonth > 0 ? 
        ((kpis.newClientsThisMonth - kpis.newClientsLastMonth) / kpis.newClientsLastMonth * 100) : 0,
      activities: kpis.completedLastMonth > 0 ? 
        ((kpis.completedThisMonth - kpis.completedLastMonth) / kpis.completedLastMonth * 100) : 0,
      revenue: kpis.revenueLastMonth > 0 ? 
        ((kpis.revenueThisMonth - kpis.revenueLastMonth) / kpis.revenueLastMonth * 100) : 0
    };

    res.json({
      success: true,
      data: {
        kpis,
        growth,
        period: {
          current: currentMonth,
          previous: lastMonth
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
