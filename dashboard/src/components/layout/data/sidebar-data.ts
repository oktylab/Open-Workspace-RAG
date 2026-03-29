import {
  LayoutDashboard,
  MessageCircle,
  Settings,
  FileText,
  ListTodo,
  Tag,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Jobs',
          url: '/jobs',
          icon: ListTodo,
        },
        {
          title: 'Documents',
          url: '/documents',
          icon: FileText,
        },
        {
          title: 'Tags',
          url: '/tags',
          icon: Tag,
        },
        // {
        //   title: 'Tasks',
        //   url: '/tasks',
        //   icon: ListTodo,
        // },
        // {
        //   title: 'Apps',
        //   url: '/apps',
        //   icon: Package,
        // },
        {
          title: 'Chat',
          url: '/chat',
          icon: MessageCircle,
        },
        // {
        //   title: 'Chats',
        //   url: '/chats',
        //   icon: MessagesSquare,
        // },
        // {
        //   title: 'Users',
        //   url: '/users',
        //   icon: Users,
        // },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            // {
            //   title: 'Profile',
            //   url: '/settings',
            // },
            {
              title: 'Organization',
              url: '/settings/account',
            },
            {
              title: 'Workspaces',
              url: '/settings/workspaces',
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
            },
            // {
            //   title: 'Notifications',
            //   url: '/settings/notifications',
            // },
          ],
        },
        // {
        //   title: 'Help Center',
        //   url: '/help-center',
        //   icon: HelpCircle,
        // },
      ],
    },
  ],
}
