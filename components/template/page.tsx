"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Monitor, Target, Users } from "lucide-react"
import { seoConfigs, SEOHead } from "@/components/common/seo-head"
import { Sidebar } from "./sidebar"
import { MainContent } from "./main-content"

interface TemplatePageProps {
    title?: string
    sections?: Array<{
        id: string
        icon: any
        label: string
        href: string
    }>
    currentSection?: string
    showSystemStatus?: boolean
    customSystemData?: {
        uptime?: string
        groups?: string
        services?: string
        status?: string
    }
    breadcrumb?: string
    children: React.ReactNode
}

export default function TemplatePage({
    title = "INFRASTRUCTURE",
    sections = [
        { id: "overview", icon: Monitor, label: "COMMAND", href: "/" },
        { id: "groups", icon: Users, label: "GROUPS", href: "/groups" },
        { id: "services", icon: Target, label: "SERVICES", href: "/services" },
    ],
    currentSection,
    showSystemStatus = true,
    customSystemData,
    breadcrumb,
    children
}: TemplatePageProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const pathname = usePathname()

    // Determine current section based on pathname if not explicitly provided
    const activeSection = currentSection || sections.find(section =>
        section.href === pathname || (section.href === "/" && pathname === "/")
    )?.id || sections[0].id

    const activeSectionData = sections.find(section => section.id === activeSection)

    return (
        <>
            <SEOHead {...seoConfigs.dashboard} />

            <div className="flex h-screen">
                <Sidebar
                    title={title}
                    sections={sections}
                    activeSection={activeSection}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    showSystemStatus={showSystemStatus}
                    systemData={customSystemData ?? {}}
                />

                <MainContent
                    title={title}
                    activeSection={activeSectionData}
                    sidebarCollapsed={sidebarCollapsed}
                    breadcrumb={breadcrumb}
                >
                    {children}
                </MainContent>
            </div>
        </>
    )
}