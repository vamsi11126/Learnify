# Learnify Phase 1 Setup Instructions

## 🎉 Phase 1 Core MVP is Ready!

Your Learnify application is now running with the following features:
- ✅ Beautiful Linear-inspired dark UI with neon accents
- ✅ Supabase authentication (Google & GitHub OAuth)
- ✅ Subject management (Create, View, Delete)
- ✅ Topic management (Create, View, Delete)
- ✅ Interactive Knowledge Graph Visualizer with React Flow
- ✅ Realtime updates for topics and dependencies
- ✅ Responsive layout with collapsible sidebar

## 🔧 Critical Setup Step: Configure Supabase Database

**You MUST run the SQL schema in your Supabase project before using the app!**

### Steps:

1. **Go to your Supabase Dashboard**
   - Visit: https://bljhrkulhkokfdpwwvlc.supabase.co

2. **Open the SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New Query"

3. **Copy and paste the SQL from `/app/supabase-schema.sql`**
   - The file contains all necessary tables, indexes, RLS policies, and triggers
   - This will create:
     - `profiles` table (user profiles)
     - `subjects` table (learning subjects)
     - `topics` table (learning topics with SM-2 fields)
     - `topic_dependencies` table (DAG edges)
     - `study_logs` table (learning sessions)
     - `saved_graph_layouts` table (graph positions)
     - `shared_subject_clones` table (community feature)
     - All RLS policies for security
     - Automatic profile creation on signup

4. **Run the SQL**
   - Click "Run" button
   - Wait for success confirmation

5. **Configure OAuth Providers**
   - Go to Authentication → Providers in Supabase dashboard
   - Enable Google OAuth:
     - Add your Google OAuth credentials
     - Set redirect URL: `https://studymind-flow.preview.emergentagent.com/auth/callback`
   - Enable GitHub OAuth:
     - Add your GitHub OAuth credentials
     - Set redirect URL: `https://studymind-flow.preview.emergentagent.com/auth/callback`

## 🚀 Accessing Your Application

Once the database is set up and OAuth is configured:

1. **Visit your app**: https://studymind-flow.preview.emergentagent.com
2. **Sign in** with Google or GitHub
3. **Create your first subject**
4. **Add topics** to your subject
5. **View the Knowledge Graph** to visualize your learning path

## 📋 What's Included in Phase 1

### ✅ Completed Features:

1. **Landing Page**
   - Dark Linear-inspired theme with neon accents
   - Hero section with CTA buttons
   - Features showcase
   - How it works section
   - OAuth sign-in buttons

2. **Authentication**
   - Supabase OAuth (Google & GitHub)
   - Automatic profile creation
   - Protected routes
   - Session management

3. **Dashboard**
   - List all user subjects
   - Create new subjects
   - View subject cards with topic counts
   - Collapsible sidebar navigation
   - Sign out functionality

4. **Subject Detail Page**
   - Tabbed interface (Overview, Graph, Topics)
   - Create and delete topics
   - View topic statistics
   - Status badges (locked, available, learning, reviewing, mastered)
   - Estimated time and difficulty ratings

5. **Knowledge Graph Visualizer**
   - Interactive React Flow graph
   - Color-coded nodes by status:
     - Gray: locked
     - Blue: available
     - Yellow: learning
     - Green: reviewing
     - Purple: mastered
   - Animated edges showing dependencies
   - Zoom, pan, and minimap controls
   - Neon glow effects on active nodes
   - Realtime updates via Supabase subscriptions

6. **Design System**
   - Montserrat font for headings (bold, geometric)
   - Karla font for body text (legible)
   - Color palette: #FFFFFF, #D4D4D4, #B3B3B3, #2B2B2B
   - Neon accents (purple/magenta and blue)
   - Card-based components with hover effects
   - Consistent spacing and typography

## 🔮 What's Next: Phase 2 & Beyond

Phase 2 will include:
- AI Graph Generation (OpenRouter integration)
- SM-2 Spaced Repetition algorithm
- Learning and Review flows
- Study sessions with flashcards
- Quality ratings and scheduling

Phase 3 will include:
- Analytics dashboard
- Recommendations engine
- Weekly/daily statistics
- Performance charts

Phase 4 will include:
- Community sharing features
- Public subject browsing
- Subject cloning
- Landing page animations

## 🎨 Design Notes

- The app uses a dark theme by default (Linear.app inspired)
- Neon glow effects are used strategically for CTAs and focused elements
- Motion is minimal in the app (heavy animations reserved for landing page in Phase 4)
- All colors use CSS custom properties for consistency
- Responsive design with mobile-friendly layouts

## 🐛 Troubleshooting

### If sign-in doesn't work:
1. Make sure you ran the SQL schema in Supabase
2. Check that OAuth providers are configured in Supabase
3. Verify redirect URLs match your domain
4. Check browser console for errors

### If graphs don't appear:
1. Make sure you have topics in your subject
2. Check that realtime is enabled in Supabase
3. Try refreshing the page

### If topics aren't saving:
1. Verify the SQL schema was run successfully
2. Check RLS policies are enabled
3. Make sure you're authenticated

## 📦 Environment Variables

Already configured in `/app/.env`:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `OPENROUTER_API_KEY` - For AI graph generation (Phase 2)

## 🎯 Key Files

- `/app/app/page.js` - Landing page
- `/app/app/dashboard/page.js` - Main dashboard
- `/app/app/subjects/[id]/page.js` - Subject detail page
- `/app/components/GraphVisualizer.js` - Knowledge graph component
- `/app/lib/supabase/client.js` - Supabase browser client
- `/app/lib/supabase/server.js` - Supabase server client
- `/app/supabase-schema.sql` - Database schema (RUN THIS!)

## 🎓 Ready to Learn!

Once you complete the Supabase setup, your Phase 1 MVP is fully functional and ready to use! 🚀
