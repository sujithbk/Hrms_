const prisma = require("../config/prisma"); 

//  Utility: Get start & end of a day
function getDayBounds(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

//  Utility: Get current session start (last check-in without checkout)
async function getCurrentSessionStart(userId) {
  const { startOfDay, endOfDay } = getDayBounds();

  const todayRecords = await prisma.checkInOut.findMany({
    where: {
      userId: userId,
      timestamp: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  if (todayRecords.length === 0) {
    return null; // no checkins today
  }

  const lastRecord = todayRecords[0];
  if (lastRecord.checkType === 1) {
    return lastRecord.timestamp; // currently checked in
  }

  return null; // last action was checkout
}

//  Utility: Calculate total runtime for today
async function calculateTodayRuntime(userId) {
  const { startOfDay, endOfDay } = getDayBounds();

  const checkoutRecords = await prisma.checkInOut.findMany({
    where: {
      userId: userId,
      checkType: 2, // checkout records
      timestamp: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const totalMinutes = checkoutRecords.reduce(
    (total, record) => total + (record.difference || 0),
    0
  );

  return totalMinutes;
}

// ✅ Export all utils
module.exports = {
  getDayBounds,
  getCurrentSessionStart,
  calculateTodayRuntime,
};
