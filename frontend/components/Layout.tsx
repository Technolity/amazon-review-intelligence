'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import SidebarFilters from './SidebarFilters'
import InsightsPane from './InsightsPanel'
import GraphArea from './GraphArea'
import InsightsPanel from './InsightsPanel'
import { Sidebar } from './ui/sidebar'

interface LayoutProps {
  children: ReactNode
  showFooter?: boolean
}

export default function Layout({ children, showFooter = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />
      
      {/* Main Content - 3 Column Layout */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar Filters - 20% */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white">
          <SidebarFilters onAnalyze={function (asin: string): void {
            throw new Error('Function not implemented.')
          } } onReset={function (): void {
            throw new Error('Function not implemented.')
          } } />
        </div>
        
        {/* Graph/Chart Area - 60% */}
        <motion.main 
          className="flex-1 bg-gray-50 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GraphArea analysis={null} />
        </motion.main>
        
        {/* Insights Pane - 20% */}
        <div className="w-96 flex-shrink-0 border-l border-gray-200 bg-white">
          <InsightsPanel analysis={null} />
        </div>
      </div>
    </div>
  )
}