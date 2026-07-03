"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Search,
  X,
  Filter,
  Download
} from "lucide-react"

import { TacticalTable, TacticalTableColumn } from "@/components/tactical/tactical-table"
import { TacticalButton } from "@/components/tactical/tactical-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Group } from "@/lib/types"
import { ConfirmationDialog } from "@/components/common/confirmation-dialog"
import { useServices } from "@/lib/hooks/use-services"

interface GroupsTableProps {
  groups: Group[]
  loading?: boolean
  onDelete?: (group: Group) => void
}

export function GroupsTable({ groups, loading = false, onDelete }: GroupsTableProps) {
  const [filters, setFilters] = useState({
    search: '',
  })
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null)
  const [servicesCount, setServicesCount] = useState<Record<string, number>>({})
  
  // Fetch all services to calculate count per group
  const { data: allServices } = useServices()

  // Calculate services count for each group
  useEffect(() => {
    if (allServices && groups) {
      const countMap: Record<string, number> = {}
      
      // Initialize all groups with 0 count
      groups.forEach(group => {
        countMap[group.id] = 0
      })
      
      // Count services per group
      allServices.forEach(service => {
        if (countMap.hasOwnProperty(service.groupId)) {
          countMap[service.groupId]++
        }
      })
      
      setServicesCount(countMap)
    }
  }, [allServices, groups])

  // Filter groups based on search term
  const filteredGroups = useMemo(() => {
    if (!filters.search) return groups

    const term = filters.search.toLowerCase()
    return groups.filter(group => 
      group.name.toLowerCase().includes(term) ||
      (group.description && group.description.toLowerCase().includes(term))
    )
  }, [groups, filters.search])

  const handleDeleteClick = (group: Group) => {
    setDeleteGroup(group)
  }

  const handleDeleteConfirm = () => {
    if (deleteGroup && onDelete) {
      onDelete(deleteGroup)
      setDeleteGroup(null)
    }
  }

  // Get services count for the group being deleted
  const getGroupServicesCount = (groupId: string) => {
    return allServices.filter(service => service.groupId === groupId).length
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    })
  }

  // Define tactical table columns
  const tacticalColumns: TacticalTableColumn<Group>[] = [
    {
      key: 'name',
      header: 'Group Name',
      headerClassName: 'min-w-[150px]',
      render: (name, group) => (
        <Link 
          href={`/groups/${group.id}`}
          className="text-orange-400 hover:text-orange-300 hover:underline font-mono font-medium transition-colors duration-200"
        >
          {name}
        </Link>
      )
    },
    {
      key: 'description',
      header: 'Description',
      headerClassName: 'min-w-[200px]',
      render: (description) => (
        <span className="text-neutral-300 font-mono text-sm">
          {description || '-'}
        </span>
      )
    },
    {
      key: 'services',
      header: 'Services',
      headerClassName: 'w-[120px]',
      render: (_, group) => (
        <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 font-mono">
          {servicesCount[group.id] || 0}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      headerClassName: 'w-[120px]',
      render: (createdAt) => (
        <span className="text-neutral-400 font-mono text-sm">
          {formatDate(createdAt)}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'w-[80px]',
      render: (_, group) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TacticalButton
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-neutral-400 hover:text-orange-500 hover:bg-orange-500/20"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </TacticalButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-neutral-800 border-neutral-700">
            <DropdownMenuItem asChild>
              <Link href={`/groups/${group.id}`} className="text-white hover:bg-neutral-700">
                <Eye className="mr-2 h-4 w-4" />
                VIEW
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/groups/${group.id}/edit`} className="text-white hover:bg-neutral-700">
                <Edit className="mr-2 h-4 w-4" />
                EDIT
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteClick(group)}
              className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              DELETE
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ]

  // Loading skeleton
  if (loading) {
    return (
      <TacticalTable
        data={[]}
        columns={tacticalColumns}
        loading={true}
        emptyMessage="Loading groups data..."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Tactical Search and Filter Controls */}
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
        <div className="flex flex-col gap-4">
          {/* Local Search Bar for Groups */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="SEARCH GROUPS..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-9 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:ring-orange-500"
            />
            {filters.search && (
              <TacticalButton
                variant="ghost"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              >
                <X className="h-3 w-3" />
              </TacticalButton>
            )}
          </div>
        </div>
      </div>

      {/* Tactical Table */}
      <TacticalTable
        data={filteredGroups}
        columns={tacticalColumns}
        loading={loading}
        emptyMessage={filters.search ? "NO GROUPS MATCH YOUR SEARCH CRITERIA" : "NO GROUPS FOUND"}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteGroup}
        onOpenChange={(open) => !open && setDeleteGroup(null)}
        title="Delete Group"
        description={
          deleteGroup ? (
            <>
              Are you sure you want to delete the group &quot;{deleteGroup.name}&quot;?
              {getGroupServicesCount(deleteGroup.id) > 0 && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
                  <strong>Warning:</strong> This group has {getGroupServicesCount(deleteGroup.id)} associated service(s). 
                  You must reassign or remove these services before deleting the group.
                </div>
              )}
            </>
          ) : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        disabled={deleteGroup ? getGroupServicesCount(deleteGroup.id) > 0 : false}
      />
    </div>
  )
}