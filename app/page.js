'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Brain, Sparkles, Network, TrendingUp, Github, Chrome } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      if (user) {
        router.push('/dashboard')
      }
    }
    checkUser()
  }, [])

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) console.error('Error signing in:', error.message)
  }

  const handleGithubSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) console.error('Error signing in:', error.message)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-xl text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Montserrat' }}>Learnify</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <Button variant="outline" onClick={handleGoogleSignIn}>Sign In</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <div className="inline-block">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                AI-Powered Learning Platform
              </div>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-foreground leading-tight" style={{ fontFamily: 'Montserrat' }}>
              Master Anything with
              <br />
              <span className="neon-text text-primary">AI & Spaced Repetition</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Build personalized knowledge graphs, let AI generate your curriculum, and master topics faster with scientifically-proven spaced repetition.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" onClick={handleGoogleSignIn} className="neon-glow text-lg px-8 h-14">
                <Chrome className="mr-2 h-5 w-5" />
                Get Started with Google
              </Button>
              <Button size="lg" variant="outline" onClick={handleGithubSignIn} className="text-lg px-8 h-14">
                <Github className="mr-2 h-5 w-5" />
                Sign in with GitHub
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ fontFamily: 'Montserrat' }}>Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="h-10 w-10 text-primary" />}
              title="AI Curriculum Generation"
              description="Generate complete learning paths instantly. AI analyzes your subject and creates a structured dependency graph."
            />
            <FeatureCard
              icon={<Network className="h-10 w-10 text-accent" />}
              title="Interactive Knowledge Graphs"
              description="Visualize your learning journey with beautiful, interactive graphs that show topic relationships and progress."
            />
            <FeatureCard
              icon={<TrendingUp className="h-10 w-10 text-chart-3" />}
              title="Spaced Repetition (SM-2)"
              description="Master topics efficiently using scientifically-proven spaced repetition algorithm that adapts to your performance."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-card/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ fontFamily: 'Montserrat' }}>How It Works</h2>
          <div className="space-y-12">
            <StepCard number="1" title="Create Your Subject" description="Start by defining what you want to learn - programming, languages, science, or any topic." />
            <StepCard number="2" title="Generate AI Learning Path" description="Let AI build a complete curriculum with topics and dependencies, or create topics manually." />
            <StepCard number="3" title="Learn & Review" description="Follow your personalized learning path, complete topics, and review them using spaced repetition." />
            <StepCard number="4" title="Track Progress" description="Watch your knowledge graph fill with color as you master topics and unlock new ones." />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Montserrat' }}>Ready to Start Learning?</h2>
          <p className="text-xl text-muted-foreground mb-8">Join thousands of learners mastering new skills with AI-powered spaced repetition.</p>
          <Button size="lg" onClick={handleGoogleSignIn} className="neon-glow text-lg px-12 h-14">
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Learnify. Built with AI, designed for learners.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all hover:neon-glow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Montserrat' }}>{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-bold text-xl" style={{ fontFamily: 'Montserrat' }}>
        {number}
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Montserrat' }}>{title}</h3>
        <p className="text-muted-foreground text-lg">{description}</p>
      </div>
    </div>
  )
}
