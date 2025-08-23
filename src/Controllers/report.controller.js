import Project from "../Models/Project.model.js";
import Timesheet from "../Models/Timesheet.model.js";

export const reportByEmployees = async (req, res) => {
  try {
    const idsParam = (req.query.employeeIds || "").trim();
    if (!idsParam) {
      return res.status(400).json({
        success: false,
        message: "employeeIds query is required (comma separated)",
      });
    }
    const employeeIds = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const pipeline = [
      {
        $unwind: {
          path: "$assignedEmployeeIds",
          preserveNullAndEmptyArrays: false,
        },
      },
      { $match: { "assignedEmployeeIds.employeeId": { $in: employeeIds } } },

      // 🔧 Collect both employeeId + employeeName per project
      {
        $group: {
          _id: "$projectId",
          projectId: { $first: "$projectId" },
          job_name: { $first: "$job_name" },
          status: { $first: "$status" },
          employees: {
            $addToSet: {
              employeeId: "$assignedEmployeeIds.employeeId",
              employeeName: "$assignedEmployeeIds.employeeName",
            },
          },
        },
      },

      {
        $facet: {
          // 🔎 project list with employees (id + name)
          projects: [
            {
              $project: {
                _id: 0,
                projectId: 1,
                job_name: 1,
                status: 1,
                employees: 1,
              },
            },
            { $sort: { job_name: 1 } },
          ],

          // 📊 totals
          totals: [{ $count: "totalProjectsWorked" }],

          // 📈 status wise count
          statusCounts: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { _id: 0, status: "$_id", count: 1 } },
            { $sort: { status: 1 } },
          ],

          // 👥 unique employees involved (by id)
          totalEmployeesInvolvedCalc: [
            { $unwind: "$employees" },
            {
              $group: {
                _id: null,
                set: { $addToSet: "$employees.employeeId" },
              },
            },
            { $project: { _id: 0, totalEmployeesInvolved: { $size: "$set" } } },
          ],

          // 🧑‍💼 per-employee projects count + name
          perEmployeeCalc: [
            { $unwind: "$employees" },
            {
              $group: {
                _id: "$employees.employeeId",
                employeeName: { $first: "$employees.employeeName" },
                projectsCount: { $sum: 1 }, // 1 per project after previous $group
              },
            },
            {
              $project: {
                _id: 0,
                employeeId: "$_id",
                employeeName: 1,
                projectsCount: 1,
              },
            },
            { $sort: { employeeName: 1 } },
          ],
        },
      },
    ];

    const [result] = await Project.aggregate(pipeline);

    const projects = result?.projects ?? [];
    const totalProjectsWorked = result?.totals?.[0]?.totalProjectsWorked || 0;
    const countByStatus = result?.statusCounts ?? [];
    const totalEmployeesInvolved =
      result?.totalEmployeesInvolvedCalc?.[0]?.totalEmployeesInvolved || 0;
    const perEmployee = result?.perEmployeeCalc ?? [];

    return res.json({
      success: true,
      filters: { employeeIds },
      totalProjectsWorked,
      countByStatus,
      totalEmployeesInvolved,
      perEmployee,
      // 🆕 Each project now has employees [{ employeeId, employeeName }]
      projects,
    });
  } catch (err) {
    console.error("reportByEmployees error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const reportByProjects = async (req, res) => {
  try {
    const idsParam = (req.query.projectIds || "").trim();
    const projectIds = idsParam
      ? idsParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

    const matchStage = projectIds?.length
      ? { $match: { projectId: { $in: projectIds } } }
      : null;

    const pipeline = [
      ...(matchStage ? [matchStage] : []),
      {
        $addFields: {
          employeesAssigned: {
            $size: { $ifNull: ["$assignedEmployeeIds", []] },
          },
          // derivedCost = use totalCost if > 0, otherwise sum of assignedEmployeeIds.empAmount
          derivedCost: {
            $cond: [
              { $gt: ["$totalCost", 0] },
              "$totalCost",
              {
                $reduce: {
                  input: { $ifNull: ["$assignedEmployeeIds", []] },
                  initialValue: 0,
                  in: {
                    $add: ["$$value", { $ifNull: ["$$this.empAmount", 0] }],
                  },
                },
              },
            ],
          },
        },
      },
      {
        $facet: {
          projects: [
            {
              $project: {
                _id: 0,
                projectId: 1,
                job_name: 1,
                status: 1,
                employeesAssigned: 1,
                projectCost: "$derivedCost",
              },
            },
            { $sort: { job_name: 1 } },
          ],
          summary: [
            {
              $group: {
                _id: null,
                projectCount: { $sum: 1 },
                totalCost: { $sum: "$derivedCost" },
              },
            },
            { $project: { _id: 0, projectCount: 1, totalCost: 1 } },
          ],
        },
      },
    ];

    const [result] = await Project.aggregate(pipeline);
    const projects = result?.projects ?? [];
    const projectCount = result?.summary?.[0]?.projectCount || 0;
    const totalCost = result?.summary?.[0]?.totalCost || 0;

    return res.json({
      success: true,
      filters: { projectIds: projectIds ?? "ALL" },
      projectCount,
      totalCost,
      projects,
    });
  } catch (err) {
    console.error("reportByProjects error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const parseCSV = (val) =>
  (val || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const ciRegexArray = (arr) =>
  (arr || []).map((s) => new RegExp(`^${escapeRegex(s)}$`, "i"));

function escapeRegex(str) {
  // escape regex special chars
  return (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const buildDateRangeMatch = ({ month, from, to }) => {
  if (month) {
    // month = 'YYYY-MM'
    const [yStr, mStr] = month.split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    // Compute first & last day as strings (YYYY-MM-DD)
    const start = `${String(y).padStart(4, "0")}-${String(m).padStart(
      2,
      "0"
    )}-01`;
    const lastDay = new Date(y, m, 0).getDate(); // JS Date: month is 1-based here since we pass m
    const end = `${String(y).padStart(4, "0")}-${String(m).padStart(
      2,
      "0"
    )}-${String(lastDay).padStart(2, "0")}`;
    // Timesheet.date is string YYYY-MM-DD → lexicographic range works
    return { date: { $gte: start, $lte: end } };
  }
  if (from && to) return { date: { $gte: from, $lte: to } };
  if (from) return { date: { $gte: from } };
  if (to) return { date: { $lte: to } };
  return {};
};

const buildTimesheetMatch = ({
  month,
  from,
  to,
  employeeIds,
  projectIds,
  timesheetStatus,
}) => {
  const match = { ...buildDateRangeMatch({ month, from, to }) };
  if (employeeIds?.length) match.employeeId = { $in: employeeIds };
  if (projectIds?.length) match.projectId = { $in: projectIds };
  // status is string enum in your schema → allow case-insensitive filter
  if (timesheetStatus?.length)
    match.status = { $in: ciRegexArray(timesheetStatus) };
  return match;
};

const buildTimesheetPipeline = ({
  month,
  from,
  to,
  employeeIds,
  projectIds,
  timesheetStatus, // Timesheet.status
  projectStatus, // Project.status
}) => {
  const matchTS = buildTimesheetMatch({
    month,
    from,
    to,
    employeeIds,
    projectIds,
    timesheetStatus,
  });

  const pipeline = [
    { $match: matchTS },

    // Join to Project by projectId
    {
      $lookup: {
        from: "projects",
        localField: "projectId",
        foreignField: "projectId",
        as: "projectDoc",
      },
    },
    { $unwind: { path: "$projectDoc", preserveNullAndEmptyArrays: true } },

    // Optional filter by Project.status (case-insensitive)
    ...(projectStatus?.length
      ? [
          {
            $match: {
              "projectDoc.status": { $in: ciRegexArray(projectStatus) },
            },
          },
        ]
      : []),

    // Find the assignment for this employee in the project to get perHour
    {
      $addFields: {
        assignment: {
          $first: {
            $filter: {
              input: { $ifNull: ["$projectDoc.assignedEmployeeIds", []] },
              as: "a",
              cond: { $eq: ["$$a.employeeId", "$employeeId"] },
            },
          },
        },
      },
    },

    // Compute cost = hours * perHour (fallback 0 if missing)
    {
      $addFields: {
        perHour: { $ifNull: ["$assignment.perHour", 0] },
        lineCost: {
          $multiply: [
            { $ifNull: ["$hours", 0] },
            { $ifNull: ["$assignment.perHour", 0] },
          ],
        },
        projectStatus: "$projectDoc.status",
        projectName: {
          $ifNull: ["$Project_name", "$projectDoc.job_name"],
        },
      },
    },

    // Build all result buckets
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalHours: { $sum: { $ifNull: ["$hours", 0] } },
              totalTimesheets: { $sum: 1 },
              totalCost: { $sum: { $ifNull: ["$lineCost", 0] } },
              uniqueEmployeesSet: { $addToSet: "$employeeId" },
              uniqueProjectsSet: { $addToSet: "$projectId" },
            },
          },
          {
            $project: {
              _id: 0,
              totalHours: 1,
              totalTimesheets: 1,
              totalCost: 1,
              uniqueEmployees: { $size: "$uniqueEmployeesSet" },
              uniqueProjects: { $size: "$uniqueProjectsSet" },
            },
          },
        ],
        byEmployee: [
          {
            $group: {
              _id: "$employeeId",
              hours: { $sum: { $ifNull: ["$hours", 0] } },
              cost: { $sum: { $ifNull: ["$lineCost", 0] } },
              projects: { $addToSet: "$projectId" },
            },
          },
          {
            $project: {
              _id: 0,
              employeeId: "$_id",
              hours: 1,
              cost: 1,
              projectsCount: { $size: "$projects" },
            },
          },
          { $sort: { hours: -1 } },
        ],
        byProject: [
          {
            $group: {
              _id: "$projectId",
              projectName: { $first: "$projectName" },
              projectStatus: { $first: "$projectStatus" },
              hours: { $sum: { $ifNull: ["$hours", 0] } },
              cost: { $sum: { $ifNull: ["$lineCost", 0] } },
              employees: { $addToSet: "$employeeId" },
            },
          },
          {
            $project: {
              _id: 0,
              projectId: "$_id",
              projectName: 1,
              projectStatus: 1,
              hours: 1,
              cost: 1,
              employeesAssigned: { $size: "$employees" },
            },
          },
          { $sort: { hours: -1 } },
        ],
        perDay: [
          {
            $group: {
              _id: "$date",
              hours: { $sum: { $ifNull: ["$hours", 0] } },
              cost: { $sum: { $ifNull: ["$lineCost", 0] } },
            },
          },
          { $project: { _id: 0, date: "$_id", hours: 1, cost: 1 } },
          { $sort: { date: 1 } },
        ],
        timesheetStatusCounts: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $project: { _id: 0, status: "$_id", count: 1 } },
          { $sort: { status: 1 } },
        ],
        projectStatusCounts: [
          { $group: { _id: "$projectStatus", count: { $sum: 1 } } },
          { $project: { _id: 0, projectStatus: "$_id", count: 1 } },
          { $sort: { projectStatus: 1 } },
        ],
      },
    },
  ];

  return pipeline;
};

