import { supabase } from './supabase'

export const db = {
    // Dashboard Stats (Optimized)
    async getDashboardStats() {
        const { data: revenue, error: revError } = await supabase.rpc('get_total_revenue')
        const { data: pending, error: penError } = await supabase.rpc('get_pending_bills_count')
        const { count: members, error: memError } = await supabase
            .from('gym_members')
            .select('*', { count: 'exact', head: true })

        return {
            revenue: revenue || 0,
            pendingBills: pending || 0,
            totalMembers: members || 0,
            error: revError || penError || memError
        }
    },

    async getRecentMembers() {
        const { data, error } = await supabase
            .from('gym_members')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)
        return { data, error }
    },

    async getRecentBills() {
        const { data, error } = await supabase
            .from('gym_bills')
            .select('*, gym_members(full_name)')
            .order('created_at', { ascending: false })
            .limit(5)
        return { data, error }
    },

    // Members
    async getMembers() {
        const { data, error } = await supabase
            .from('gym_members')
            .select('*')
            .order('created_at', { ascending: false })
        return { data, error }
    },

    async getMemberProfile(userId) {
        const { data, error } = await supabase
            .from('gym_members')
            .select('*')
            .eq('user_id', userId)
            .single()
        return { data, error }
    },

    async addMember(memberData) {
        const { data, error } = await supabase
            .from('gym_members')
            .insert([memberData])
            .select()
        return { data, error }
    },

    async updateMember(id, updates) {
        const { data, error } = await supabase
            .from('gym_members')
            .update(updates)
            .eq('id', id)
            .select()
        return { data, error }
    },

    async deleteMember(id) {
        const { error } = await supabase
            .from('gym_members')
            .delete()
            .eq('id', id)
        return { error }
    },

    // Bills
    async getBills() {
        const { data, error } = await supabase
            .from('gym_bills')
            .select(`
        *,
        gym_members (full_name)
      `)
            .order('created_at', { ascending: false })
        return { data, error }
    },

    async getMyBills(memberId) {
        const { data, error } = await supabase
            .from('gym_bills')
            .select(`
        *,
        gym_members (full_name)
      `)
            .eq('member_id', memberId)
            .order('created_at', { ascending: false })
        return { data, error }
    },

    async createBill(billData) {
        const { data, error } = await supabase
            .from('gym_bills')
            .insert([billData])
            .select()
        return { data, error }
    },

    // Notifications
    async getNotifications(userId) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        return { data, error }
    },

    async createNotification(userId, message) {
        const { data, error } = await supabase
            .from('notifications')
            .insert([{ user_id: userId, message }])
            .single()
        return { data, error }
    },

    async runExpiryCheck() {
        const { error } = await supabase.rpc('notify_expiring_members')
        return { error }
    }
}
