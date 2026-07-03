"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, X, Server, Users, Filter, ArrowRight } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useServices } from "@/lib/hooks/use-services"
import { useGroups } from "@/lib/hooks/use-groups"
import { NetworkService, Group } from "@/lib/types"
import { cn } from "@/lib/utils"
import { 
  KEYBOARD_KEYS, 
  SCREEN_READER_MESSAGES, 
  ScreenReaderAnnouncer,
  generateId 
} from "@/lib/accessibility"

interface SearchResult {
  type: 'service' | 'group'
  id: string
  title: string
  subtitle: string
  description?: string
  href: string
  matches: string[]
}

interface GlobalSearchProps {
  className?: string
  placeholder?: string
  showResults?: boolean
  onResultSelect?: () => void
}

export function GlobalSearch({ 
  className, 
  placeholder = "Search services and groups...",
  showResults = true,
  onResultSelect
}: GlobalSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [announcer] = useState(() => ScreenReaderAnnouncer.getInstance())
  const searchId = generateId('search')
  const resultsId = generateId('search-results')
  const comboboxId = generateId('combobox')

  // Fetch data for search
  const { data: services, loading: servicesLoading } = useServices()
  const { data: groups, loading: groupsLoading } = useGroups()

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return []

    const results: SearchResult[] = []
    const searchTerm = query.toLowerCase()

    // Search services
    services.forEach(service => {
      const matches: string[] = []
      
      if (service.name.toLowerCase().includes(searchTerm)) {
        matches.push('name')
      }
      if (service.type.toLowerCase().includes(searchTerm)) {
        matches.push('type')
      }
      if (service.domain?.toLowerCase().includes(searchTerm)) {
        matches.push('domain')
      }
      if (service.ipAddress?.includes(searchTerm)) {
        matches.push('ip')
      }
      if (service.internalPorts?.some(port => port.toString().includes(searchTerm))) {
        matches.push('port')
      }
      if (service.vlan?.toString().includes(searchTerm)) {
        matches.push('vlan')
      }

      if (matches.length > 0) {
        results.push({
          type: 'service',
          id: service.id,
          title: service.name,
          subtitle: `${service.type} service`,
          description: service.domain || service.ipAddress || '',
          href: `/services/${service.id}`,
          matches
        })
      }
    })

    // Search groups
    groups.forEach(group => {
      const matches: string[] = []
      
      if (group.name.toLowerCase().includes(searchTerm)) {
        matches.push('name')
      }
      if (group.description?.toLowerCase().includes(searchTerm)) {
        matches.push('description')
      }

      if (matches.length > 0) {
        results.push({
          type: 'group',
          id: group.id,
          title: group.name,
          subtitle: `${group.services?.length || 0} services`,
          description: group.description || '',
          href: `/groups/${group.id}`,
          matches
        })
      }
    })

    // Sort by relevance (name matches first, then by match count)
    return results.sort((a, b) => {
      const aNameMatch = a.matches.includes('name')
      const bNameMatch = b.matches.includes('name')
      
      if (aNameMatch && !bNameMatch) return -1
      if (!aNameMatch && bNameMatch) return 1
      
      return b.matches.length - a.matches.length
    }).slice(0, 10) // Limit to 10 results
  }, [query, services, groups])

  // Handle search input
  const handleSearch = (value: string) => {
    setQuery(value)
    setSelectedIndex(-1)
    setIsOpen(value.length >= 2)
    
    // Announce search results to screen readers
    if (value.length >= 2) {
      setTimeout(() => {
        announcer.announce(SCREEN_READER_MESSAGES.SEARCH_RESULTS(searchResults.length))
      }, 300)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          const result = searchResults[selectedIndex]
          router.push(result.href)
          setIsOpen(false)
          onResultSelect?.()
        } else if (query.trim()) {
          // Navigate to services page with search query
          router.push(`/services?q=${encodeURIComponent(query)}`)
          setIsOpen(false)
          onResultSelect?.()
        }
        break
      case 'Escape':
        setIsOpen(false)
        searchRef.current?.blur()
        break
    }
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    router.push(result.href)
    setIsOpen(false)
    onResultSelect?.()
  }

  // Handle clear search
  const handleClear = () => {
    setQuery('')
    setIsOpen(false)
    setSelectedIndex(-1)
    searchRef.current?.focus()
  }

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Highlight matching text
  const highlightMatch = (text: string, matches: string[]) => {
    if (!query.trim()) return text

    const searchTerm = query.toLowerCase()
    const index = text.toLowerCase().indexOf(searchTerm)
    
    if (index === -1) return text

    return (
      <>
        {text.slice(0, index)}
        <mark className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {text.slice(index, index + searchTerm.length)}
        </mark>
        {text.slice(index + searchTerm.length)}
      </>
    )
  }

  const isLoading = servicesLoading || groupsLoading

  return (
    <div className={cn("relative", className)} ref={resultsRef}>
      <div className="relative" role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input
          ref={searchRef}
          id={searchId}
          type="text"
          role="searchbox"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-9 pr-9 keyboard-focus touch-target bg-gray-800 border-gray-700 text-gray-300 placeholder:text-gray-500 focus:border-pink-500 focus:ring-pink-500/20"
          aria-label="Search services and groups"
          aria-describedby={`${searchId}-description`}
          aria-controls={isOpen ? resultsId : undefined}
          aria-activedescendant={selectedIndex >= 0 ? `${resultsId}-option-${selectedIndex}` : undefined}
          autoComplete="off"
        />
        <div id={`${searchId}-description`} className="sr-only">
          Type at least 2 characters to search. Use arrow keys to navigate results, Enter to select.
        </div>
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-gray-700 keyboard-focus touch-target-sm text-gray-400 hover:text-gray-300"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-gray-900 to-gray-800">
          <CardContent className="p-0">
            {isLoading ? (
              <div 
                className="p-4 text-center text-sm text-gray-400"
                role="status"
                aria-live="polite"
              >
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div 
                id={resultsId}
                role="listbox"
                aria-label="Search results"
                className="max-h-96 overflow-y-auto"
              >
                {searchResults.map((result, index) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    id={`${resultsId}-option-${index}`}
                    role="option"
                    aria-selected={selectedIndex === index}
                    className={cn(
                      "flex items-center gap-3 p-3 cursor-pointer transition-colors keyboard-focus touch-target",
                      "hover:bg-gray-800/50",
                      selectedIndex === index && "bg-gray-800"
                    )}
                    onClick={() => handleResultClick(result)}
                    onKeyDown={(e) => {
                      if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
                        e.preventDefault()
                        handleResultClick(result)
                      }
                    }}
                    tabIndex={-1}
                    aria-label={`${result.title}, ${result.type}, ${result.subtitle}${result.description ? `, ${result.description}` : ''}`}
                  >
                    <div 
                      className="flex h-8 w-8 items-center justify-center rounded bg-gray-800"
                      aria-hidden="true"
                    >
                      {result.type === 'service' ? (
                        <Server className="h-4 w-4 text-cyan-400" />
                      ) : (
                        <Users className="h-4 w-4 text-pink-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-gray-100">
                          {highlightMatch(result.title, result.matches)}
                        </span>
                        <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300 border-gray-700">
                          {result.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {result.subtitle}
                        {result.description && (
                          <>
                            {' • '}
                            {highlightMatch(result.description, result.matches)}
                          </>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  </div>
                ))}
                
                {/* View all results link */}
                {query.trim() && (
                  <>
                    <Separator className="bg-gray-700" />
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          router.push(`/services?q=${encodeURIComponent(query)}`)
                          setIsOpen(false)
                          onResultSelect?.()
                        }}
                        className="w-full justify-start text-sm text-gray-300 hover:text-pink-400 hover:bg-gray-800/50"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        View all results for &quot;{query}&quot;
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-4 text-center">
                <div className="text-sm text-gray-400 mb-2">
                  No results found for &quot;{query}&quot;
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    router.push(`/services?q=${encodeURIComponent(query)}`)
                    setIsOpen(false)
                    onResultSelect?.()
                  }}
                  className="text-sm text-gray-300 hover:text-pink-400 hover:bg-gray-800/50"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search in all services
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}