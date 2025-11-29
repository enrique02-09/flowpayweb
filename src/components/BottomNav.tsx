import Icon from './Icons'

export default function BottomNav() {
  return (
    <nav className="bottom-nav md:hidden fixed left-0 right-0 bottom-4 z-50 flex items-center justify-center">
      <div className="w-[92%] bg-white rounded-3xl shadow-lg flex items-center justify-between px-6 py-3">
        <button className="flex flex-col items-center text-sm text-gray-600">
          <Icon name="home" className="w-6 h-6 text-current mb-1" />
          <span>Home</span>
        </button>
        <button className="flex flex-col items-center text-sm text-gray-600">
          <Icon name="bell" className="w-6 h-6 text-current mb-1" />
          <span>Notifications</span>
        </button>

        <div className="-mt-8">
          <button className="fab bg-emerald-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl">
            <Icon name="grid" className="w-6 h-6" />
          </button>
        </div>

        <button className="flex flex-col items-center text-sm text-gray-600">
          <Icon name="swap" className="w-6 h-6 text-current mb-1" />
          <span>Transactions</span>
        </button>
        <button className="flex flex-col items-center text-sm text-gray-600">
          <Icon name="user" className="w-6 h-6 text-current mb-1" />
          <span>Profile</span>
        </button>
      </div>
    </nav>
  )
}

