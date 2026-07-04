"use client"

import { Suspense } from "react"
import Link from "next/link"
import { Plus, Server, Monitor, Target, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ServicesTable } from "@/components/services/services-table"
import TemplatePage from "@/components/template/page"
import { NetworkService } from "@/lib/types"

export default function ServicesPage() {
  // Handle service actions
  const handleServiceSelect = (service: NetworkService) => {
    // This will be handled by the Link in the table
    console.log('Service selected:', service.name)
  }

  const handleServiceEdit = (service: NetworkService) => {
    // Navigate to edit page
    window.location.href = `/services/${service.id}/edit`
  }

  const handleServiceDelete = (service: NetworkService) => {
    // This will be handled by the ServicesTable component
    console.log('Delete service:', service.name)
  }

  const handleBulkDelete = (serviceIds: string[]) => {
    // TODO: Show confirmation dialog and delete multiple services
    console.log('Bulk delete services:', serviceIds)
  }

  const handleBulkGroupChange = (serviceIds: string[], groupId: string) => {
    // TODO: Update group for multiple services
    console.log('Bulk group change:', serviceIds, 'to group:', groupId)
  }

  return (
    <TemplatePage
      currentSection="services"
    >
      {/* Services Page Content */}
      <div className="p-6">
        {/* Page Header */}
        <div className="border-b border-neutral-700 bg-neutral-800/50 backdrop-blur-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    Network Services
                  </h1>
                  <p className="text-sm text-neutral-400">Infrastructure service inventory and management</p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="bg-neutral-900/50 border-orange-500/50 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/70 hover:text-orange-300 transition-all duration-200 shadow-lg backdrop-blur-sm"
              >
                <Link href="/services/new">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add Service</span>
                  <span className="sm:hidden">Service</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="flex flex-1 flex-col gap-4">
          {/* ServicesTable reads the URL via useSearchParams, which requires a
              Suspense boundary to prerender without a CSR bailout (Next 16). */}
          <Suspense fallback={<div className="text-sm text-neutral-400">Loading services…</div>}>
            <ServicesTable
              onServiceSelect={handleServiceSelect}
              onServiceEdit={handleServiceEdit}
              onServiceDelete={handleServiceDelete}
              onBulkDelete={handleBulkDelete}
              onBulkGroupChange={handleBulkGroupChange}
            />
          </Suspense>
        </div>
      </div>
    </TemplatePage>
  )
}