export const reportMonthly = async (req, res) => {
  try {
    const month = (req.query.month || "").trim();
    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Query param `month=YYYY-MM` is required",
      });
    }

    const employeeIds = parseCSV(req.query.employeeIds);
    const projectIds = parseCSV(req.query.projectIds);
    const timesheetStatus = parseCSV(req.query.timesheetStatus);
    const projectStatus = parseCSV(req.query.projectStatus);

    const pipeline = buildTimesheetPipeline({
      month,
      employeeIds,
      projectIds,
      timesheetStatus,
      projectStatus,
    });

    const [agg] = await Timesheet.aggregate(pipeline);
    const summary = agg?.summary?.[0] || {
      totalHours: 0,
      totalTimesheets: 0,
      totalCost: 0,
      uniqueEmployees: 0,
      uniqueProjects: 0,
    };

    return res.json({
      success: true,
      filters: {
        month,
        employeeIds,
        projectIds,
        timesheetStatus,
        projectStatus,
      },
      summary,
      byEmployee: agg?.byEmployee ?? [],
      byProject: agg?.byProject ?? [],
      perDay: agg?.perDay ?? [],
      timesheetStatusCounts: agg?.timesheetStatusCounts ?? [],
      projectStatusCounts: agg?.projectStatusCounts ?? [],
    });
  } catch (err) {
    console.error("reportMonthly error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const reportCustomRange = async (req, res) => {
  try {
    const from = (req.query.from || "").trim();
    const to = (req.query.to || "").trim();

    const employeeIds = parseCSV(req.query.employeeIds);
    const projectIds = parseCSV(req.query.projectIds);
    const timesheetStatus = parseCSV(req.query.timesheetStatus);
    const projectStatus = parseCSV(req.query.projectStatus);

    const pipeline = buildTimesheetPipeline({
      from,
      to,
      employeeIds,
      projectIds,
      timesheetStatus,
      projectStatus,
    });

    const [agg] = await Timesheet.aggregate(pipeline);
    const summary = agg?.summary?.[0] || {
      totalHours: 0,
      totalTimesheets: 0,
      totalCost: 0,
      uniqueEmployees: 0,
      uniqueProjects: 0,
    };

    return res.json({
      success: true,
      filters: {
        from,
        to,
        employeeIds,
        projectIds,
        timesheetStatus,
        projectStatus,
      },
      summary,
      byEmployee: agg?.byEmployee ?? [],
      byProject: agg?.byProject ?? [],
      perDay: agg?.perDay ?? [],
      timesheetStatusCounts: agg?.timesheetStatusCounts ?? [],
      projectStatusCounts: agg?.projectStatusCounts ?? [],
    });
  } catch (err) {
    console.error("reportCustomRange error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
