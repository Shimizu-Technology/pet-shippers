import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MessageCircle, Users } from 'lucide-react';
import { http } from '../lib/http';
import { Conversation, User } from '../types';
import { formatRelativeTime } from '../lib/utils';
import { Layout } from '../components/Layout';
import { Input } from '../components/ui/Input';

export const InboxPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['conversations', activeFilter, searchQuery],
    queryFn: async () => {
      try {
        console.log('Fetching conversations with filter:', activeFilter, 'search:', searchQuery);
        
        const params: Record<string, string> = {};
        
        if (activeFilter !== 'All') {
          params.kind = activeFilter === 'Clients' ? 'client' : activeFilter === 'Partners' ? 'partner' : activeFilter.toLowerCase();
        }
        
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        
        const response = await http.get('/conversations', { params });
        console.log('Conversations response:', response.data);
        return response.data.conversations as Conversation[];
      } catch (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await http.get('/users');
      return response.data.users as User[];
    },
  });

  const filters = ['All', 'Clients', 'Partners'];

  const getKindLabel = (kind: string) => {
    return kind === 'client' ? 'Client' : kind === 'partner' ? 'Partner' : 'Internal';
  };

  const getKindColor = (kind: string) => {
    const colors = {
      client: 'bg-blue-100 text-blue-800',
      partner: 'bg-green-100 text-green-800',
      internal: 'bg-purple-100 text-purple-800',
    };
    return colors[kind as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getParticipantDetails = (participantIds: string[]) => {
    if (!users) return { names: [], roles: [] };
    
    const participants = participantIds
      .map(id => users.find(u => u.id === id))
      .filter(Boolean) as User[];
    
    return {
      participants,
      names: participants.map(p => p.name),
      roles: participants.map(p => p.role),
    };
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      staff: 'bg-blue-100 text-blue-700', 
      partner: 'bg-green-100 text-green-700',
      client: 'bg-gray-100 text-gray-700',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#0E2A47] mb-3 sm:mb-4">Conversations</h1>
          
          {/* Search */}
          <div className="relative mb-3 sm:mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>

          {/* Filters */}
          <div className="flex space-x-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap touch-manipulation ${
                  activeFilter === filter
                    ? 'bg-[#0E2A47] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="space-y-2 sm:space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0E2A47]"></div>
              <p className="mt-2 text-gray-600">Loading conversations...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Error loading conversations</p>
              <p className="text-sm mt-2">{error.message}</p>
            </div>
          ) : data?.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No conversations found</h3>
              <p className="mt-2 text-gray-600">
                {searchQuery ? 'Try adjusting your search terms.' : 'Start a conversation to get started.'}
              </p>
            </div>
          ) : (
            data?.map((conversation) => {
              const { participants } = getParticipantDetails(conversation.participantIds);
              
              // Separate participants by role for cleaner display
              const clients = participants.filter(p => p.role === 'client');
              const staff = participants.filter(p => p.role === 'admin' || p.role === 'staff');
              const partners = participants.filter(p => p.role === 'partner');
              
              return (
                <Link
                  key={conversation.id}
                  to={`/inbox/${conversation.id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md hover:border-[#F3C0CF] transition-all touch-manipulation"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base sm:text-lg font-medium text-[#0E2A47] truncate pr-2">
                          {conversation.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getKindColor(conversation.kind)} flex-shrink-0`}>
                          {getKindLabel(conversation.kind)}
                        </span>
                      </div>
                      
                      {/* Clean participant summary */}
                      <div className="text-sm text-gray-600">
                        {clients.length > 0 && (
                          <span className="mr-3">
                            <span className="font-medium text-gray-900">
                              {clients.map(c => c.name.split(' ')[0]).join(', ')}
                            </span>
                            {clients.length === 1 ? ' (Customer)' : ' (Customers)'}
                          </span>
                        )}
                        {staff.length > 0 && (
                          <span className="mr-3">
                            <span className="font-medium text-[#0E2A47]">
                              {staff.map(s => s.name.split(' ')[0]).join(', ')}
                            </span>
                            {staff.length === 1 ? ' (Staff)' : ' (Staff)'}
                          </span>
                        )}
                        {partners.length > 0 && (
                          <span>
                            <span className="font-medium text-green-700">
                              {partners.map(p => p.name.split(' ')[0]).join(', ')}
                            </span>
                            {partners.length === 1 ? ' (Partner)' : ' (Partners)'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 sm:ml-4 text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm text-gray-500">
                        {formatRelativeTime(conversation.lastMessageAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};