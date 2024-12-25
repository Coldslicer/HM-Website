import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from '../components/dashboard/Sidebar'
import { BriefForm } from './dashboard/BriefForm'
import { CreatorSelection } from './dashboard/CreatorSelection'
import { CampaignTimeline } from './dashboard/CampaignTimeline'
import { CompleteCampaign } from './dashboard/CompleteCampaign'
import { StepStatus } from '../components/dashboard/StepStatus'
import { CampaignSelector } from '../components/dashboard/CampaignSelector'

export function Dashboard() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <CampaignSelector />
        <Routes>
          <Route index element={<Navigate to="brief" replace />} />
          <Route path="brief" element={<BriefForm />} />
          <Route 
            path="creators" 
            element={
              <StepStatus requiredStatus="brief_submitted">
                <CreatorSelection />
              </StepStatus>
            } 
          />
          <Route 
            path="timeline" 
            element={
              <StepStatus requiredStatus="creators_selected">
                <CampaignTimeline />
              </StepStatus>
            } 
          />
          <Route 
            path="complete" 
            element={
              <StepStatus requiredStatus="contract_signed">
                <CompleteCampaign />
              </StepStatus>
            } 
          />
        </Routes>
      </div>
    </div>
  )
}