import BaseRepository from "./base.repository.js";
/**
 * User Repository
 * Encapsulates all database operations for User model
 */
declare class UserRepository extends BaseRepository {
    constructor(model: any);
    /**
     * Find user by email
     */
    findByEmail(email: any): Promise<any>;
    /**
     * Find user by normalized email
     */
    findByNormalizedEmail(normalizedEmail: any): Promise<any>;
    /**
     * Mark email as bounced
     */
    markEmailBounced(userId: any, reason: any): Promise<any>;
    /**
     * Mark email as complained
     */
    markEmailComplaint(userId: any): Promise<any>;
    /**
     * Verify user email
     */
    verifyEmail(userId: any): Promise<any>;
    /**
     * Find users with pagination
     */
    findWithPagination(filter?: any, options?: any): Promise<{
        users: any;
        pagination: {
            page: any;
            limit: any;
            total: any;
            pages: number;
        };
    }>;
}
export default UserRepository;
//# sourceMappingURL=user.repository.d.ts.map