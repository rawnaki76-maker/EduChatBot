const db = require('../src/config/db');

async function seedRealisticSlots() {
  console.log('Seeding realistic daytime advising slots for all 3 GSTU CSE teachers...');

  try {
    // Delete existing unbooked slots
    await db.query('DELETE FROM advisor_slots WHERE is_booked = 0');

    // Create daytime slots based on tomorrow and day after tomorrow
    // Current date in Asia/Dhaka
    const now = new Date();
    
    // Tomorrow at 10:00 AM
    const tomorrow10AM = new Date(now);
    tomorrow10AM.setDate(now.getDate() + 1);
    tomorrow10AM.setHours(10, 0, 0, 0);

    // Tomorrow at 11:30 AM
    const tomorrow1130AM = new Date(now);
    tomorrow1130AM.setDate(now.getDate() + 1);
    tomorrow1130AM.setHours(11, 30, 0, 0);

    // Day after tomorrow at 2:00 PM
    const dayAfter2PM = new Date(now);
    dayAfter2PM.setDate(now.getDate() + 2);
    dayAfter2PM.setHours(14, 0, 0, 0);

    // Day after tomorrow at 11:00 AM (Dept Head Dr. Mahbubul Alam)
    const dayAfter11AM = new Date(now);
    dayAfter11AM.setDate(now.getDate() + 2);
    dayAfter11AM.setHours(11, 0, 0, 0);

    // Day after tomorrow at 3:30 PM
    const dayAfter330PM = new Date(now);
    dayAfter330PM.setDate(now.getDate() + 2);
    dayAfter330PM.setHours(15, 30, 0, 0);

    const helperAddMins = (date, mins) => new Date(date.getTime() + mins * 60000);

    const slotsData = [
      // 1. Dr. Anisur Rahman (user_id: 2)
      [2, tomorrow10AM, helperAddMins(tomorrow10AM, 45), 0],
      [2, dayAfter2PM, helperAddMins(dayAfter2PM, 45), 0],

      // 2. Prof. Fatima Tuz Zohra (user_id: 3)
      [3, tomorrow1130AM, helperAddMins(tomorrow1130AM, 45), 0],
      [3, dayAfter330PM, helperAddMins(dayAfter330PM, 45), 0],

      // 3. Dr. Mahbubul Alam - Dept Head (user_id: 1)
      [1, dayAfter11AM, helperAddMins(dayAfter11AM, 45), 0]
    ];

    for (const [advisorId, start, end, isBooked] of slotsData) {
      await db.query(
        'INSERT INTO advisor_slots (advisor_id, start_time, end_time, is_booked) VALUES (?, ?, ?, ?)',
        [advisorId, start, end, isBooked]
      );
    }

    const [allSlots] = await db.query(
      `SELECT s.slot_id, u.name AS advisor_name, s.start_time, s.end_time, s.is_booked
       FROM advisor_slots s
       JOIN users u ON s.advisor_id = u.user_id
       WHERE s.is_booked = 0
       ORDER BY s.start_time ASC`
    );

    console.log(`Successfully created ${allSlots.length} daytime advising slots:`);
    allSlots.forEach(s => {
      console.log(`- Slot #${s.slot_id}: ${s.advisor_name} | ${new Date(s.start_time).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error seeding slots:', err);
    process.exit(1);
  }
}

seedRealisticSlots();
