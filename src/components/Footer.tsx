import { Link } from 'react-router-dom'

export default function Footer() {
  const categories = [
    { slug: 'politics', name: 'Politics' },
    { slug: 'technology', name: 'Technology' },
    { slug: 'business', name: 'Business' },
    { slug: 'sports', name: 'Sports' },
    { slug: 'entertainment', name: 'Entertainment' },
    { slug: 'health', name: 'Health' },
    { slug: 'science', name: 'Science' },
    { slug: 'world', name: 'World' },
  ]

  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <h2 className="text-xl font-bold text-white">The <span className="text-primary-400">Daily</span> Herald</h2>
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed">Your trusted source for breaking news, in-depth analysis, and comprehensive coverage of the stories that matter.</p>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.slice(0, 4).map((cat) => (
                <li key={cat.slug}><Link to={`/category/${cat.slug}`} className="text-sm text-neutral-400 hover:text-white transition-colors">{cat.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">More</h3>
            <ul className="space-y-2">
              {categories.slice(4).map((cat) => (
                <li key={cat.slug}><Link to={`/category/${cat.slug}`} className="text-sm text-neutral-400 hover:text-white transition-colors">{cat.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-neutral-400">About Us</span></li>
              <li><span className="text-sm text-neutral-400">Contact</span></li>
              <li><span className="text-sm text-neutral-400">Careers</span></li>
              <li><Link to="/privacy-policy" className="text-sm text-neutral-400 hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-800 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">&copy; {new Date().getFullYear()} The Daily Herald. All rights reserved.</p>
          <p className="text-xs text-neutral-500">Delivering truth, inspiring change.</p>
        </div>
      </div>
    </footer>
  )
}
