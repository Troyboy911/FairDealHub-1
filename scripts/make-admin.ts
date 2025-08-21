
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function makeUserAdmin(userId: string) {
  try {
    const result = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, userId))
      .returning();

    if (result.length > 0) {
      console.log(`✅ Successfully made user ${userId} an admin:`, result[0]);
    } else {
      console.log(`❌ User ${userId} not found`);
    }
  } catch (error) {
    console.error('Error making user admin:', error);
  } finally {
    process.exit(0);
  }
}

// Your user ID from the logs
const USER_ID = "46692008";
makeUserAdmin(USER_ID);
