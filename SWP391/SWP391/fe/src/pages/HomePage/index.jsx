export default function HomePage() {
  



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">EV Dealer</h1>
          <nav className="space-x-6">
            <a href="#" className="text-gray-600 hover:text-blue-600">Home</a>
            <a href="#" className="text-gray-600 hover:text-blue-600">Cars</a>
            <a href="#" className="text-gray-600 hover:text-blue-600">About</a>
            <a href="#" className="text-gray-600 hover:text-blue-600">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero banner */}
      <section className="relative bg-gradient-to-r from-blue-500 to-green-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-bold mb-4">Drive the Future with Electric Cars</h2>
          <p className="mb-6">Sustainable. Affordable. Powerful.</p>
          <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow hover:bg-gray-100">
            Explore Models
          </button>
        </div>
      </section>

      {/* Featured cars */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-2xl font-bold mb-8">Our Best Sellers</h3>
          <div className="grid gap-8 md:grid-cols-3">
            {[1, 2, 3].map((id) => (
              <div key={id} className="bg-white shadow rounded-lg overflow-hidden">
                <img
                  src={`https://source.unsplash.com/600x400/?electric-car,${id}`}
                  alt="Electric Car"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h4 className="font-bold text-lg">EV Model {id}</h4>
                  <p className="text-gray-600">$35,000</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
