# Project Constellation Setup Guide

## Supabase Configuration

### 1. Create Environment Variables

Create a `.env.local` file in the `rboeapp` directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. Disable Email Confirmation

To fix the "Email not confirmed" error:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth**, disable **"Enable email confirmations"**
4. Save the changes

### 3. Set Up Database Schema

Run the SQL schema in your Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `sql/schema.sql`
3. Execute the script

### 4. Configure Row Level Security (RLS)

The schema includes RLS policies. Make sure they're enabled:

1. Go to **Authentication** → **Policies**
2. Verify that RLS is enabled on all tables
3. The policies should be automatically created by the schema

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Troubleshooting

### Registration Issues

If you're still getting errors:

1. **Check Supabase Logs**: Go to **Logs** in your Supabase dashboard to see detailed error messages
2. **Verify Database Schema**: Ensure the `profiles` table exists and has the correct structure
3. **Check RLS Policies**: Make sure the policies allow profile creation for new users

### Common Errors

- **"Email not confirmed"**: Disable email confirmation in Supabase settings
- **"Error creating user profile"**: Check if the database trigger is working properly
- **"Permission denied"**: Verify RLS policies are correctly configured

## Database Schema Notes

The application uses a trigger (`handle_new_user`) that automatically creates a profile when a user signs up. This should work automatically once the schema is properly set up.

If the trigger isn't working, you can manually create profiles or check the Supabase logs for trigger execution errors. 