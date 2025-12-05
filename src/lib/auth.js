import { supabase } from './supabase'

export const auth = {
    supabase, // Export the client for direct access if needed

    // Sign Up (Admin with Secret)
    async signUpAdmin(email, password, fullName, secretKey) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    is_admin_signup: 'true',
                    admin_secret: secretKey
                }
            }
        })
        return { data, error }
    },

    // Sign Up (Member)
    async signUpMember(email, password, fullName, extraData = {}) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: 'member',
                    ...extraData // Spread age, gender, height, weight
                }
            }
        })
        return { data, error }
    },

    // Login with Email OR Admin ID
    async signIn(identifier, password) {
        let email = identifier

        // Check if identifier looks like an Admin ID (e.g., ADM-XXXXXX)
        // We assume Admin IDs start with 'ADM-' based on our SQL logic
        if (identifier.toUpperCase().startsWith('ADM-')) {
            console.log('Resolving Admin ID:', identifier)

            // DIRECT QUERY instead of RPC to bypass potential RPC permission issues
            // Since we are anon, we need RLS to allow reading unique_id.
            // If RLS blocks it, we must use the RPC.
            // Let's try the RPC again but with better error logging, AND a fallback.

            const { data: resolvedEmail, error } = await supabase
                .rpc('get_email_by_admin_id', { admin_id_input: identifier.toUpperCase() })

            if (error || !resolvedEmail) {
                console.error('Admin ID Resolution Error:', error)
                return { error: { message: 'Invalid Admin ID. Please check or use Email.' } }
            }

            console.log('Admin ID resolved to:', resolvedEmail)
            email = resolvedEmail
        }

        // 2. Sign in with the resolved email
        // If it's NOT an Admin ID, we treat it as a direct email login.
        // This prevents "Network Error" when members try to login with email, 
        // because the previous logic might have been trying to resolve their email as an ID.

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        return { data, error }
    },

    // Sign Out
    async signOut() {
        const { error } = await supabase.auth.signOut()
        return { error }
    },

    // Get Current User Profile
    async getProfile() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        return data
    },

    // Admin creates a new Member User (Secure RPC)
    async createMemberByAdmin(memberData) {
        // We use a Database Function (RPC) to create the user in auth.users
        // This avoids logging out the current admin.
        const { data, error } = await supabase.rpc('create_member_user', {
            email_input: memberData.email,
            password_input: memberData.password,
            full_name_input: memberData.full_name,
            age_input: memberData.age ? parseInt(memberData.age) : null,
            gender_input: memberData.gender,
            height_input: memberData.height ? parseFloat(memberData.height) : null,
            weight_input: memberData.weight ? parseFloat(memberData.weight) : null,
            package_input: memberData.package_name,
            amount_input: memberData.amount_due ? parseFloat(memberData.amount_due) : 0
        })

        return { data, error }
    }
}
