"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Plus, Users, Monitor, Target, Eye, Server } from "lucide-react"
import TemplatePage from "@/components/template/page"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { GroupServicesTable } from "@/components/groups/group-services-table"
import { ConfirmationDialog } from "@/components/common/confirmation-dialog"
import { useGroup, useDeleteGroup, useGroupServices } from "@/lib/hooks/use-groups"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const groupId = params.id as string
  
  const { group, loading, error, refetch } = useGroup(groupId)
  const { services, loading: servicesLoading, error: servicesError, refetch: refetchServices } = useGroupServices(groupId)
  const deleteGroup = useDeleteGroup()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Combine group data with services
  const groupWithServices = group ? { ...group, services } : null
  const isLoading = loading || servicesLoading
  const hasError = error || servicesError

  const handleDelete = async () => {
    if (!group) return

    // Check if group has associated services
    if (services && services.length > 0) {
      toast({
        title: "Cannot delete group",
        description: `Group "${group.name}" has ${services.length} associated service(s). Please reassign or remove these services first.`,
        variant: "destructive",
      })
      setShowDeleteDialog(false)
      return
    }

    try {
      await deleteGroup.mutate(group.id)
      toast({
        title: "Group deleted",
        description: `Group "${group.name}" has been deleted successfully.`,
      })
      router.push('/groups')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive",
      })
    }
    setShowDeleteDialog(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <TemplatePage
        currentSection="groups"
        showSystemStatus={true}
        breadcrumb="VIEW"
      >
        <div className="p-6">
          {/* Loading Header */}
          <div className="border-b border-neutral-700 bg-neutral-800/50 backdrop-blur-sm rounded-lg mb-6">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
            </div>
          </div>

          {/* Loading Content */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
        </div>
      </TemplatePage>
    )
  }

  if (hasError || !group) {
    return (
      <TemplatePage
        currentSection="groups"
        showSystemStatus={true}
        breadcrumb="VIEW"
      >
        <div className="p-6">
          {/* Error Header */}
          <div className="border-b border-neutral-700 bg-neutral-800/50 backdrop-blur-sm rounded-lg mb-6">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 shadow-lg">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
                    Group Not Found
                  </h1>
                  <p className="text-sm text-neutral-400">Unable to load the requested group</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Content */}
          <div className="max-w-4xl">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2 text-white">Group Not Found</h3>
                  <p className="text-neutral-400 mb-4">
                    {hasError || "The requested group could not be found."}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        refetch()
                        refetchServices()
                      }}
                      className="bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    >
                      Try Again
                    </Button>
                    <Button 
                      asChild
                      className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                    >
                      <Link href="/groups">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Groups
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TemplatePage>
    )
  }

  return (
    <TemplatePage
      currentSection="groups"
      showSystemStatus={true}
      breadcrumb="VIEW"
    >
      <div className="p-6">
        {/* Group Detail Header */}
        <div className="border-b border-neutral-700 bg-neutral-800/50 backdrop-blur-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    {group.name}
                  </h1>
                  <p className="text-sm text-neutral-400">
                    Group • {services?.length || 0} Services
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  asChild
                  variant="outline"
                  className="bg-neutral-800 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300 font-medium tracking-wider"
                >
                  <Link href={`/groups/${group.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    EDIT
                  </Link>
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  className="bg-neutral-800 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 font-medium tracking-wider"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  DELETE
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Group Information Card */}
        <Card className="bg-neutral-900 border-neutral-700 mb-6">
          <CardHeader className="border-b border-neutral-700">
            <CardTitle className="text-white">GROUP INFORMATION</CardTitle>
            <CardDescription className="text-neutral-400">
              Core group details and metadata
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-neutral-300 tracking-wider">NAME</label>
                <p className="text-lg font-semibold text-white font-mono">{group.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-300 tracking-wider">SERVICES COUNT</label>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                    {services?.length || 0} SERVICES
                  </Badge>
                </div>
              </div>
              {group.description && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-neutral-300 tracking-wider">DESCRIPTION</label>
                  <p className="text-white">{group.description}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-neutral-300 tracking-wider">CREATED</label>
                <p className="text-white font-mono">{formatDate(group.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-300 tracking-wider">LAST UPDATED</label>
                <p className="text-white font-mono">{formatDate(group.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Associated Services */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="border-b border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">ASSOCIATED SERVICES</CardTitle>
                <CardDescription className="text-neutral-400">
                  Services that belong to this group
                </CardDescription>
              </div>
              <Button 
                asChild
                className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
              >
                <Link href={`/services/new?group=${group.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  ADD SERVICE
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {services && services.length > 0 ? (
              <GroupServicesTable 
                services={services}
                loading={servicesLoading}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-400 mb-4">
                  No services are associated with this group yet.
                </p>
                <Button 
                  asChild
                  className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                >
                  <Link href={`/services/new?group=${group.id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    ADD FIRST SERVICE
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Group"
        description={
          <>
            Are you sure you want to delete the group &quot;{group.name}&quot;?
            {services && services.length > 0 && (
              <div className="mt-2 p-2 bg-destructive/10 rounded text-sm">
                <strong>Warning:</strong> This group has {services.length} associated service(s). 
                You must reassign or remove these services before deleting the group.
              </div>
            )}
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
        disabled={services && services.length > 0}
      />
    </TemplatePage>
  )
}