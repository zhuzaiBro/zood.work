import Faucet from '@/components/Faucet'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function FaucetPage() {
  return (
    <div className="min-h-screen flex flex-col mt-[-5rem] bg-gray-50 pt-40 pb-12 bg-gradient-to-b from-blue-50 to-gray-50 transition-colors duration-300">
      <Header />
      
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Web3 工具箱
            </h1>
            <p className="text-gray-600">
              开发者测试工具集合
            </p>
          </div>
          
          <Faucet />
        </div>
      </main>

    </div>
  )
}

