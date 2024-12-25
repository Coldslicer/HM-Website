import React from 'react'
import { Link } from 'react-router-dom'
import { Flame, TrendingUp, Users, Zap } from 'lucide-react'

export function Hero() {
  return (
    <div className="relative bg-black text-white">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-900 to-black opacity-90" />
      </div>
      
      <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Connect with Top Gaming Influencers
        </h1>
        <p className="mt-6 text-xl max-w-3xl">
          Hotslicer Media connects brands with authentic gaming influencers 
          to create impactful sponsorship campaigns that resonate with your target audience.
        </p>
        <div className="mt-10">
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-orange-500 hover:bg-orange-600"
          >
            Start Your Campaign
          </Link>
        </div>
        
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<Users className="h-6 w-6" />}
            title="Curated Creator Network"
            description="Access our network of pre-vetted gaming influencers with engaged audiences."
          />
          <Feature
            icon={<TrendingUp className="h-6 w-6" />}
            title="Campaign Analytics"
            description="Track your campaign performance with detailed analytics and insights."
          />
          <Feature
            icon={<Zap className="h-6 w-6" />}
            title="Streamlined Process"
            description="From brief to execution, manage your entire campaign in one place."
          />
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
          {icon}
        </div>
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="mt-2 text-base text-gray-300">{description}</p>
      </div>
    </div>
  )
}