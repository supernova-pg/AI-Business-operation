'use client'

import { useContacts } from '../hooks/useContacts'
import { useCrmStore } from '../store/crm.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'

import { useDebounce } from '@/hooks/useDebounce'

export function ContactsTable() {
  const { contactsSearch, setContactsSearch, contactsPage, setContactsPage } = useCrmStore()
  const debouncedSearch = useDebounce(contactsSearch, 300)
  const limit = 10

  const { data, isLoading } = useContacts({
    page: contactsPage,
    limit,
    search: debouncedSearch,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search contacts..."
          value={contactsSearch}
          onChange={(e) => setContactsSearch(e.target.value)}
          className="max-w-sm bg-slate-900 border-slate-800 text-white"
        />
        <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
          Import CSV
        </Button>
      </div>

      <div className="rounded-md border border-slate-800 overflow-hidden bg-slate-900/50 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Name</TableHead>
              <TableHead className="text-slate-400">Email</TableHead>
              <TableHead className="text-slate-400">Company</TableHead>
              <TableHead className="text-right text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  Loading contacts...
                </TableCell>
              </TableRow>
            ) : data?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  No contacts found.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((contact: any) => (
                <TableRow key={contact.id} className="border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                  <TableCell className="font-medium text-slate-200">
                    {contact.firstName} {contact.lastName}
                  </TableCell>
                  <TableCell className="text-slate-400">{contact.email || '-'}</TableCell>
                  <TableCell className="text-slate-400">{contact.company || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/crm/contacts/${contact.id}`}>
                      <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setContactsPage(Math.max(1, contactsPage - 1))}
            disabled={contactsPage === 1}
            className="border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            Previous
          </Button>
          <div className="text-sm text-slate-400">
            Page {contactsPage} of {data.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setContactsPage(Math.min(data.totalPages, contactsPage + 1))}
            disabled={contactsPage === data.totalPages}
            className="border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
