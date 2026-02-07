import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Coffee, ShoppingCart, Twitter, Linkedin, Github, Instagram } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Universal POS
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
                Home
              </Link>
              <Link href="/features" className="text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
                Features
              </Link>
              <Link href="/pricing" className="text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
                Pricing
              </Link>
              <Link href="/contact" className="text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
                Contact
              </Link>
              <Button asChild className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                <Link href="/auth/register">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center max-w-lg">
            <div className="mb-8">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 w-32 h-32 rounded-2xl mx-auto flex items-center justify-center mb-6">
                <Coffee className="h-16 w-16 text-blue-500" />
              </div>
            </div>
            <h1 className="text-7xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent mb-4">
              404
            </h1>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg px-8 py-6">
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-1.5 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white">Universal POS</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                India's most trusted POS solution for businesses of all sizes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="/features" className="hover:text-blue-600">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-600">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-blue-600">Demo</Link></li>
                <li><Link href="/integrations" className="hover:text-blue-600">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="/about" className="hover:text-blue-600">About</Link></li>
                <li><Link href="/blog" className="hover:text-blue-600">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-blue-600">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="/help" className="hover:text-blue-600">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-blue-600">Documentation</Link></li>
                <li><Link href="/status" className="hover:text-blue-600">Status</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-600">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              © 2024 Universal POS. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
