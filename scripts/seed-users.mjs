import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function seedUsers() {
  console.log('Starting user creation...');

  const users = [
    { email: 'admin1@example.com', name: 'Alpha Admin', role: 'admin' },
    { email: 'admin2@example.com', name: 'Beta Admin', role: 'admin' },
    { email: 'player1@example.com', name: 'Golf Pro One', role: 'subscriber' },
    { email: 'player2@example.com', name: 'Golf Pro Two', role: 'subscriber' },
    { email: 'player3@example.com', name: 'Golf Pro Three', role: 'subscriber' }
  ];

  for (const u of users) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: u.name }
    });

    if (authError) {
      console.log(`Failed to create ${u.email}:`, authError.message);
      continue;
    }

    const userId = authData.user.id;
    console.log(`Successfully created Auth account for ${u.email}. Wait roughly 1 sec for our trigger to build the Profile...`);
    
    // Give time for handle_new_user trigger to create the profile row
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update their profile name explicitly in public table
    await supabaseAdmin.from('profiles').update({ full_name: u.name }).eq('id', userId);

    // Insert their role
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert([
      { user_id: userId, role: u.role }
    ]);

    if (roleError) console.log(`Failed to assign role to ${u.email}:`, roleError.message);
    else console.log(`Assigned role [${u.role}] to ${u.email}`);
  }

  console.log('\n--- ALL DONE ---');
  console.log('You can now log in with any of these emails and the password: password123');
}

seedUsers();
